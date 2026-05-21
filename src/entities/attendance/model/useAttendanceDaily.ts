import {
  ATTENDANCE_DUPLICATE_CONFLICT,
  DuplicateAttendanceInfo,
  useLazyGetAttendanceByStaffAndDateQuery,
} from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { getAttendanceMonthRangeInput } from "@entities/attendance/lib/attendanceQueryRange";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  onCreateAttendance,
  onDeleteAttendance,
  onUpdateAttendance,
} from "@shared/api/graphql/documents/subscriptions";
import {
  Attendance,
  OnCreateAttendanceSubscription,
  OnDeleteAttendanceSubscription,
  OnUpdateAttendanceSubscription,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useCallback, useEffect, useRef, useState } from "react";

dayjs.extend(isBetween);

export interface AttendanceDaily {
  sub: string;
  givenName: string;
  familyName: string;
  sortKey: string;
  attendance: Attendance | null;
}

export interface DuplicateAttendanceDaily {
  staffId: string;
  staffName: string;
  workDate: string;
  ids: string[];
}

export type AttendanceDailyStaff = {
  cognitoUserId: string;
  givenName?: string | null;
  familyName?: string | null;
  sortKey?: string | null;
};

export type UseAttendanceDailyParams = {
  staffs: AttendanceDailyStaff[];
  staffLoading?: boolean;
  staffError?: Error | null;
};

/**
 * 年月をキーとするロード済み月データの管理
 */
interface MonthlyAttendanceData {
  attendanceList: AttendanceDaily[];
  duplicateAttendances: DuplicateAttendanceDaily[];
  loadedAt: number;
}

export default function useAttendanceDaily({
  staffs,
  staffLoading = false,
  staffError = null,
}: UseAttendanceDailyParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attendanceDailyList, setAttendanceDailyList] = useState<
    AttendanceDaily[]
  >([]);
  const [duplicateAttendances, setDuplicateAttendances] = useState<
    DuplicateAttendanceDaily[]
  >([]);

  // 複数月のデータをキャッシュ（年月をキーとする）
  const monthlyDataCache = useRef<Record<string, MonthlyAttendanceData>>({});

  const [triggerGetAttendance] = useLazyGetAttendanceByStaffAndDateQuery();

  /**
   * 年月をYYYY-MMフォーマットで取得
   */
  const getMonthKey = useCallback((dateStr: string) => {
    return dayjs(dateStr).format("YYYY-MM");
  }, []);

  /**
   * 指定月のデータをロード（複数月対応）
   * まだロードされていない月があれば追加ロード
   */
  const loadAttendanceDataByMonth = useCallback(
    async (targetDate: string, options?: { forceRefresh?: boolean }) => {
      const monthKey = getMonthKey(targetDate);
      const { startDate: firstDayOfMonth, endDate: lastDayOfMonth } =
        getAttendanceMonthRangeInput(targetDate);
      const shouldUseCache = !options?.forceRefresh;

      // キャッシュに存在するかチェック
      if (shouldUseCache && monthlyDataCache.current[monthKey]) {
        const cached = monthlyDataCache.current[monthKey];
        setAttendanceDailyList(cached.attendanceList);
        setDuplicateAttendances(cached.duplicateAttendances);
        return;
      }

      // キャッシュにないので新たにロード
      setLoading(true);
      setError(null);

      try {
        const duplicateBuffer: DuplicateAttendanceDaily[] = [];

        const results = await Promise.all(
          staffs.map(
            async ({ cognitoUserId, givenName, familyName, sortKey }) => {
              const safeGivenName = givenName ?? "";
              const safeFamilyName = familyName ?? "";
              const safeSortKey = sortKey ?? "";
              const response = await triggerGetAttendance({
                staffId: cognitoUserId,
                workDate: firstDayOfMonth,
              });

              if (response.error) {
                const details =
                  typeof response.error === "object" &&
                  response.error !== null &&
                  "details" in response.error &&
                  typeof (response.error as { details?: unknown }).details ===
                    "object" &&
                  (response.error as { details?: unknown }).details !== null
                    ? (response.error as {
                        details: {
                          code?: string;
                          duplicates?: DuplicateAttendanceInfo[];
                        };
                      }).details
                    : undefined;

                if (
                  details?.code === ATTENDANCE_DUPLICATE_CONFLICT &&
                  Array.isArray(details.duplicates)
                ) {
                  details.duplicates.forEach((dup) => {
                    if (
                      dayjs(dup.workDate).isBetween(
                        dayjs(firstDayOfMonth),
                        dayjs(lastDayOfMonth),
                        null,
                        "[]",
                      )
                    ) {
                      duplicateBuffer.push({
                        staffId: cognitoUserId,
                        staffName: `${safeFamilyName} ${safeGivenName}`.trim(),
                        workDate: dup.workDate,
                        ids: dup.ids,
                      });
                    }
                  });

                  return {
                    sub: cognitoUserId,
                    givenName: safeGivenName,
                    familyName: safeFamilyName,
                    attendance: null,
                    sortKey: safeSortKey,
                  } as AttendanceDaily;
                }

                throw response.error as Error;
              }

              const attendance =
                "data" in response ? (response.data ?? null) : null;

              const duplicates = (
                (
                  response as {
                    meta?: { duplicates?: DuplicateAttendanceInfo[] };
                  }
                ).meta?.duplicates ?? []
              ).filter((d) => d.ids.length > 1);

              duplicates.forEach((dup) => {
                // 月範囲内のみを対象
                if (
                  dayjs(dup.workDate).isBetween(
                    dayjs(firstDayOfMonth),
                    dayjs(lastDayOfMonth),
                    null,
                    "[]",
                  )
                ) {
                  duplicateBuffer.push({
                    staffId: cognitoUserId,
                    staffName: `${safeFamilyName} ${safeGivenName}`.trim(),
                    workDate: dup.workDate,
                    ids: dup.ids,
                  });
                }
              });

              return {
                sub: cognitoUserId,
                givenName: safeGivenName,
                familyName: safeFamilyName,
                attendance,
                sortKey: safeSortKey,
              } as AttendanceDaily;
            },
          ),
        );

        // キャッシュに保存
        monthlyDataCache.current[monthKey] = {
          attendanceList: results,
          duplicateAttendances: duplicateBuffer,
          loadedAt: Date.now(),
        };

        setAttendanceDailyList(results);
        setDuplicateAttendances(duplicateBuffer);
      } catch (e: Error | unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [staffs, triggerGetAttendance, getMonthKey],
  );

  useEffect(() => {
    if (staffLoading || staffError) return;
    if (staffs.length === 0) return;

    const staffIdSet = new Set(staffs.map((staff) => staff.cognitoUserId));
    const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const canRefreshByAttendance = (
      staffId?: string | null,
      workDate?: string | null,
    ) => {
      if (!staffId || !workDate) return false;
      if (!staffIdSet.has(staffId)) return false;

      const monthKey = getMonthKey(workDate);
      return Boolean(monthlyDataCache.current[monthKey]);
    };

    const scheduleRefresh = (workDate: string) => {
      const monthKey = getMonthKey(workDate);
      const existingTimer = refreshTimers.get(monthKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        refreshTimers.delete(monthKey);
        void loadAttendanceDataByMonth(workDate, { forceRefresh: true }).catch(
          () => undefined,
        );
      }, 300);

      refreshTimers.set(monthKey, timer);
    };

    const createSubscription = graphqlClient
      .graphql({ query: onCreateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnCreateAttendanceSubscription }) => {
          const attendance = data?.onCreateAttendance;
          if (
            !canRefreshByAttendance(attendance?.staffId, attendance?.workDate)
          ) {
            return;
          }
          const workDate = attendance?.workDate;
          if (!workDate) {
            return;
          }
          scheduleRefresh(workDate);
        },
      });

    const updateSubscription = graphqlClient
      .graphql({ query: onUpdateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnUpdateAttendanceSubscription }) => {
          const attendance = data?.onUpdateAttendance;
          if (
            !canRefreshByAttendance(attendance?.staffId, attendance?.workDate)
          ) {
            return;
          }
          const workDate = attendance?.workDate;
          if (!workDate) {
            return;
          }
          scheduleRefresh(workDate);
        },
      });

    const deleteSubscription = graphqlClient
      .graphql({ query: onDeleteAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnDeleteAttendanceSubscription }) => {
          const attendance = data?.onDeleteAttendance;
          if (
            !canRefreshByAttendance(attendance?.staffId, attendance?.workDate)
          ) {
            return;
          }
          const workDate = attendance?.workDate;
          if (!workDate) {
            return;
          }
          scheduleRefresh(workDate);
        },
      });

    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
      refreshTimers.forEach((timer) => clearTimeout(timer));
      refreshTimers.clear();
    };
  }, [
    staffs,
    staffLoading,
    staffError,
    getMonthKey,
    loadAttendanceDataByMonth,
  ]);

  // 初期化：当月と前月を自動ロード
  useEffect(() => {
    if (staffLoading || staffError) return;
    if (staffs.length === 0) return;

    // 当月と前月をロード
    const now = dayjs();
    const currentMonth = now.format(AttendanceDate.DataFormat);
    const previousMonth = now
      .subtract(1, "month")
      .format(AttendanceDate.DataFormat);

    // staffsが変わった場合はキャッシュをクリア
    monthlyDataCache.current = {};

    (async () => {
      try {
        await Promise.all([
          loadAttendanceDataByMonth(previousMonth),
          loadAttendanceDataByMonth(currentMonth),
        ]);
      } catch (e) {
        console.error("Failed to load initial attendance data", e);
      }
    })();
  }, [staffs, staffLoading, staffError, loadAttendanceDataByMonth]);

  return {
    loading,
    error,
    attendanceDailyList,
    duplicateAttendances,
    loadAttendanceDataByMonth,
  };
}
