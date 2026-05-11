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
