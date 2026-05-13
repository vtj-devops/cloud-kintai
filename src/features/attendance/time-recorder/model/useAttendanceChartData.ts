import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import {
  buildWorkStatusChartDatasets,
  buildWorkStatusStackedBarOptions,
} from "@entities/attendance/lib/workStatusChart";
import { calcAttendanceChartSummary } from "@features/attendance/time-recorder/lib/attendanceSummaryCalculators";
import type { Attendance } from "@shared/api/graphql/types";
import { type ChartData, type ChartOptions } from "chart.js";
import { useContext, useMemo } from "react";

export function useAttendanceChartData(
  filteredAttendances: Attendance[],
  effectiveDateRange: DateRange,
) {
  const { getStandardWorkHours } = useContext(AppConfigContext);

  const chartSummary = useMemo(
    () =>
      calcAttendanceChartSummary(
        filteredAttendances,
        effectiveDateRange,
        getStandardWorkHours(),
      ),
    [effectiveDateRange, filteredAttendances, getStandardWorkHours],
  );

  const stackedBarData = useMemo<ChartData<"bar">>(
    () => ({
      labels: chartSummary.map((item) => item.label),
      datasets: buildWorkStatusChartDatasets({
        regularHours: chartSummary.map((item) => item.workHours),
        paidHolidayHours: chartSummary.map((item) => item.paidHolidayHours),
        overtimeHours: chartSummary.map((item) => item.overtimeHours),
        restHours: chartSummary.map((item) => item.restHours),
        includeRestDataset: true,
      }),
    }),
    [chartSummary],
  );

  const stackedBarOptions = useMemo<ChartOptions<"bar">>(() => {
    const maxWork = Math.max(
      0,
      ...chartSummary.map(
        (item) => item.workHours + item.paidHolidayHours + item.restHours,
      ),
    );
    const maxOvertime = Math.max(
      0,
      ...chartSummary.map((item) => item.overtimeHours),
    );
    return buildWorkStatusStackedBarOptions({
      maxWorkHours: maxWork,
      maxOvertimeHours: maxOvertime,
      xTicks: {
        maxRotation: 0,
      },
    });
  }, [chartSummary]);

  return {
    chartSummary,
    stackedBarData,
    stackedBarOptions,
  };
}
