import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import {
  createShiftRequest,
  updateShiftRequest,
} from "@shared/api/graphql/documents/mutations";
import { listShiftRequests } from "@shared/api/graphql/documents/queries";
import {
  CreateShiftRequestMutation,
  ListShiftRequestsQuery,
  ShiftRequestDayPreferenceInput,
  ShiftRequestHistoryInput,
  UpdateShiftRequestMutation,
} from "@shared/api/graphql/types";
import { GraphQLResult } from "aws-amplify/api";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";

import { graphqlClient } from "@/shared/api/amplify/graphqlClient";

import { ShiftState } from "../lib/generateMockShifts";
import { buildSummaryFromAssignments } from "../lib/shiftAssignments";
import {
  convertHistoryToInput,
  ShiftRequestHistoryMeta,
  ShiftRequestRecordSnapshot,
} from "../lib/shiftRequests";
import {
  SHIFT_MANUAL_CHANGE_REASON,
  shiftRequestStatusToShiftState,
  shiftStateToShiftRequestStatus,
} from "../lib/shiftStateMapping";

type UseShiftRequestAssignmentsParams = {
  shiftStaffs: StaffType[];
  monthStart: Dayjs;
  cognitoUserId?: string | null;
  enabled?: boolean;
};

type UseShiftRequestAssignmentsResult = {
  shiftRequestAssignments: Map<string, Record<string, ShiftState>>;
  shiftRequestHistoryMeta: Map<string, ShiftRequestHistoryMeta>;
  shiftRequestRecords: Map<string, ShiftRequestRecordSnapshot>;
  shiftRequestsLoading: boolean;
  shiftRequestsError: string | null;
  persistShiftRequestChanges: (
    staffId: string,
    dayKeys: string[],
    nextState: ShiftState,
  ) => Promise<void>;
};

export default function useShiftRequestAssignments({
  shiftStaffs,
  monthStart,
  cognitoUserId,
  enabled = true,
}: UseShiftRequestAssignmentsParams): UseShiftRequestAssignmentsResult {
  const [shiftRequestAssignments, setShiftRequestAssignments] = useState<
    Map<string, Record<string, ShiftState>>
  >(new Map());
  const [shiftRequestHistoryMeta, setShiftRequestHistoryMeta] = useState<
    Map<string, ShiftRequestHistoryMeta>
  >(new Map());
  const [shiftRequestRecords, setShiftRequestRecords] = useState<
    Map<string, ShiftRequestRecordSnapshot>
  >(new Map());
  const [shiftRequestsLoading, setShiftRequestsLoading] = useState(false);
  const [shiftRequestsError, setShiftRequestsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) {
      setShiftRequestAssignments(new Map());
      setShiftRequestHistoryMeta(new Map());
      setShiftRequestRecords(new Map());
      setShiftRequestsLoading(false);
      setShiftRequestsError(null);
      return;
    }

    if (!shiftStaffs || shiftStaffs.length === 0) {
      setShiftRequestAssignments(new Map());
      setShiftRequestHistoryMeta(new Map());
      setShiftRequestRecords(new Map());
      return;
    }

    let isMounted = true;
    const fetchShiftRequests = async () => {
      setShiftRequestsLoading(true);
      setShiftRequestsError(null);
      try {
        const staffIdSet = new Set(shiftStaffs.map((s) => s.id));
        const targetMonthKey = monthStart.format("YYYY-MM");
        const nextAssignments = new Map<string, Record<string, ShiftState>>();
        const nextHistoryMeta = new Map<string, ShiftRequestHistoryMeta>();
        const nextRecords = new Map<string, ShiftRequestRecordSnapshot>();
        let nextToken: string | null | undefined = undefined;

        do {
          const response = (await graphqlClient.graphql({
            query: listShiftRequests,
            variables: {
              filter: { targetMonth: { eq: targetMonthKey } },
              limit: 500,
              nextToken,
            },
            authMode: "userPool",
          })) as GraphQLResult<ListShiftRequestsQuery>;

          if (!isMounted) return;

          if (response.errors) {
            throw new Error(response.errors.map((e) => e.message).join(","));
          }

          const items =
            response.data?.listShiftRequests?.items?.filter(
              (item): item is NonNullable<typeof item> => item !== null,
            ) ?? [];

          items.forEach((item) => {
            if (!staffIdSet.has(item.staffId)) return;
            const per: Record<string, ShiftState> = {};
            item.entries
              ?.filter(
                (entry): entry is NonNullable<typeof entry> => entry !== null,
              )
              .forEach((entry) => {
                per[entry.date] = shiftRequestStatusToShiftState(entry.status);
              });
            nextAssignments.set(item.staffId, per);

            const histories =
              item.histories?.filter(
                (history): history is NonNullable<typeof history> =>
                  history !== null,
              ) ?? [];
            const changeCount = histories.length;
            let latestChangeAt: string | null = null;
            histories.forEach((history) => {
              const candidate = history.recordedAt ?? null;
              if (!candidate) return;
              if (!latestChangeAt || dayjs(candidate).isAfter(latestChangeAt)) {
                latestChangeAt = candidate;
              }
            });
            nextHistoryMeta.set(item.staffId, {
              changeCount,
              latestChangeAt,
            });

            const historyInputs = histories.map(convertHistoryToInput);
            nextRecords.set(item.staffId, {
              id: item.id,
              version: item.version ?? undefined,
              histories: historyInputs,
              note: item.note ?? undefined,
              submittedAt: item.submittedAt ?? undefined,
              targetMonth: item.targetMonth ?? targetMonthKey,
            });
          });

          nextToken = response.data?.listShiftRequests?.nextToken ?? null;
        } while (nextToken);

        if (!isMounted) return;
        setShiftRequestAssignments(nextAssignments);
        setShiftRequestHistoryMeta(nextHistoryMeta);
        setShiftRequestRecords(nextRecords);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setShiftRequestsError("希望シフトの取得に失敗しました。");
        }
      } finally {
        if (isMounted) {
          setShiftRequestsLoading(false);
        }
      }
    };

    fetchShiftRequests();

    return () => {
      isMounted = false;
    };
  }, [enabled, monthStart, shiftStaffs]);

  const persistShiftRequestChanges = useCallback(
    async (staffId: string, dayKeys: string[], nextState: ShiftState) => {
      const timestamp = dayjs().toISOString();
      const targetMonthKey = monthStart.format("YYYY-MM");
      const existingAssignments = shiftRequestAssignments.get(staffId) || {};
      const updatedAssignments: Record<string, ShiftState> = {
        ...existingAssignments,
      };
      dayKeys.forEach((key) => {
        updatedAssignments[key] = nextState;
      });

      const entriesInput: ShiftRequestDayPreferenceInput[] = Object.entries(
        updatedAssignments,
      )
        .map(([date, state]) => ({
          date,
          status: shiftStateToShiftRequestStatus(state),
        }))
        .toSorted((a, b) => a.date.localeCompare(b.date));

      const summary = buildSummaryFromAssignments(updatedAssignments);
      const record = shiftRequestRecords.get(staffId);
      const baseHistories = record?.histories ?? [];
      const maxVersion = baseHistories.reduce(
        (acc, history) => Math.max(acc, history.version ?? 0),
        0,
      );
      const historyEntry: ShiftRequestHistoryInput = {
        version: maxVersion + 1,
        note: record?.note ?? undefined,
        entries: entriesInput,
        summary,
        submittedAt: timestamp,
        updatedAt: timestamp,
        recordedAt: timestamp,
        recordedByStaffId: cognitoUserId ?? undefined,
        changeReason: SHIFT_MANUAL_CHANGE_REASON,
      };
      const historiesInput: ShiftRequestHistoryInput[] = [
        ...baseHistories,
        historyEntry,
      ];

      const inputBase = {
        entries: entriesInput,
        summary,
        histories: historiesInput,
        submittedAt: timestamp,
        updatedAt: timestamp,
      };

      let responseShiftRequest:
        | UpdateShiftRequestMutation["updateShiftRequest"]
        | CreateShiftRequestMutation["createShiftRequest"]
        | null
        | undefined;

      if (record?.id) {
        // Try update with version condition to detect concurrent modifications
        const currentVersion = record.version;
        const response = (await graphqlClient.graphql({
          query: updateShiftRequest,
          variables: {
            input: {
              id: record.id,
              ...inputBase,
            },
            condition:
              currentVersion !== undefined
                ? {
                    version: { eq: currentVersion },
                  }
                : undefined,
          },
          authMode: "userPool",
        })) as GraphQLResult<UpdateShiftRequestMutation>;

        if (response.errors?.length) {
          const errorMessage = response.errors.map((e) => e.message).join(",");
          // Check if this is a version conflict (condition failed)
          if (errorMessage.includes("The conditional request failed")) {
            // Version conflict detected - fetch latest and merge changes
            try {
              const latestResponse = (await graphqlClient.graphql({
                query: listShiftRequests,
                variables: {
                  filter: {
                    id: { eq: record.id },
                  },
                },
                authMode: "userPool",
              })) as GraphQLResult<ListShiftRequestsQuery>;

              if (latestResponse.data?.listShiftRequests?.items?.[0]) {
                const latestRecord =
                  latestResponse.data.listShiftRequests.items[0];
                const latestAssignments: Record<string, ShiftState> = {};
                latestRecord.entries
                  ?.filter(
                    (entry): entry is NonNullable<typeof entry> =>
                      entry !== null,
                  )
                  .forEach((entry) => {
                    latestAssignments[entry.date] =
                      shiftRequestStatusToShiftState(entry.status);
                  });

                // Merge: keep our changes for the days we modified
                const mergedAssignments = {
                  ...latestAssignments,
                  ...updatedAssignments,
                };

                const mergedEntriesInput: ShiftRequestDayPreferenceInput[] =
                  Object.entries(mergedAssignments)
                    .map(([date, state]) => ({
                      date,
                      status: shiftStateToShiftRequestStatus(state),
                    }))
                    .toSorted((a, b) => a.date.localeCompare(b.date));

                const mergedSummary =
                  buildSummaryFromAssignments(mergedAssignments);
                const mergedHistories = (latestRecord.histories ?? [])
                  .filter(
                    (history): history is NonNullable<typeof history> =>
                      history !== null,
                  )
                  .map(convertHistoryToInput);

                const mergedHistoryEntry: ShiftRequestHistoryInput = {
                  version:
                    (mergedHistories.length > 0
                      ? Math.max(...mergedHistories.map((h) => h.version ?? 0))
                      : 0) + 1,
                  note: record?.note ?? undefined,
                  entries: mergedEntriesInput,
                  summary: mergedSummary,
                  submittedAt: timestamp,
                  updatedAt: timestamp,
                  recordedAt: timestamp,
                  recordedByStaffId: cognitoUserId ?? undefined,
                  changeReason: SHIFT_MANUAL_CHANGE_REASON,
                };
                const mergedHistoriesInput = [
                  ...mergedHistories,
                  mergedHistoryEntry,
                ];

                // Retry with merged data
                const retryResponse = (await graphqlClient.graphql({
                  query: updateShiftRequest,
                  variables: {
                    input: {
                      id: record.id,
                      entries: mergedEntriesInput,
                      summary: mergedSummary,
                      histories: mergedHistoriesInput,
                      submittedAt: timestamp,
                      updatedAt: timestamp,
                    },
                    condition:
                      latestRecord.version !== undefined
                        ? {
                            version: { eq: latestRecord.version },
                          }
                        : undefined,
                  },
                  authMode: "userPool",
                })) as GraphQLResult<UpdateShiftRequestMutation>;

                if (retryResponse.errors?.length) {
                  throw new Error(
                    retryResponse.errors.map((e) => e.message).join(","),
                  );
                }
                responseShiftRequest = retryResponse.data?.updateShiftRequest;
              }
            } catch {
              throw new Error(
                `Failed to resolve version conflict: ${errorMessage}`,
              );
            }
          } else {
            throw new Error(errorMessage);
          }
        } else {
          responseShiftRequest = response.data?.updateShiftRequest;
        }
      } else {
        const response = (await graphqlClient.graphql({
          query: createShiftRequest,
          variables: {
            input: {
              staffId,
              targetMonth: targetMonthKey,
              ...inputBase,
            },
          },
          authMode: "userPool",
        })) as GraphQLResult<CreateShiftRequestMutation>;

        if (response.errors?.length) {
          throw new Error(response.errors.map((e) => e.message).join(","));
        }

        responseShiftRequest = response.data?.createShiftRequest;
      }

      if (!responseShiftRequest) {
        throw new Error("Shift request mutation returned no data");
      }

      setShiftRequestAssignments((prev) => {
        const next = new Map(prev);
        next.set(staffId, updatedAssignments);
        return next;
      });

      setShiftRequestRecords((prev) => {
        const next = new Map(prev);
        next.set(staffId, {
          id: responseShiftRequest.id,
          version: responseShiftRequest.version ?? undefined,
          histories: historiesInput,
          note: responseShiftRequest.note ?? record?.note ?? undefined,
          submittedAt: responseShiftRequest.submittedAt ?? timestamp,
          targetMonth: responseShiftRequest.targetMonth ?? targetMonthKey,
        });
        return next;
      });

      setShiftRequestHistoryMeta((prev) => {
        const next = new Map(prev);
        next.set(staffId, {
          changeCount: historiesInput.length,
          latestChangeAt: timestamp,
        });
        return next;
      });
    },
    [cognitoUserId, monthStart, shiftRequestAssignments, shiftRequestRecords],
  );

  return {
    shiftRequestAssignments,
    shiftRequestHistoryMeta,
    shiftRequestRecords,
    shiftRequestsLoading,
    shiftRequestsError,
    persistShiftRequestChanges,
  };
}
