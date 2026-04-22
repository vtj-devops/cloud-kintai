import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import { calcAttendanceChartSummary } from "@features/attendance/time-recorder/lib/attendanceSummaryCalculators";
import type { Attendance } from "@shared/api/graphql/types";
import { type ChartData, type ChartOptions } from "chart.js";
import { useContext, useMemo } from "react";

import { AppConfigContext } from "@/context/AppConfigContext";

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
          label: "勤務時間",
          data: chartSummary.map((item) => item.workHours),
          backgroundColor: "rgba(14,116,144,0.8)",
          borderColor: "rgba(14,116,144,1)",
          borderWidth: 1,
          stack: "work-status",
        },
        {
          label: "残業時間",
          data: chartSummary.map((item) => -item.overtimeHours),
          backgroundColor: "rgba(225,29,72,0.82)",
          borderColor: "rgba(225,29,72,1)",
          borderWidth: 1,
          stack: "work-status",
        },
        {
          label: "休憩時間",
          data: chartSummary.map((item) => item.restHours),
          backgroundColor: "rgba(249,115,22,0.76)",
          borderColor: "rgba(249,115,22,1)",
          borderWidth: 1,
          stack: "work-status",
        },
      ],
    }),
    [chartSummary],
  );

  const stackedBarOptions = useMemo<ChartOptions<"bar">>(() => {
    const maxWork = Math.max(
      0,
      ...chartSummary.map((item) => item.workHours + item.restHours),
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
              `${context.dataset.label}: ${Math.abs(Number(context.parsed.y ?? 0)).toFixed(1)}h`,
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
