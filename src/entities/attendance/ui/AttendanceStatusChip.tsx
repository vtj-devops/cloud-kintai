import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import StatusChip from "@shared/ui/chips/StatusChip";

type FeedbackKey = "success" | "warning" | "danger" | "info";

const ATTENDANCE_STATUS_LABEL_MAP: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Ok]: "OK",
  [AttendanceStatus.Error]: "要確認",
  [AttendanceStatus.Requesting]: "申請中",
  [AttendanceStatus.Late]: "遅刻",
  [AttendanceStatus.Working]: "勤務中",
  [AttendanceStatus.None]: "",
};

const ATTENDANCE_STATUS_COLOR_MAP: Partial<Record<AttendanceStatus, FeedbackKey>> = {
  [AttendanceStatus.Ok]: "success",
  [AttendanceStatus.Error]: "danger",
  [AttendanceStatus.Requesting]: "warning",
  [AttendanceStatus.Late]: "danger",
  [AttendanceStatus.Working]: "info",
};

interface AttendanceStatusChipProps {
  status: AttendanceStatus;
}

export default function AttendanceStatusChip({ status }: AttendanceStatusChipProps) {
  if (status === AttendanceStatus.None) return null;
  return (
    <StatusChip
      status={status}
      labelMap={ATTENDANCE_STATUS_LABEL_MAP}
      colorMap={ATTENDANCE_STATUS_COLOR_MAP}
    />
  );
}
