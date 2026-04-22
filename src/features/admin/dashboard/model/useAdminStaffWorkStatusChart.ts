import useCloseDates from "@entities/attendance/model/useCloseDates";
import {
  type StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { useStandardWorkHours } from "@features/admin/dashboard/model/useAppConfigDerived";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { listAttendances } from "@shared/api/graphql/documents/queries";
import {
  onCreateAttendance,
  onDeleteAttendance,
  onUpdateAttendance,
} from "@shared/api/graphql/documents/subscriptions";
import {
  Attendance,
  ListAttendancesQuery,
  OnCreateAttendanceSubscription,
  OnDeleteAttendanceSubscription,
  OnUpdateAttendanceSubscription,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { useAuthSessionSummary } from "@shared/lib/useAuthSessionSummary";
import { GraphQLResult } from "aws-amplify/api";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildAggregationPeriodInfoLabel,
  buildStaffWorkStatusChartData,
  buildStaffWorkStatusChartOptions,
  buildStaffWorkStatusSummary,
  countDuplicateAttendanceDays,
  type StaffWorkStatusChartViewModel,
} from "../lib/adminDashboardSelectors";
import { resolveAggregationDateRange } from "../lib/resolveAggregationDateRange";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const logger = createLogger("useAdminStaffWorkStatusChart");

const buildViewModel = ({
  staffs,
  periodAttendances,
  standardWorkHours,
  aggregationStartDate,
  aggregationEndDate,
  isLoading,
}: {
  staffs: StaffType[];
  periodAttendances: Attendance[];
  standardWorkHours: number;
  aggregationStartDate: string;
  aggregationEndDate: string;
  isLoading: boolean;
}): StaffWorkStatusChartViewModel => {
  const staffWorkStatusSummary = buildStaffWorkStatusSummary({
    staffs,
    periodAttendances,
    standardWorkHours: Math.max(standardWorkHours, 0),
  });
  const duplicateAttendanceDayCount = countDuplicateAttendanceDays({
    staffs,
    periodAttendances,
  });

  return {
    infoLabel: buildAggregationPeriodInfoLabel({
      aggregationStartDate,
      aggregationEndDate,
    }),
    isLoading,
    hasData: staffWorkStatusSummary.length > 0,
    hasDuplicateAttendances: duplicateAttendanceDayCount > 0,
    duplicateAttendanceDayCount,
    chartData: buildStaffWorkStatusChartData(staffWorkStatusSummary),
    chartOptions: buildStaffWorkStatusChartOptions(staffWorkStatusSummary),
  };
};

export function useAdminStaffWorkStatusChart() {
  const { isAuthenticated } = useAuthSessionSummary();
  const standardWorkHours = useStandardWorkHours();
  const { staffs, loading: staffLoading } = useStaffs({ isAuthenticated });
  const { closeDates, loading: closeDatesLoading } = useCloseDates();
  const [periodAttendances, setPeriodAttendances] = useState<Attendance[]>([]);
  const [isLoadingPeriodAttendances, setIsLoadingPeriodAttendances] = useState(false);
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

  useEffect(() => {
    if (closeDatesLoading) return;
    void fetchPeriodAttendances();
  }, [closeDatesLoading, fetchPeriodAttendances]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = (workDate?: string | null) => {
      if (!workDate) return;
      const isInAggregationRange = dayjs(workDate).isBetween(
        aggregationStart,
        aggregationEnd,
        "day",
        "[]",
      );
      if (!isInAggregationRange) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (!isMounted) return;
        void fetchPeriodAttendances();
      }, 300);
    };

    const createSubscription = graphqlClient
      .graphql({ query: onCreateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnCreateAttendanceSubscription }) =>
          scheduleRefresh(data?.onCreateAttendance?.workDate),
        error: (error: unknown) => logger.error("Attendance create subscription error", error),
      });

    const updateSubscription = graphqlClient
      .graphql({ query: onUpdateAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnUpdateAttendanceSubscription }) =>
          scheduleRefresh(data?.onUpdateAttendance?.workDate),
        error: (error: unknown) => logger.error("Attendance update subscription error", error),
      });

    const deleteSubscription = graphqlClient
      .graphql({ query: onDeleteAttendance, authMode: "userPool" })
      .subscribe({
        next: ({ data }: { data?: OnDeleteAttendanceSubscription }) =>
          scheduleRefresh(data?.onDeleteAttendance?.workDate),
        error: (error: unknown) => logger.error("Attendance delete subscription error", error),
      });

    return () => {
      isMounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [
    aggregationEnd,
    aggregationStart,
    fetchPeriodAttendances,
    isAuthenticated,
  ]);

  return useMemo(
    () =>
      buildViewModel({
        staffs,
        periodAttendances,
        standardWorkHours,
        aggregationStartDate,
        aggregationEndDate,
        isLoading: isLoadingPeriodAttendances || staffLoading || closeDatesLoading,
      }),
    [
      aggregationEndDate,
      aggregationStartDate,
      closeDatesLoading,
      isLoadingPeriodAttendances,
      periodAttendances,
      staffLoading,
      staffs,
      standardWorkHours,
    ],
  );
}
