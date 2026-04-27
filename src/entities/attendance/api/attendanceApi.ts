import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { logOperationEvent } from "@entities/operation-log/model/canonicalOperationLog";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  buildRevisionCondition,
  isConditionalCheckFailed,
} from "@shared/api/graphql/concurrency";
import { upsertAttendanceByStaffAndDate as upsertAttendanceByStaffAndDateDocument } from "@shared/api/graphql/documents/customMutations";
import { deleteAttendance as deleteAttendanceDocument } from "@shared/api/graphql/documents/mutations";
import {
  attendancesByStaffId,
  getAttendance,
} from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import { buildListAndItemTags } from "@shared/api/graphql/tagBuilder";
import type {
  Attendance,
  AttendancesByStaffIdQuery,
  CreateAttendanceInput,
  CreateAttendanceMutation,
  GetAttendanceQuery,
  UpdateAttendanceInput,
  UpdateAttendanceMutation,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { E02004 } from "@/errors";

import {
  buildAttendanceCacheId,
  buildAttendanceForList,
  buildAttendanceRecordId,
  buildDateListForRange,
  buildDuplicateConflictError,
  buildRevisionConflictError,
  buildStaffWorkDateKey,
  canFallbackToClientUpsert,
  extractErrorText,
  fetchAttendancesByStaffDate,
  mapUpsertActionToLogAction,
  resolveAttendanceLogAction,
  runCreateAttendanceMutation,
  runUpdateAttendanceMutation,
} from "./attendanceApi.helpers";
import type {
  AttendanceListResponse,
  AttendanceOperationLogContext,
  AttendanceQueryError,
  AttendanceWriteInputExtras,
  CreateAttendanceMutationArg,
  DeleteAttendanceMutationArg,
  DuplicateAttendanceInfo,
  UpdateAttendanceMutationArg,
  UpsertAttendanceByStaffAndDateInput,
  UpsertAttendanceByStaffAndDateMutation,
} from "./attendanceApi.types";
import { ATTENDANCE_DUPLICATE_CONFLICT } from "./attendanceApi.types";

export {
  buildAttendanceHistoryInput,
  sanitizeHourlyPaidHolidayTimes,
  sanitizeRests,
} from "./attendanceApi.helpers";
export type {
  AttendanceUpsertAction,
  CreateAttendanceMutationArg,
  DeleteAttendanceMutationArg,
  DuplicateAttendanceInfo,
  UpdateAttendanceMutationArg,
} from "./attendanceApi.types";
export {
  ATTENDANCE_DUPLICATE_CONFLICT,
  ATTENDANCE_REVISION_CONFLICT,
} from "./attendanceApi.types";

const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

// 重複データ警告を通知するカスタムイベント
const dispatchDuplicateWarning = (message: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("attendance-duplicate-warning", {
        detail: { message },
      }),
    );
  }
};

const writeAttendanceOperationLog = async ({
  action,
  attendance,
  before,
  logContext,
  metadata,
}: {
  action: string;
  attendance: Attendance;
  before?: Attendance | null;
  logContext?: AttendanceOperationLogContext;
  metadata?: Record<string, unknown>;
}) => {
  await logOperationEvent({
    action: resolveAttendanceLogAction(action, logContext?.action),
    resource: "attendance",
    resourceId: attendance.id,
    actorStaffId: logContext?.actorStaffId ?? undefined,
    targetStaffId: logContext?.targetStaffId ?? attendance.staffId ?? undefined,
    summary: logContext?.summary,
    before: before ?? null,
    after: attendance,
    details: {
      workDate: attendance.workDate,
      staffId: attendance.staffId,
      ...logContext?.details,
    },
    metadata: {
      workDate: attendance.workDate,
      staffId: attendance.staffId,
      ...metadata,
      ...logContext?.metadata,
    },
    resolvedWorkDate: attendance.workDate,
  });
};

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["Attendance"],
  endpoints: (builder) => ({
    getAttendanceByStaffAndDate: builder.query<
      Attendance | null,
      { staffId: string; workDate: string }
    >({
      async queryFn(
        { staffId, workDate },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const { attendances, error } = await fetchAttendancesByStaffDate(
          baseQuery,
          staffId,
          workDate,
        );
        if (error) {
          return { error };
        }

        if (attendances.length === 0) {
          return { data: null };
        }

        if (attendances.length > 1) {
          const duplicateIds = attendances
            .map((attendance) => attendance.id)
            .filter(Boolean);
          dispatchDuplicateWarning(E02004);
          return {
            error: buildDuplicateConflictError(staffId, workDate, duplicateIds),
          };
        }

        return { data: attendances[0] };
      },
      providesTags: (result, _error, arg) => {
        if (!result) {
          return [
            {
              type: "Attendance" as const,
              id: buildAttendanceCacheId(arg.staffId, arg.workDate),
            },
          ];
        }

        return [
          {
            type: "Attendance" as const,
            id: result.id || buildAttendanceCacheId(arg.staffId, arg.workDate),
          },
        ];
      },
    }),
    deleteAttendance: builder.mutation<Attendance, DeleteAttendanceMutationArg>(
      {
        async queryFn({ id, logContext }, _queryApi, _extraOptions, baseQuery) {
          const result = await baseQuery({
            document: deleteAttendanceDocument,
            variables: { input: { id } },
          });
          if (result.error) {
            return { error: result.error };
          }
          const data = result.data as {
            deleteAttendance?: Attendance | null;
          } | null;
          const deleted = data?.deleteAttendance;
          if (!deleted) {
            return { error: { message: "Failed to delete attendance" } };
          }

          await logOperationEvent({
            action: resolveAttendanceLogAction(
              "attendance.delete",
              logContext?.action,
            ),
            resource: "attendance",
            resourceId: deleted.id,
            actorStaffId: logContext?.actorStaffId ?? undefined,
            targetStaffId:
              logContext?.targetStaffId ?? deleted.staffId ?? undefined,
            summary: logContext?.summary,
            before: deleted,
            after: null,
            details: {
              workDate: deleted.workDate,
              staffId: deleted.staffId,
              ...logContext?.details,
            },
            metadata: {
              workDate: deleted.workDate,
              staffId: deleted.staffId,
              ...logContext?.metadata,
            },
            resolvedWorkDate: deleted.workDate,
          });

          return { data: deleted };
        },
        invalidatesTags: ["Attendance"],
      },
    ),
    getAttendanceById: builder.query<Attendance | null, { id: string }>({
      async queryFn({ id }, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: getAttendance,
          variables: { id },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as GetAttendanceQuery | null;
        return { data: data?.getAttendance ?? null };
      },
      providesTags: (result, _error, arg) => [
        {
          type: "Attendance" as const,
          id: result?.id || arg.id,
        },
      ],
    }),
    listRecentAttendances: builder.query<
      AttendanceListResponse,
      { staffId: string; days?: number }
    >({
      async queryFn(
        { staffId, days = 30 },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const safeDays = Math.max(1, days);
        const now = dayjs();
        const dateList = Array.from({ length: safeDays }, (_, index) =>
          now.subtract(index, "day").format(AttendanceDate.DataFormat),
        ).toSorted();

        const result = await baseQuery({
          document: attendancesByStaffId,
          variables: {
            staffId,
            workDate: {
              between: [dateList[0], dateList[dateList.length - 1]],
            },
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as AttendancesByStaffIdQuery | null;
        const connection = data?.attendancesByStaffId;

        if (!connection) {
          return { error: { message: "Failed to fetch attendance" } };
        }

        const fetchedAttendances = connection.items.filter(nonNullable);

        const duplicateCheck = new Map<string, Attendance[]>();
        const duplicateDetails: DuplicateAttendanceInfo[] = [];

        fetchedAttendances.forEach((attendance) =>
          duplicateCheck.set(attendance.workDate, [
            ...(duplicateCheck.get(attendance.workDate) ?? []),
            attendance,
          ]),
        );

        for (const attendances of duplicateCheck.values()) {
          if (attendances.length > 1) {
            duplicateDetails.push({
              workDate: attendances[0]?.workDate ?? "",
              ids: attendances
                .map((attendance) => attendance.id)
                .filter(Boolean),
              staffId,
            });
            dispatchDuplicateWarning(E02004);
          }
        }

        if (duplicateDetails.length > 0) {
          return {
            error: {
              message: E02004,
              details: {
                code: ATTENDANCE_DUPLICATE_CONFLICT,
                staffId,
                duplicates: duplicateDetails,
              },
            },
          };
        }

        const attendanceList = dateList.map((targetDate) => {
          const matches = duplicateCheck.get(targetDate) ?? [];
          const match = matches[0] ?? null;

          return buildAttendanceForList(targetDate, match);
        });

        return {
          data: {
            attendances: attendanceList,
          },
        };
      },
      providesTags: (result) =>
        buildListAndItemTags(
          "Attendance",
          result?.attendances,
          (a) => a.id || buildAttendanceCacheId(a.staffId, a.workDate),
        ),
    }),
    listRecentAttendancesWithWarnings: builder.query<
      AttendanceListResponse,
      { staffId: string; days?: number }
    >({
      async queryFn(
        { staffId, days = 30 },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const safeDays = Math.max(1, days);
        const now = dayjs();
        const dateList = Array.from({ length: safeDays }, (_, index) =>
          now.subtract(index, "day").format(AttendanceDate.DataFormat),
        ).toSorted();

        const result = await baseQuery({
          document: attendancesByStaffId,
          variables: {
            staffId,
            workDate: {
              between: [dateList[0], dateList[dateList.length - 1]],
            },
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as AttendancesByStaffIdQuery | null;
        const connection = data?.attendancesByStaffId;

        if (!connection) {
          return { error: { message: "Failed to fetch attendance" } };
        }

        const fetchedAttendances = connection.items.filter(nonNullable);

        // 重複チェック: 同一日付に複数のレコードがないか確認
        const duplicateCheck = new Map<string, Attendance[]>();
        const duplicateDetails: DuplicateAttendanceInfo[] = [];
        fetchedAttendances.forEach((attendance) => {
          const existing = duplicateCheck.get(attendance.workDate) ?? [];
          existing.push(attendance);
          duplicateCheck.set(attendance.workDate, existing);
        });

        // 重複が見つかった場合、警告メッセージを生成（エラーとしては返さない）
        for (const attendances of duplicateCheck.values()) {
          if (attendances.length > 1) {
            duplicateDetails.push({
              workDate: attendances[0]?.workDate ?? "",
              ids: attendances
                .map((attendance) => attendance.id)
                .filter(Boolean),
              staffId,
            });
            // カスタムイベントで通知
            dispatchDuplicateWarning(E02004);
          }
        }

        if (duplicateDetails.length > 0) {
          return {
            error: {
              message: E02004,
              details: {
                code: ATTENDANCE_DUPLICATE_CONFLICT,
                staffId,
                duplicates: duplicateDetails,
              },
            },
          };
        }

        // 重複があっても最初のレコードを使用してデータを返す
        const attendanceList = dateList.map((targetDate) => {
          const matches = duplicateCheck.get(targetDate) ?? [];
          // 最初のレコードを使用
          const match = matches[0] ?? null;

          return buildAttendanceForList(targetDate, match);
        });

        // 警告がある場合は、警告情報を含めて返す
        return {
          data: {
            attendances: attendanceList,
          },
        };
      },
      providesTags: (result) =>
        buildListAndItemTags(
          "Attendance",
          result?.attendances,
          (a) => a.id || buildAttendanceCacheId(a.staffId, a.workDate),
        ),
    }),
    listAttendancesByDateRange: builder.query<
      Attendance[],
      { staffId: string; startDate: string; endDate: string }
    >({
      async queryFn(
        { staffId, startDate, endDate },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const paginatedResult = await executePaginatedQuery<Attendance>({
          baseQuery,
          document: attendancesByStaffId,
          variables: {
            staffId,
            workDate: { between: [startDate, endDate] },
            sortDirection: "ASC",
          },
          connectionExtractor: (data) =>
            (data as AttendancesByStaffIdQuery | null)?.attendancesByStaffId,
          errorMessage: "Failed to fetch attendance",
        });

        if (paginatedResult.error) {
          return { error: paginatedResult.error };
        }

        const attendances = paginatedResult.data;
        const duplicateCheck = new Map<string, Attendance[]>();
        const duplicateDetails: DuplicateAttendanceInfo[] = [];
        attendances.forEach((attendance) => {
          const existing = duplicateCheck.get(attendance.workDate) ?? [];
          existing.push(attendance);
          duplicateCheck.set(attendance.workDate, existing);
        });

        // 重複が見つかった場合、警告メッセージを生成（エラーとしては返さない）
        for (const attendancesForDate of duplicateCheck.values()) {
          if (attendancesForDate.length > 1) {
            duplicateDetails.push({
              workDate: attendancesForDate[0]?.workDate ?? "",
              ids: attendancesForDate
                .map((attendance) => attendance.id)
                .filter(Boolean),
              staffId,
            });
            // カスタムイベントで通知
            dispatchDuplicateWarning(E02004);
          }
        }

        if (duplicateDetails.length > 0) {
          return {
            error: {
              message: E02004,
              details: {
                code: ATTENDANCE_DUPLICATE_CONFLICT,
                staffId,
                duplicates: duplicateDetails,
              },
            },
          };
        }

        return { data: attendances };
      },
      providesTags: (_result, _error, arg) => [
        { type: "Attendance" as const, id: "LIST" },
        {
          type: "Attendance" as const,
          id: `RANGE-${arg.staffId}-${arg.startDate}-${arg.endDate}`,
        },
      ],
    }),
    listAttendancesByDateRangeWithPlaceholders: builder.query<
      AttendanceListResponse,
      { staffId: string; startDate: string; endDate: string }
    >({
      async queryFn(
        { staffId, startDate, endDate },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const dateList = buildDateListForRange(startDate, endDate);

        if (dateList.length === 0) {
          return {
            data: {
              attendances: [],
            },
          };
        }

        const result = await baseQuery({
          document: attendancesByStaffId,
          variables: {
            staffId,
            workDate: {
              between: [dateList[0], dateList[dateList.length - 1]],
            },
            sortDirection: "ASC",
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as AttendancesByStaffIdQuery | null;
        const connection = data?.attendancesByStaffId;

        if (!connection) {
          return { error: { message: "Failed to fetch attendance" } };
        }

        const fetchedAttendances = connection.items.filter(nonNullable);

        const duplicateCheck = new Map<string, Attendance[]>();
        const duplicateDetails: DuplicateAttendanceInfo[] = [];

        fetchedAttendances.forEach((attendance) => {
          const existing = duplicateCheck.get(attendance.workDate) ?? [];
          existing.push(attendance);
          duplicateCheck.set(attendance.workDate, existing);
        });

        for (const attendancesForDate of duplicateCheck.values()) {
          if (attendancesForDate.length > 1) {
            duplicateDetails.push({
              workDate: attendancesForDate[0]?.workDate ?? "",
              ids: attendancesForDate
                .map((attendance) => attendance.id)
                .filter(Boolean),
              staffId,
            });
            dispatchDuplicateWarning(E02004);
          }
        }

        if (duplicateDetails.length > 0) {
          return {
            error: {
              message: E02004,
              details: {
                code: ATTENDANCE_DUPLICATE_CONFLICT,
                staffId,
                duplicates: duplicateDetails,
              },
            },
          };
        }

        return {
          data: {
            attendances: dateList.map((targetDate) => {
              const matches = duplicateCheck.get(targetDate) ?? [];
              const match = matches[0] ?? null;
              return buildAttendanceForList(targetDate, match);
            }),
          },
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: "Attendance" as const, id: "LIST" },
        {
          type: "Attendance" as const,
          id: `RANGE-WITH-PLACEHOLDERS-${arg.staffId}-${arg.startDate}-${arg.endDate}`,
        },
      ],
    }),
    createAttendance: builder.mutation<Attendance, CreateAttendanceMutationArg>(
      {
        async queryFn(arg, _queryApi, _extraOptions, baseQuery) {
          const { logContext, ...input } = arg;
          const { attendances: existingAttendances, error: existingError } =
            await fetchAttendancesByStaffDate(
              baseQuery,
              input.staffId,
              input.workDate,
            );

          if (existingError) {
            return { error: existingError };
          }

          if (existingAttendances.length > 1) {
            const ids = existingAttendances
              .map((attendance) => attendance.id)
              .filter(Boolean);
            dispatchDuplicateWarning(E02004);
            return {
              error: buildDuplicateConflictError(
                input.staffId,
                input.workDate,
                ids,
              ),
            };
          }

          if (existingAttendances.length === 1) {
            return {
              error: buildDuplicateConflictError(
                input.staffId,
                input.workDate,
                [existingAttendances[0].id],
              ),
            };
          }

          const payload: CreateAttendanceInput & AttendanceWriteInputExtras = {
            ...input,
            id: buildAttendanceRecordId(input.staffId, input.workDate),
            revision: 1,
            staffWorkDateKey: buildStaffWorkDateKey(
              input.staffId,
              input.workDate,
            ),
          };

          const result = await runCreateAttendanceMutation(baseQuery, payload);

          if (result.error) {
            const message = extractErrorText(result.error);
            if (isConditionalCheckFailed(message)) {
              const { attendances: reloadedAttendances, error: reloadError } =
                await fetchAttendancesByStaffDate(
                  baseQuery,
                  input.staffId,
                  input.workDate,
                );
              if (reloadError) {
                return { error: reloadError };
              }

              if (reloadedAttendances.length > 0) {
                return {
                  error: buildDuplicateConflictError(
                    input.staffId,
                    input.workDate,
                    reloadedAttendances
                      .map((attendance) => attendance.id)
                      .filter(Boolean),
                  ),
                };
              }
            }
            return { error: result.error };
          }

          const data = result.data as CreateAttendanceMutation | null;
          const createdAttendance = data?.createAttendance;

          if (!createdAttendance) {
            return { error: { message: "Failed to create attendance" } };
          }

          await writeAttendanceOperationLog({
            action: "attendance.create",
            attendance: createdAttendance,
            before: null,
            logContext,
          });

          return { data: createdAttendance };
        },
        invalidatesTags: (result) =>
          buildListAndItemTags(
            "Attendance",
            result ? [result] : undefined,
            (r) => r.id || buildAttendanceCacheId(r.staffId, r.workDate),
          ),
      },
    ),
    upsertAttendanceByStaffAndDate: builder.mutation<
      Attendance,
      UpsertAttendanceByStaffAndDateInput
    >({
      async queryFn(
        { input, action, occurredAt, idempotencyKey, logContext },
        _queryApi,
        _extraOptions,
        baseQuery,
      ) {
        const { staffId, workDate } = input;
        if (!staffId || !workDate) {
          return {
            error: {
              message:
                "Upsert input requires both staffId and workDate (YYYY-MM-DD)",
            },
          };
        }

        const loadByStaffDate = async (): Promise<
          { attendance: Attendance | null } | { error: AttendanceQueryError }
        > => {
          const loaded = await fetchAttendancesByStaffDate(
            baseQuery,
            staffId,
            workDate,
          );
          if (loaded.error) {
            return { error: loaded.error };
          }

          if (loaded.attendances.length > 1) {
            dispatchDuplicateWarning(E02004);
            return {
              error: buildDuplicateConflictError(
                staffId,
                workDate,
                loaded.attendances
                  .map((attendance) => attendance.id)
                  .filter(Boolean),
              ),
            };
          }

          return { attendance: loaded.attendances[0] ?? null };
        };

        const initialLoad = await loadByStaffDate();
        if ("error" in initialLoad) {
          return { error: initialLoad.error };
        }

        const previousAttendance = initialLoad.attendance;

        const serverUpsertResult = await baseQuery({
          document: upsertAttendanceByStaffAndDateDocument,
          variables: {
            input: {
              ...input,
              staffId,
              workDate,
              action,
              occurredAt,
              idempotencyKey,
            },
          },
        });
        if (!serverUpsertResult.error) {
          const data =
            serverUpsertResult.data as UpsertAttendanceByStaffAndDateMutation | null;
          const upserted = data?.upsertAttendanceByStaffAndDate;
          if (upserted) {
            await writeAttendanceOperationLog({
              action: mapUpsertActionToLogAction(action),
              attendance: upserted,
              before: previousAttendance,
              logContext,
              metadata: {
                occurredAt,
                idempotencyKey,
                source: "server_upsert",
              },
            });
            return { data: upserted };
          }
        } else {
          if (!canFallbackToClientUpsert(serverUpsertResult.error)) {
            return { error: serverUpsertResult.error as AttendanceQueryError };
          }
        }

        const upsertCreatePayload: CreateAttendanceInput &
          AttendanceWriteInputExtras = {
          ...input,
          id: buildAttendanceRecordId(staffId, workDate),
          revision: 1,
          staffWorkDateKey: buildStaffWorkDateKey(staffId, workDate),
        };

        const resolveInputField = <K extends keyof CreateAttendanceInput>(
          key: K,
          fallback: UpdateAttendanceInput[K],
        ): UpdateAttendanceInput[K] =>
          Object.prototype.hasOwnProperty.call(input, key)
            ? (input[key] as unknown as UpdateAttendanceInput[K])
            : fallback;

        const applyUpdate = async (
          sourceAttendance: Attendance,
          hasRetried = false,
        ): Promise<{ data: Attendance } | { error: AttendanceQueryError }> => {
          const expectedRevision = sourceAttendance.revision ?? 1;

          const updatePayload: UpdateAttendanceInput &
            AttendanceWriteInputExtras = {
            id: sourceAttendance.id,
            staffId,
            workDate,
            startTime: resolveInputField(
              "startTime",
              sourceAttendance.startTime,
            ),
            endTime: resolveInputField("endTime", sourceAttendance.endTime),
            goDirectlyFlag: resolveInputField(
              "goDirectlyFlag",
              sourceAttendance.goDirectlyFlag,
            ),
            returnDirectlyFlag: resolveInputField(
              "returnDirectlyFlag",
              sourceAttendance.returnDirectlyFlag,
            ),
            absentFlag: resolveInputField(
              "absentFlag",
              sourceAttendance.absentFlag,
            ),
            rests: resolveInputField("rests", sourceAttendance.rests),
            hourlyPaidHolidayTimes: resolveInputField(
              "hourlyPaidHolidayTimes",
              sourceAttendance.hourlyPaidHolidayTimes,
            ),
            remarks: resolveInputField("remarks", sourceAttendance.remarks),
            paidHolidayFlag: resolveInputField(
              "paidHolidayFlag",
              sourceAttendance.paidHolidayFlag,
            ),
            specialHolidayFlag: resolveInputField(
              "specialHolidayFlag",
              sourceAttendance.specialHolidayFlag,
            ),
            isDeemedHoliday: resolveInputField(
              "isDeemedHoliday",
              sourceAttendance.isDeemedHoliday,
            ),
            hourlyPaidHolidayHours: resolveInputField(
              "hourlyPaidHolidayHours",
              sourceAttendance.hourlyPaidHolidayHours,
            ),
            substituteHolidayDate: resolveInputField(
              "substituteHolidayDate",
              sourceAttendance.substituteHolidayDate,
            ),
            changeRequests: resolveInputField(
              "changeRequests",
              sourceAttendance.changeRequests,
            ),
            systemComments: resolveInputField(
              "systemComments",
              sourceAttendance.systemComments,
            ),
            revision: expectedRevision + 1,
            staffWorkDateKey: buildStaffWorkDateKey(staffId, workDate),
          };

          const updateResult = await runUpdateAttendanceMutation(
            baseQuery,
            updatePayload,
            buildRevisionCondition(expectedRevision),
          );

          if (!updateResult.error) {
            const data = updateResult.data as UpdateAttendanceMutation | null;
            const updatedAttendance = data?.updateAttendance;
            if (!updatedAttendance) {
              return { error: { message: "Failed to update attendance" } };
            }
            await writeAttendanceOperationLog({
              action: mapUpsertActionToLogAction(action),
              attendance: updatedAttendance,
              before: sourceAttendance,
              logContext,
              metadata: {
                occurredAt,
                idempotencyKey,
                source: "client_upsert_update",
              },
            });
            return { data: updatedAttendance };
          }

          const message = extractErrorText(updateResult.error);
          if (!isConditionalCheckFailed(message) || hasRetried) {
            if (isConditionalCheckFailed(message)) {
              return {
                error: buildRevisionConflictError(
                  sourceAttendance.id,
                  expectedRevision,
                ),
              };
            }
            return { error: updateResult.error as AttendanceQueryError };
          }

          const reloaded = await loadByStaffDate();
          if ("error" in reloaded) {
            return { error: reloaded.error };
          }
          if (!reloaded.attendance) {
            return {
              error: { message: "Failed to reload attendance during upsert" },
            };
          }
          return applyUpdate(reloaded.attendance, true);
        };

        if (previousAttendance) {
          return await applyUpdate(previousAttendance);
        }

        const createResult = await runCreateAttendanceMutation(
          baseQuery,
          upsertCreatePayload,
        );

        if (!createResult.error) {
          const created = (createResult.data as CreateAttendanceMutation | null)
            ?.createAttendance;
          if (!created) {
            return { error: { message: "Failed to create attendance" } };
          }
          await writeAttendanceOperationLog({
            action: mapUpsertActionToLogAction(action),
            attendance: created,
            before: null,
            logContext,
            metadata: {
              occurredAt,
              idempotencyKey,
              source: "client_upsert_create",
            },
          });
          return { data: created };
        }

        const createErrorMessage = extractErrorText(createResult.error);
        if (!isConditionalCheckFailed(createErrorMessage)) {
          return { error: createResult.error as AttendanceQueryError };
        }

        const reloaded = await loadByStaffDate();
        if ("error" in reloaded) {
          return { error: reloaded.error };
        }
        if (!reloaded.attendance) {
          return { error: createResult.error as AttendanceQueryError };
        }

        return await applyUpdate(reloaded.attendance, true);
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag = { type: "Attendance" as const, id: "LIST" };
        if (!result) {
          return [
            listTag,
            {
              type: "Attendance" as const,
              id: buildAttendanceCacheId(arg.input.staffId, arg.input.workDate),
            },
          ];
        }

        return [
          listTag,
          {
            type: "Attendance" as const,
            id:
              result.id ||
              buildAttendanceCacheId(result.staffId, result.workDate),
          },
        ];
      },
    }),
    updateAttendance: builder.mutation<Attendance, UpdateAttendanceMutationArg>(
      {
        async queryFn(arg, _queryApi, _extraOptions, baseQuery) {
          const { logContext, ...input } = arg;
          const loadCurrentAttendance = async () => {
            const currentResult = await baseQuery({
              document: getAttendance,
              variables: { id: input.id },
            });

            if (currentResult.error) {
              return { error: currentResult.error as { message: string } };
            }

            const currentData = currentResult.data as GetAttendanceQuery | null;
            const currentAttendance = currentData?.getAttendance;

            if (!currentAttendance) {
              return {
                error: {
                  message: "Failed to load current attendance",
                } as const,
              };
            }

            return { currentAttendance };
          };

          const loaded = await loadCurrentAttendance();
          if ("error" in loaded) {
            return { error: loaded.error };
          }

          let currentAttendance = loaded.currentAttendance;
          let expectedRevision =
            input.revision ?? currentAttendance.revision ?? 1;
          let hasRetried = false;

          while (true) {
            const currentRevision = currentAttendance.revision ?? 1;
            if (expectedRevision !== currentRevision) {
              if (hasRetried) {
                return {
                  error: buildRevisionConflictError(input.id, currentRevision),
                };
              }
              expectedRevision = currentRevision;
              hasRetried = true;
            }

            const payload: UpdateAttendanceInput & AttendanceWriteInputExtras =
              {
                ...input,
                revision: expectedRevision + 1,
                staffWorkDateKey: buildStaffWorkDateKey(
                  currentAttendance.staffId,
                  currentAttendance.workDate,
                ),
              };

            const result = await runUpdateAttendanceMutation(
              baseQuery,
              payload,
              buildRevisionCondition(expectedRevision),
            );

            if (!result.error) {
              const data = result.data as UpdateAttendanceMutation | null;
              const updatedAttendance = data?.updateAttendance;
              if (!updatedAttendance) {
                return { error: { message: "Failed to update attendance" } };
              }
              await writeAttendanceOperationLog({
                action: "attendance.update",
                attendance: updatedAttendance,
                before: currentAttendance,
                logContext,
              });
              return { data: updatedAttendance };
            }

            const message = extractErrorText(result.error);
            if (!isConditionalCheckFailed(message) || hasRetried) {
              if (isConditionalCheckFailed(message)) {
                return {
                  error: buildRevisionConflictError(input.id, expectedRevision),
                };
              }
              return { error: result.error };
            }

            const latest = await loadCurrentAttendance();
            if ("error" in latest) {
              return { error: latest.error };
            }

            currentAttendance = latest.currentAttendance;
            expectedRevision = currentAttendance.revision ?? 1;
            hasRetried = true;
          }
        },
        onQueryStarted: async (
          _input,
          { dispatch, queryFulfilled, getState },
        ) => {
          try {
            const { data: updatedAttendance } = await queryFulfilled;
            const { workDate, staffId } = updatedAttendance;

            type ApiCacheState = {
              attendanceApi?: {
                queries?: Record<
                  string,
                  | {
                      endpointName?: string;
                      originalArgs?: unknown;
                      status?: string;
                    }
                  | undefined
                >;
              };
            };

            const queries = (getState() as ApiCacheState).attendanceApi
              ?.queries;
            if (!queries) return;

            for (const queryEntry of Object.values(queries)) {
              if (
                !queryEntry ||
                queryEntry.endpointName !== "listAttendancesByDateRange" ||
                queryEntry.status !== "fulfilled"
              ) {
                continue;
              }

              const args = queryEntry.originalArgs as {
                staffId: string;
                startDate: string;
                endDate: string;
              };

              if (
                args.staffId !== staffId ||
                workDate < args.startDate ||
                workDate > args.endDate
              ) {
                continue;
              }

              dispatch(
                attendanceApi.util.updateQueryData(
                  "listAttendancesByDateRange",
                  args,
                  (draft) => {
                    const index = draft.findIndex(
                      (a) => a.id === updatedAttendance.id,
                    );
                    if (index !== -1) {
                      Object.assign(draft[index], updatedAttendance);
                    }
                  },
                ),
              );
            }
          } catch {
            // mutation failed, no cache update needed
          }
        },
        invalidatesTags: (result) => {
          const listTag = { type: "Attendance" as const, id: "LIST" };
          if (!result) {
            return [listTag];
          }

          return [
            listTag,
            {
              type: "Attendance" as const,
              id:
                result.id ||
                buildAttendanceCacheId(result.staffId, result.workDate),
            },
          ];
        },
      },
    ),
  }),
});

export const {
  useGetAttendanceByStaffAndDateQuery,
  useLazyGetAttendanceByStaffAndDateQuery,
  useGetAttendanceByIdQuery,
  useLazyGetAttendanceByIdQuery,
  useListAttendancesByDateRangeQuery,
  useLazyListAttendancesByDateRangeQuery,
  useListAttendancesByDateRangeWithPlaceholdersQuery,
  useLazyListAttendancesByDateRangeWithPlaceholdersQuery,
  useListRecentAttendancesQuery,
  useLazyListRecentAttendancesQuery,
  useListRecentAttendancesWithWarningsQuery,
  useCreateAttendanceMutation,
  useUpsertAttendanceByStaffAndDateMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApi;
