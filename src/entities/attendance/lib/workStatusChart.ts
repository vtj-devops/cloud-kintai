import type { ChartOptions } from "chart.js";

export const WORK_STATUS_CHART_STACK = "work-status";

export const WORK_STATUS_DATASET_META = {
  regular: {
    label: "勤務時間",
    backgroundColor: "rgba(14,116,144,0.8)",
    borderColor: "rgba(14,116,144,1)",
  },
  paidHoliday: {
    label: "有給休暇",
    backgroundColor: "rgba(16,185,129,0.82)",
    borderColor: "rgba(16,185,129,1)",
  },
  overtime: {
    label: "残業時間",
    backgroundColor: "rgba(225,29,72,0.82)",
    borderColor: "rgba(225,29,72,1)",
  },
  rest: {
    label: "休憩時間",
    backgroundColor: "rgba(249,115,22,0.76)",
    borderColor: "rgba(249,115,22,1)",
  },
} as const;

export const formatWorkStatusTooltipLabel = (
  datasetLabel: string,
  parsedY: unknown,
) => `${datasetLabel}: ${Math.abs(Number(parsedY ?? 0)).toFixed(1)}h`;

type WorkStatusChartDataset = {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  stack: string;
};

export const buildWorkStatusChartDatasets = ({
  regularHours,
  paidHolidayHours,
  overtimeHours,
  restHours,
  includeRestDataset = false,
  stack = WORK_STATUS_CHART_STACK,
  invertOvertime = true,
  borderWidth = 1,
}: {
  regularHours: number[];
  paidHolidayHours: number[];
  overtimeHours: number[];
  restHours?: number[];
  includeRestDataset?: boolean;
  stack?: string;
  invertOvertime?: boolean;
  borderWidth?: number;
}): WorkStatusChartDataset[] => {
  const datasets: WorkStatusChartDataset[] = [
    {
      label: WORK_STATUS_DATASET_META.regular.label,
      data: regularHours,
      backgroundColor: WORK_STATUS_DATASET_META.regular.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.regular.borderColor,
      borderWidth,
      stack,
    },
    {
      label: WORK_STATUS_DATASET_META.paidHoliday.label,
      data: paidHolidayHours,
      backgroundColor: WORK_STATUS_DATASET_META.paidHoliday.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.paidHoliday.borderColor,
      borderWidth,
      stack,
    },
    {
      label: WORK_STATUS_DATASET_META.overtime.label,
      data: overtimeHours.map((value) => (invertOvertime ? -value : value)),
      backgroundColor: WORK_STATUS_DATASET_META.overtime.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.overtime.borderColor,
      borderWidth,
      stack,
    },
  ];

  if (includeRestDataset) {
    datasets.push({
      label: WORK_STATUS_DATASET_META.rest.label,
      data: restHours ?? [],
      backgroundColor: WORK_STATUS_DATASET_META.rest.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.rest.borderColor,
      borderWidth,
      stack,
    });
  }

  return datasets;
};

export const buildWorkStatusStackedBarOptions = ({
  maxWorkHours,
  maxOvertimeHours,
  xTicks,
  legendPosition = "bottom",
  legendUsePointStyle = false,
  legendBoxWidth = 12,
  legendBoxHeight = 12,
  tickColor = "#64748b",
  yGridColor = "rgba(148,163,184,0.22)",
  yBeginAtZero = false,
  appendHourUnitOnYAxisTicks = true,
  useWorkStatusTooltipLabel = true,
}: {
  maxWorkHours: number;
  maxOvertimeHours: number;
  xTicks?: {
    autoSkip?: boolean;
    maxRotation?: number;
    minRotation?: number;
  };
  legendPosition?: "top" | "bottom" | "left" | "right";
  legendUsePointStyle?: boolean;
  legendBoxWidth?: number;
  legendBoxHeight?: number;
  tickColor?: string;
  yGridColor?: string;
  yBeginAtZero?: boolean;
  appendHourUnitOnYAxisTicks?: boolean;
  useWorkStatusTooltipLabel?: boolean;
}): ChartOptions<"bar"> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: legendPosition,
      labels: {
        usePointStyle: legendUsePointStyle,
        boxWidth: legendBoxWidth,
        boxHeight: legendBoxHeight,
        color: "#334155",
      },
    },
    tooltip: useWorkStatusTooltipLabel
      ? {
          callbacks: {
            label: (context) =>
              formatWorkStatusTooltipLabel(
                context.dataset.label ?? "",
                context.parsed.y,
              ),
          },
        }
      : undefined,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        color: tickColor,
        autoSkip: xTicks?.autoSkip,
        maxRotation: xTicks?.maxRotation,
        minRotation: xTicks?.minRotation,
      },
    },
    y: {
      stacked: true,
      beginAtZero: yBeginAtZero,
      suggestedMin: yBeginAtZero
        ? undefined
        : maxOvertimeHours > 0
          ? -Math.ceil(maxOvertimeHours + 0.5)
          : 0,
      suggestedMax: yBeginAtZero
        ? undefined
        : Math.max(1, Math.ceil(maxWorkHours + 0.5)),
      ticks: {
        color: tickColor,
        callback: appendHourUnitOnYAxisTicks
          ? (value) => `${value}h`
          : undefined,
      },
      grid: {
        color: yGridColor,
      },
    },
  },
});
