import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import {
  formatWorkStatusTooltipLabel,
  WORK_STATUS_CHART_STACK,
  WORK_STATUS_DATASET_META,
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
      datasets: [
        {
          label: WORK_STATUS_DATASET_META.regular.label,
          data: chartSummary.map((item) => item.workHours),
          backgroundColor: WORK_STATUS_DATASET_META.regular.backgroundColor,
          borderColor: WORK_STATUS_DATASET_META.regular.borderColor,
          borderWidth: 1,
          stack: WORK_STATUS_CHART_STACK,
        },
        {
          label: WORK_STATUS_DATASET_META.paidHoliday.label,
          data: chartSummary.map((item) => item.paidHolidayHours),
          backgroundColor: WORK_STATUS_DATASET_META.paidHoliday.backgroundColor,
          borderColor: WORK_STATUS_DATASET_META.paidHoliday.borderColor,
          borderWidth: 1,
          stack: WORK_STATUS_CHART_STACK,
        },
        {
          label: WORK_STATUS_DATASET_META.overtime.label,
          data: chartSummary.map((item) => -item.overtimeHours),
          backgroundColor: WORK_STATUS_DATASET_META.overtime.backgroundColor,
          borderColor: WORK_STATUS_DATASET_META.overtime.borderColor,
          borderWidth: 1,
          stack: WORK_STATUS_CHART_STACK,
        },
        {
          label: WORK_STATUS_DATASET_META.rest.label,
          data: chartSummary.map((item) => item.restHours),
          backgroundColor: WORK_STATUS_DATASET_META.rest.backgroundColor,
          borderColor: WORK_STATUS_DATASET_META.rest.borderColor,
          borderWidth: 1,
          stack: WORK_STATUS_CHART_STACK,
        },
      ],
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
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            color: "#334155",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              formatWorkStatusTooltipLabel(
                context.dataset.label ?? "",
                context.parsed.y,
              ),
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
          },
        },
        y: {
          stacked: true,
          suggestedMin: maxOvertime > 0 ? -Math.ceil(maxOvertime + 0.5) : 0,
          suggestedMax: Math.max(1, Math.ceil(maxWork + 0.5)),
          ticks: {
            color: "#64748b",
            callback: (value) => `${value}h`,
          },
          grid: {
            color: "rgba(148,163,184,0.22)",
          },
        },
      },
    };
  }, [chartSummary]);

  return {
    chartSummary,
    stackedBarData,
    stackedBarOptions,
  };
}
