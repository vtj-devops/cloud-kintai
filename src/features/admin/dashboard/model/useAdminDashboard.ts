import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  getWorkStatus,
  WorkStatusCodes,
} from "@entities/attendance/lib/actions/workStatus";
import { calcTotalRestTime, calcTotalWorkTime } from "@entities/attendance/lib/time";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import {
  type StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  listAttendances,
  listDailyReports,
} from "@shared/api/graphql/documents/queries";
import {
  onCreateAttendance,
  onCreateDailyReport,
  onDeleteAttendance,
  onDeleteDailyReport,
  onUpdateAttendance,
  onUpdateDailyReport,
} from "@shared/api/graphql/documents/subscriptions";
import {
  Attendance,
  DailyReportStatus,
  ListAttendancesQuery,
  ListDailyReportsQuery,
  OnCreateAttendanceSubscription,
  OnCreateDailyReportSubscription,
  OnDeleteAttendanceSubscription,
  OnDeleteDailyReportSubscription,
  OnUpdateAttendanceSubscription,
  OnUpdateDailyReportSubscription,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { GraphQLResult } from "aws-amplify/api";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { resolveAggregationDateRange } from "../lib/resolveAggregationDateRange";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const logger = createLogger("AdminDashboard");

const isAttendanceCurrentWorking = (attendance: Attendance) => {
  const { code } = getWorkStatus(attendance);
  return code === WorkStatusCodes.WORKING || code === WorkStatusCodes.RESTING;
};

const buildStaffIdentityMaps = (staffs: StaffType[]) =>
  staffs.reduce<{
    staffLabelsById: Record<string, string>;
    canonicalStaffIdByAttendanceStaffId: Record<string, string>;
  }>((acc, staff) => {
    if (!staff.id) return acc;
    const displayName = [staff.familyName, staff.givenName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(" ");
    if (!displayName) return acc;
    acc.staffLabelsById[staff.id] = displayName;
    acc.canonicalStaffIdByAttendanceStaffId[staff.id] = staff.id;
    if (staff.cognitoUserId) {
      acc.canonicalStaffIdByAttendanceStaffId[staff.cognitoUserId] = staff.id;
    }
    return acc;
  }, { staffLabelsById: {}, canonicalStaffIdByAttendanceStaffId: {} });

export function useAdminDashboard() {
  const { authStatus } = useContext(AuthContext);
  const { getStandardWorkHours } = useContext(AppConfigContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading: staffLoading } = useStaffs({ isAuthenticated });
  const { closeDates, loading: closeDatesLoading } = useCloseDates();

  const [currentWorkingStaffCount, setCurrentWorkingStaffCount] = useState<number>(0);
  const [isLoadingCurrentWorkingStaffCount, setIsLoadingCurrentWorkingStaffCount] =
    useState(false);
  const [periodAttendances, setPeriodAttendances] = useState<Attendance[]>([]);
  const [isLoadingPeriodAttendances, setIsLoadingPeriodAttendances] = useState(false);
  const [submittedDailyReportCount, setSubmittedDailyReportCount] = useState<number>(0);
  const [approvedDailyReportCount, setApprovedDailyReportCount] = useState<number>(0);
  const [isLoadingDailyReportStatus, setIsLoadingDailyReportStatus] = useState(false);

  const targetWorkDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const currentMonth = useMemo(() => dayjs().startOf("month"), []);
  const aggregationDateRange = useMemo(
    () => resolveAggregationDateRange(currentMonth, closeDates),
    [closeDates, currentMonth],
  );
  const aggregationStartDate = useMemo(
    () => aggregationDateRange.start.format("YYYY-MM-DD"),
    [aggregationDateRange],
  );
  const aggregationEndDate = useMemo(
    () => aggregationDateRange.end.format("YYYY-MM-DD"),
    [aggregationDateRange],
  );
  const aggregationStart = aggregationDateRange.start;
  const aggregationEnd = aggregationDateRange.end;

  const fetchCurrentWorkingStaffCount = useCallback(async () => {
    setIsLoadingCurrentWorkingStaffCount(true);
    try {
      let nextToken: string | null = null;
      const currentWorkingStaffIds = new Set<string>();
      do {
        const response = (await graphqlClient.graphql({
          query: listAttendances,
          variables: {
            limit: 200,
            filter: { workDate: { eq: targetWorkDate } },
            nextToken,
          },
          authMode: "userPool",
        })) as GraphQLResult<ListAttendancesQuery>;
        if (response.errors?.length) throw new Error(response.errors[0].message);
        const connection = response.data?.listAttendances;
        const items = connection?.items ?? [];
        items.forEach((attendance) => {
          if (!attendance?.staffId) return;
          if (!isAttendanceCurrentWorking(attendance)) return;
          currentWorkingStaffIds.add(attendance.staffId);
        });
        nextToken = connection?.nextToken ?? null;
      } while (nextToken);
      setCurrentWorkingStaffCount(currentWorkingStaffIds.size);
    } catch (error) {
      logger.error("Failed to fetch current working staff count", error);
      setCurrentWorkingStaffCount(0);
    } finally {
      setIsLoadingCurrentWorkingStaffCount(false);
    }
  }, [targetWorkDate]);

  const fetchPeriodAttendances = useCallback(async () => {
    setIsLoadingPeriodAttendances(true);
    try {
      let nextToken: string | null = null;
      const fetchedAttendances: Attendance[] = [];
      do {
        const response = (await graphqlClient.graphql({
          query: listAttendances,
          variables: {
            limit: 200,
            filter: { workDate: { ge: aggregationStartDate, le: aggregationEndDate } },
            nextToken,
          },
          authMode: "userPool",
        })) as GraphQLResult<ListAttendancesQuery>;
        if (response.errors?.length) throw new Error(response.errors[0].message);
        const connection = response.data?.listAttendances;
        const items = connection?.items ?? [];
        items.forEach((attendance) => {
          if (attendance) fetchedAttendances.push(attendance);
        });
        nextToken = connection?.nextToken ?? null;
      } while (nextToken);
      setPeriodAttendances(fetchedAttendances);
    } catch (error) {
      logger.error("Failed to fetch attendances for aggregation period", error);
      setPeriodAttendances([]);
    } finally {
      setIsLoadingPeriodAttendances(false);
    }
  }, [aggregationEndDate, aggregationStartDate]);

  const fetchTodayDailyReportStatus = useCallback(async () => {
    setIsLoadingDailyReportStatus(true);
    try {
      let nextToken: string | null = null;
      const submittedStaffIds = new Set<string>();
      const approvedStaffIds = new Set<string>();
      do {
        const response = (await graphqlClient.graphql({
          query: listDailyReports,
          variables: {
            limit: 200,
            filter: { reportDate: { eq: targetWorkDate } },
            nextToken,
          },
          authMode: "userPool",
        })) as GraphQLResult<ListDailyReportsQuery>;
        if (response.errors?.length) throw new Error(response.errors[0].message);
        const connection = response.data?.listDailyReports;
        const items = connection?.items ?? [];
        items.forEach((dailyReport) => {
          if (!dailyReport?.staffId) return;
          if (dailyReport.status === DailyReportStatus.APPROVED) {
            approvedStaffIds.add(dailyReport.staffId);
            submittedStaffIds.add(dailyReport.staffId);
            return;
          }
          if (dailyReport.status === DailyReportStatus.SUBMITTED) {
            submittedStaffIds.add(dailyReport.staffId);
          }
        });
        nextToken = connection?.nextToken ?? null;
      } while (nextToken);
      setSubmittedDailyReportCount(submittedStaffIds.size);
      setApprovedDailyReportCount(approvedStaffIds.size);
    } catch (error) {
      logger.error("Failed to fetch today daily report status", error);
      setSubmittedDailyReportCount(0);
      setApprovedDailyReportCount(0);
    } finally {
      setIsLoadingDailyReportStatus(false);
    }
  }, [targetWorkDate]);

  useEffect(() => {
    void fetchCurrentWorkingStaffCount();
  }, [fetchCurrentWorkingStaffCount]);

  useEffect(() => {
    if (closeDatesLoading) return;
    void fetchPeriodAttendances();
  }, [closeDatesLoading, fetchPeriodAttendances]);

  useEffect(() => {
    void fetchTodayDailyReportStatus();
  }, [fetchTodayDailyReportStatus]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;
    let currentWorkingTimer: ReturnType<typeof setTimeout> | null = null;
    let periodAttendancesTimer: ReturnType<typeof setTimeout> | null = null;
    let dailyReportTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleCurrentWorkingRefresh = () => {
      if (currentWorkingTimer) {
        clearTimeout(currentWorkingTimer);
      }
      currentWorkingTimer = setTimeout(() => {
        if (!isMounted) {
          return;
        }
        void fetchCurrentWorkingStaffCount();
      }, 300);
    };

    const schedulePeriodAttendanceRefresh = () => {
      if (periodAttendancesTimer) {
        clearTimeout(periodAttendancesTimer);
      }
      periodAttendancesTimer = setTimeout(() => {
        if (!isMounted) {
          return;
        }
        void fetchPeriodAttendances();
      }, 300);
    };

    const scheduleDailyReportRefresh = () => {
      if (dailyReportTimer) {
        clearTimeout(dailyReportTimer);
      }
      dailyReportTimer = setTimeout(() => {
        if (!isMounted) {
          return;
        }
        void fetchTodayDailyReportStatus();
      }, 300);
    };

    const handleAttendanceEvent = (attendance?: {
      workDate?: string | null;
    } | null) => {
      const workDate = attendance?.workDate;
      if (!workDate) {
        return;
      }

      if (workDate === targetWorkDate) {
        scheduleCurrentWorkingRefresh();
      }

      const isInAggregationRange = dayjs(workDate).isBetween(
        aggregationStart,
        aggregationEnd,
        "day",
        "[]",
      );
      if (isInAggregationRange) {
        schedulePeriodAttendanceRefresh();
      }
    };

    const handleDailyReportEvent = (dailyReport?: {
      reportDate?: string | null;
    } | null) => {
      if (dailyReport?.reportDate !== targetWorkDate) {
        return;
      }
      scheduleDailyReportRefresh();
    };

    const createAttendanceSubscription = graphqlClient
      .graphql({ query: onCreateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnCreateAttendanceSubscription }) => {
          handleAttendanceEvent(data?.onCreateAttendance);
        },
        error: (error: unknown) => {
          logger.error("Attendance create subscription error", error);
        },
      });

    const updateAttendanceSubscription = graphqlClient
      .graphql({ query: onUpdateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnUpdateAttendanceSubscription }) => {
          handleAttendanceEvent(data?.onUpdateAttendance);
        },
        error: (error: unknown) => {
          logger.error("Attendance update subscription error", error);
        },
      });

    const deleteAttendanceSubscription = graphqlClient
      .graphql({ query: onDeleteAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnDeleteAttendanceSubscription }) => {
          handleAttendanceEvent(data?.onDeleteAttendance);
        },
        error: (error: unknown) => {
          logger.error("Attendance delete subscription error", error);
        },
      });

    const createDailyReportSubscription = graphqlClient
      .graphql({ query: onCreateDailyReport, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnCreateDailyReportSubscription }) => {
          handleDailyReportEvent(data?.onCreateDailyReport);
        },
        error: (error: unknown) => {
          logger.error("Daily report create subscription error", error);
        },
      });

    const updateDailyReportSubscription = graphqlClient
      .graphql({ query: onUpdateDailyReport, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnUpdateDailyReportSubscription }) => {
          handleDailyReportEvent(data?.onUpdateDailyReport);
        },
        error: (error: unknown) => {
          logger.error("Daily report update subscription error", error);
        },
      });

    const deleteDailyReportSubscription = graphqlClient
      .graphql({ query: onDeleteDailyReport, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnDeleteDailyReportSubscription }) => {
          handleDailyReportEvent(data?.onDeleteDailyReport);
        },
        error: (error: unknown) => {
          logger.error("Daily report delete subscription error", error);
        },
      });

    return () => {
      isMounted = false;
      if (currentWorkingTimer) {
        clearTimeout(currentWorkingTimer);
      }
      if (periodAttendancesTimer) {
        clearTimeout(periodAttendancesTimer);
      }
      if (dailyReportTimer) {
        clearTimeout(dailyReportTimer);
      }
      createAttendanceSubscription.unsubscribe();
      updateAttendanceSubscription.unsubscribe();
      deleteAttendanceSubscription.unsubscribe();
      createDailyReportSubscription.unsubscribe();
      updateDailyReportSubscription.unsubscribe();
      deleteDailyReportSubscription.unsubscribe();
    };
  }, [
    aggregationEnd,
    aggregationStart,
    fetchCurrentWorkingStaffCount,
    fetchPeriodAttendances,
    fetchTodayDailyReportStatus,
    isAuthenticated,
    targetWorkDate,
  ]);

  const staffWorkStatusSummary = useMemo(() => {
    const standardWorkHours = Math.max(getStandardWorkHours(), 0);
    const { staffLabelsById, canonicalStaffIdByAttendanceStaffId } =
      buildStaffIdentityMaps(staffs);
    const staffIds = Object.keys(staffLabelsById);
    const totalsByStaff = periodAttendances.reduce<
      Record<string, { workHours: number; overtimeHours: number }>
    >((acc, attendance) => {
      if (!attendance.staffId || !attendance.startTime || !attendance.endTime) return acc;
      const canonicalStaffId = canonicalStaffIdByAttendanceStaffId[attendance.staffId];
      if (!canonicalStaffId) return acc;

      const workHours = calcTotalWorkTime(attendance.startTime, attendance.endTime);
      if (!Number.isFinite(workHours)) return acc;

      const restHours = (attendance.rests ?? [])
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((restAcc, rest) => {
          if (!rest.startTime || !rest.endTime) return restAcc;
          return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);
      if (!Number.isFinite(restHours)) return acc;

      const netWorkHours = Math.max(workHours - restHours, 0);
      if (!Number.isFinite(netWorkHours)) return acc;

      const current = acc[canonicalStaffId] ?? { workHours: 0, overtimeHours: 0 };
      const dailyOvertimeHours = Math.max(netWorkHours - standardWorkHours, 0);
      acc[canonicalStaffId] = {
        workHours: Number((current.workHours + netWorkHours).toFixed(2)),
        overtimeHours: Number((current.overtimeHours + dailyOvertimeHours).toFixed(2)),
      };
      return acc;
    }, {});

    staffIds.forEach((staffId) => {
      if (totalsByStaff[staffId]) return;
      totalsByStaff[staffId] = { workHours: 0, overtimeHours: 0 };
    });

    return Object.entries(totalsByStaff)
      .map(([staffId, totals]) => {
        const label = staffLabelsById[staffId];
        if (!label) return null;
        return { label, workHours: totals.workHours, overtimeHours: totals.overtimeHours };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .toSorted((left, right) => right.workHours - left.workHours);
  }, [getStandardWorkHours, periodAttendances, staffs]);

  const duplicateAttendanceDayCount = useMemo(() => {
    const { canonicalStaffIdByAttendanceStaffId } = buildStaffIdentityMaps(staffs);
    const attendancesByStaffDate = periodAttendances.reduce<Record<string, number>>(
      (acc, attendance) => {
        if (!attendance.staffId || !attendance.workDate) return acc;
        const canonicalStaffId = canonicalStaffIdByAttendanceStaffId[attendance.staffId];
        if (!canonicalStaffId) return acc;
        const key = `${canonicalStaffId}#${attendance.workDate}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return Object.values(attendancesByStaffDate).filter((count) => count > 1).length;
  }, [periodAttendances, staffs]);

  const staffWorkStatusChartData = useMemo(
    () => ({
      labels: staffWorkStatusSummary.map((item) => item.label),
      datasets: [
        {
          label: "勤務時間",
          data: staffWorkStatusSummary.map((item) => item.workHours),
          backgroundColor: "rgba(14,116,144,0.82)",
          borderColor: "rgba(14,116,144,1)",
          borderWidth: 1,
          stack: "work-status",
        },
        {
          label: "残業時間",
          data: staffWorkStatusSummary.map((item) => -item.overtimeHours),
          backgroundColor: "rgba(225,29,72,0.82)",
          borderColor: "rgba(225,29,72,1)",
          borderWidth: 1,
          stack: "work-status",
        },
      ],
    }),
    [staffWorkStatusSummary],
  );

  const staffWorkStatusChartOptions = useMemo<ChartOptions<"bar">>(() => {
    const maxWorkHours = Math.max(0, ...staffWorkStatusSummary.map((item) => item.workHours));
    const maxOvertimeHours = Math.max(
      0,
      ...staffWorkStatusSummary.map((item) => item.overtimeHours),
    );
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, boxHeight: 12, color: "#334155" },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${Math.abs(Number(context.parsed.y ?? 0)).toFixed(1)}h`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: "#64748b", autoSkip: false, maxRotation: 90, minRotation: 90 },
        },
        y: {
          stacked: true,
          suggestedMin: maxOvertimeHours > 0 ? -Math.ceil(maxOvertimeHours + 0.5) : 0,
          suggestedMax: Math.max(1, Math.ceil(maxWorkHours + 0.5)),
          ticks: { color: "#64748b", callback: (value) => `${value}h` },
          grid: { color: "rgba(148,163,184,0.22)" },
        },
      },
    };
  }, [staffWorkStatusSummary]);

  // ラベル
  const currentWorkingStaffCountLabel = isLoadingCurrentWorkingStaffCount
    ? "集計中"
    : `${currentWorkingStaffCount}人`;
  const submittedDailyReportCountLabel = isLoadingDailyReportStatus
    ? "集計中"
    : `${submittedDailyReportCount}件`;
  const approvedDailyReportCountLabel = isLoadingDailyReportStatus
    ? "集計中"
    : `${approvedDailyReportCount}件`;
  const currentWorkingStaffInfoLabel = `${targetWorkDate} 時点の勤務中・休憩中スタッフ数`;
  const aggregationPeriodInfoLabel = `集計期間: ${dayjs(aggregationStartDate).format("M/D")}〜${dayjs(aggregationEndDate).format("M/D")}`;

  return {
    // ローディング
    isLoadingCurrentWorkingStaffCount,
    isLoadingPeriodAttendances,
    isLoadingDailyReportStatus,
    staffLoading,
    closeDatesLoading,
    // ラベル
    currentWorkingStaffCountLabel,
    submittedDailyReportCountLabel,
    approvedDailyReportCountLabel,
    currentWorkingStaffInfoLabel,
    aggregationPeriodInfoLabel,
    duplicateAttendanceDayCount,
    hasDuplicateAttendances: duplicateAttendanceDayCount > 0,
    // チャート
    staffWorkStatusSummary,
    staffWorkStatusChartData,
    staffWorkStatusChartOptions,
  };
}
