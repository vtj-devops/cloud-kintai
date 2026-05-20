import { AttendanceStatus } from "./AttendanceState";

type FeedbackKey = "success" | "warning" | "danger" | "info";

type AttendanceStatusBadgeMeta = {
  label: string;
  backgroundColor: string;
  color: string;
};

type AttendanceDayCellStyle = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

export const attendanceStatusLabelMap: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Ok]: "OK",
  [AttendanceStatus.Error]: "要確認",
  [AttendanceStatus.Requesting]: "申請中",
  [AttendanceStatus.Late]: "遅刻",
  [AttendanceStatus.Working]: "勤務中",
  [AttendanceStatus.None]: "",
};

export const attendanceStatusChipColorMap: Partial<
  Record<AttendanceStatus, FeedbackKey>
> = {
  [AttendanceStatus.Ok]: "success",
  [AttendanceStatus.Error]: "danger",
  [AttendanceStatus.Requesting]: "warning",
  [AttendanceStatus.Late]: "danger",
  [AttendanceStatus.Working]: "info",
};

export const attendanceStatusTextColorMap: Partial<Record<AttendanceStatus, string>> =
  {
    [AttendanceStatus.Ok]: "var(--mui-palette-success-main)",
    [AttendanceStatus.Error]: "var(--mui-palette-error-main)",
    [AttendanceStatus.Late]: "var(--mui-palette-warning-main)",
    [AttendanceStatus.Requesting]: "var(--mui-palette-info-main)",
    [AttendanceStatus.Working]: "var(--mui-palette-info-main)",
  };

const ERROR_BADGE_META: AttendanceStatusBadgeMeta = {
  label: "エラー",
  backgroundColor: "rgba(211, 47, 47, 0.14)",
  color: "#8f1d1d",
};

const LATE_BADGE_META: AttendanceStatusBadgeMeta = {
  label: "遅刻",
  backgroundColor: "rgba(237, 108, 2, 0.18)",
  color: "#8a3b00",
};

const OK_BADGE_META: AttendanceStatusBadgeMeta = {
  label: "正常",
  backgroundColor: "rgba(46, 125, 50, 0.14)",
  color: "#1f5f24",
};

const EMPTY_BADGE_META: AttendanceStatusBadgeMeta = {
  label: "未入力",
  backgroundColor: "var(--mui-palette-grey-200)",
  color: "var(--mui-palette-text-secondary)",
};

export const getAttendanceStatusBadgeMeta = (
  status: AttendanceStatus,
): AttendanceStatusBadgeMeta => {
  if (status === AttendanceStatus.Error) return ERROR_BADGE_META;
  if (status === AttendanceStatus.Late) return LATE_BADGE_META;
  if (status === AttendanceStatus.Ok) return OK_BADGE_META;
  return EMPTY_BADGE_META;
};

const ERROR_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "rgba(211, 47, 47, 0.14)",
  borderColor: "var(--mui-palette-error-main)",
  color: "#8f1d1d",
};

const LATE_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "rgba(237, 108, 2, 0.18)",
  borderColor: "var(--mui-palette-warning-main)",
  color: "#8a3b00",
};

const OK_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "rgba(46, 125, 50, 0.14)",
  borderColor: "rgba(46, 125, 50, 0.32)",
  color: "#1f5f24",
};

const ACTIVE_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "rgba(2, 136, 209, 0.12)",
  borderColor: "rgba(2, 136, 209, 0.34)",
  color: "#0b5f8a",
};

const HOLIDAY_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "rgba(237, 108, 2, 0.1)",
  borderColor: "rgba(237, 108, 2, 0.28)",
  color: "var(--mui-palette-text-primary)",
};

const DEFAULT_DAY_CELL_STYLE: AttendanceDayCellStyle = {
  backgroundColor: "var(--mui-palette-background-paper)",
  borderColor: "var(--mui-palette-divider)",
  color: "var(--mui-palette-text-primary)",
};

export const getAttendanceStatusDayCellStyle = ({
  status,
  hasError,
  isHolidayLike,
}: {
  status?: AttendanceStatus;
  hasError: boolean;
  isHolidayLike?: boolean;
}): AttendanceDayCellStyle => {
  if (status === AttendanceStatus.Error || hasError) return ERROR_DAY_CELL_STYLE;
  if (status === AttendanceStatus.Late) return LATE_DAY_CELL_STYLE;
  if (status === AttendanceStatus.Ok) return OK_DAY_CELL_STYLE;
  if (status === AttendanceStatus.Requesting || status === AttendanceStatus.Working) {
    return ACTIVE_DAY_CELL_STYLE;
  }
  if (isHolidayLike) return HOLIDAY_DAY_CELL_STYLE;
  return DEFAULT_DAY_CELL_STYLE;
};
