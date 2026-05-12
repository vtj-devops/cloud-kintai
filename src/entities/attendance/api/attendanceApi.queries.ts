import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { attendancesByStaffId, getAttendance } from "@shared/api/graphql/documents/queries";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import { buildListAndItemTags } from "@shared/api/graphql/tagBuilder";
import type {
  Attendance,
  AttendancesByStaffIdQuery,
  GetAttendanceQuery,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { baseAttendanceApi } from "./attendanceApi.base";
import {
  buildAttendanceCacheId,
  buildAttendanceForList,
  buildDateListForRange,
  buildDuplicateConflictError,
  fetchAttendancesByStaffDate,
} from "./attendanceApi.helpers";
import { buildDuplicateDetailsError, collectAttendancesByWorkDate, nonNullable } from "./attendanceApi.shared";
import type { AttendanceListResponse } from "./attendanceApi.types";

export const attendanceApiWithQueries = baseAttendanceApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceByStaffAndDate: builder.query<
      Attendance | null,
      { staffId: string; workDate: string }
    >({
      async queryFn({ staffId, workDate }, _queryApi, _extraOptions, baseQuery) {
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
        const { attendanceMap, duplicateDetails } = collectAttendancesByWorkDate(
          staffId,
          fetchedAttendances,
        );

        if (duplicateDetails.length > 0) {
          return {
            error: buildDuplicateDetailsError(staffId, duplicateDetails),
          };
        }

        const attendanceList = dateList.map((targetDate) => {
          const matches = attendanceMap.get(targetDate) ?? [];
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
        const { attendanceMap, duplicateDetails } = collectAttendancesByWorkDate(
          staffId,
          fetchedAttendances,
        );

        if (duplicateDetails.length > 0) {
          return {
            error: buildDuplicateDetailsError(staffId, duplicateDetails),
          };
        }

        const attendanceList = dateList.map((targetDate) => {
          const matches = attendanceMap.get(targetDate) ?? [];
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
        const { duplicateDetails } = collectAttendancesByWorkDate(
          staffId,
          attendances,
        );

        if (duplicateDetails.length > 0) {
          return {
            error: buildDuplicateDetailsError(staffId, duplicateDetails),
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
        const { attendanceMap, duplicateDetails } = collectAttendancesByWorkDate(
          staffId,
          fetchedAttendances,
        );

        if (duplicateDetails.length > 0) {
          return {
            error: buildDuplicateDetailsError(staffId, duplicateDetails),
          };
        }

        return {
          data: {
            attendances: dateList.map((targetDate) => {
              const matches = attendanceMap.get(targetDate) ?? [];
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
} = attendanceApiWithQueries;