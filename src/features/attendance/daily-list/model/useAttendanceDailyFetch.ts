import { useLazyListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import { getAttendanceMonthRangeInput } from "@entities/attendance/lib/attendanceQueryRange";
import {
  AttendanceDaily,
  DuplicateAttendanceDaily,
} from "@entities/attendance/model/useAttendanceDaily";
import { Attendance } from "@shared/api/graphql/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import { calculateTotalOvertimeMinutes } from "../lib/overtimeUtils";

type UseAttendanceDailyFetchParams = {
  attendanceDailyList: AttendanceDaily[];
  displayDateFormatted: string | undefined;
  staffNameMap: Record<string, string>;
  scheduledHour: number;
  scheduledMinute: number;
  duplicateAttendances: DuplicateAttendanceDaily[];
  loading: boolean;
};

type UseAttendanceDailyFetchResult = {
  attendanceMap: Record<string, Attendance[]>;
  attendanceLoadingMap: Record<string, boolean>;
  attendanceErrorMap: Record<string, Error | null>;
  duplicateSummaryMap: Record<string, DuplicateAttendanceDaily[]>;
  getAttendanceForDisplayDate: (row: AttendanceDaily) => Attendance | null;
  overtimeMinutesMap: Record<string, number>;
  getOvertimeMinutes: (row: AttendanceDaily) => number;
  summaryDuplicateList: DuplicateAttendanceDaily[];
  mergedDuplicateAttendances: DuplicateAttendanceDaily[];
  duplicateInfoByStaff: Record<string, DuplicateAttendanceDaily[]>;
};

export function useAttendanceDailyFetch({
  attendanceDailyList,
  displayDateFormatted,
  staffNameMap,
  scheduledHour,
  scheduledMinute,
  duplicateAttendances,
  loading,
}: UseAttendanceDailyFetchParams): UseAttendanceDailyFetchResult {
  const [triggerListAttendancesByDateRange] =
    useLazyListAttendancesByDateRangeQuery();

  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, Attendance[]>
  >({});
  const [attendanceLoadingMap, setAttendanceLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [attendanceErrorMap, setAttendanceErrorMap] = useState<
    Record<string, Error | null>
  >({});
  const [duplicateSummaryMap, setDuplicateSummaryMap] = useState<
    Record<string, DuplicateAttendanceDaily[]>
  >({});

  useEffect(() => {
    const staffIds = Array.from(
      new Set((attendanceDailyList || []).map((r) => r.sub)),
    );
    if (staffIds.length === 0) {
      return;
    }

    let isMounted = true;

    staffIds.forEach((staffId) => {
      setAttendanceLoadingMap((state) => ({ ...state, [staffId]: true }));
      setAttendanceErrorMap((state) => ({ ...state, [staffId]: null }));

      const { startDate, endDate } = getAttendanceMonthRangeInput(
        displayDateFormatted,
      );

      triggerListAttendancesByDateRange({ staffId, startDate, endDate })
        .unwrap()
        .then((attendances) => {
          if (!isMounted) return;
          setAttendanceMap((map) => ({ ...map, [staffId]: attendances }));
          setDuplicateSummaryMap((state) => ({
            ...state,
            [staffId]: [],
          }));
        })
        .catch((err) => {
          if (!isMounted) return;

          const errorInstance =
            err instanceof Error
              ? err
              : new Error("Failed to fetch attendances");
          setAttendanceErrorMap((state) => ({
            ...state,
            [staffId]: errorInstance,
          }));

          const details =
            typeof err === "object" &&
            err !== null &&
            "details" in err &&
            typeof (err as { details?: unknown }).details === "object" &&
            (err as { details?: unknown }).details !== null
              ? ((
                  err as {
                    details: {
                      duplicates?: unknown;
                    };
                  }
                ).details.duplicates ?? [])
              : [];

          const duplicateList = Array.isArray(details)
            ? details
                .map((dup) => {
                  if (
                    !dup ||
                    typeof dup !== "object" ||
                    !("workDate" in dup) ||
                    !("ids" in dup)
                  ) {
                    return null;
                  }
                  const candidate = dup as {
                    workDate?: unknown;
                    ids?: unknown;
                    staffId?: unknown;
                  };
                  if (
                    typeof candidate.workDate !== "string" ||
                    !Array.isArray(candidate.ids)
                  ) {
                    return null;
                  }
                  const ids = candidate.ids.filter(
                    (id): id is string => typeof id === "string",
                  );
                  return {
                    staffId:
                      typeof candidate.staffId === "string"
                        ? candidate.staffId
                        : staffId,
                    staffName: staffNameMap[staffId] ?? staffId,
                    workDate: candidate.workDate,
                    ids,
                  } satisfies DuplicateAttendanceDaily;
                })
                .filter(
                  (dup): dup is DuplicateAttendanceDaily =>
                    dup !== null && dup.ids.length > 1,
                )
            : [];

          setDuplicateSummaryMap((state) => ({
            ...state,
            [staffId]: duplicateList,
          }));
        })
        .finally(() => {
          if (!isMounted) return;
          setAttendanceLoadingMap((state) => ({
            ...state,
            [staffId]: false,
          }));
        });
    });

    return () => {
      isMounted = false;
    };
  }, [
    attendanceDailyList,
    displayDateFormatted,
    staffNameMap,
    triggerListAttendancesByDateRange,
  ]);

  const getAttendanceForDisplayDate = useCallback(
    (row: AttendanceDaily): Attendance | null => {
      const attendances = attendanceMap[row.sub] ?? [];
      if (displayDateFormatted) {
        const matched = attendances.find(
          (attendance) => attendance.workDate === displayDateFormatted,
        );
        if (matched) {
          return matched;
        }
      }
      if (!row.attendance) {
        return null;
      }
      if (
        displayDateFormatted &&
        row.attendance.workDate !== displayDateFormatted
      ) {
        return null;
      }
      return row.attendance;
    },
    [attendanceMap, displayDateFormatted],
  );

  const overtimeMinutesMap = useMemo(() => {
    return Object.entries(attendanceMap).reduce(
      (acc, [staffId, attendances]) => {
        acc[staffId] = calculateTotalOvertimeMinutes(
          attendances,
          scheduledHour,
          scheduledMinute,
        );
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [attendanceMap, scheduledHour, scheduledMinute]);

  const getOvertimeMinutes = useCallback(
    (row: AttendanceDaily): number => {
      const mapped = overtimeMinutesMap[row.sub];
      if (typeof mapped === "number") {
        return mapped;
      }
      const targetAttendance = getAttendanceForDisplayDate(row);
      if (!targetAttendance) return 0;
      return calculateTotalOvertimeMinutes(
        [targetAttendance],
        scheduledHour,
        scheduledMinute,
      );
    },
    [getAttendanceForDisplayDate, overtimeMinutesMap, scheduledHour, scheduledMinute],
  );

  const summaryDuplicateList = useMemo(
    () => Object.values(duplicateSummaryMap).flat(),
    [duplicateSummaryMap],
  );

  const mergedDuplicateAttendances = useMemo(() => {
    if (loading) return [];
    const unique = new Map<string, DuplicateAttendanceDaily>();
    [...duplicateAttendances, ...summaryDuplicateList].forEach((dup) => {
      const key = `${dup.staffId}-${dup.workDate}-${dup.ids.join("-")}`;
      if (!unique.has(key)) {
        unique.set(key, dup);
      }
    });
    return Array.from(unique.values());
  }, [duplicateAttendances, loading, summaryDuplicateList]);

  const duplicateInfoByStaff = useMemo(() => {
    return mergedDuplicateAttendances.reduce<
      Record<string, DuplicateAttendanceDaily[]>
    >((acc, dup) => {
      const list = acc[dup.staffId] ?? [];
      list.push(dup);
      acc[dup.staffId] = list;
      return acc;
    }, {});
  }, [mergedDuplicateAttendances]);

  return {
    attendanceMap,
    attendanceLoadingMap,
    attendanceErrorMap,
    duplicateSummaryMap,
    getAttendanceForDisplayDate,
    overtimeMinutesMap,
    getOvertimeMinutes,
    summaryDuplicateList,
    mergedDuplicateAttendances,
    duplicateInfoByStaff,
  };
}
