import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import {
  attendanceStatusChipColorMap,
  attendanceStatusLabelMap,
} from "@entities/attendance/lib/statusPresentation";
import StatusChip from "@shared/ui/chips/StatusChip";

interface AttendanceStatusChipProps {
  status: AttendanceStatus;
}

export default function AttendanceStatusChip({ status }: AttendanceStatusChipProps) {
  if (status === AttendanceStatus.None) return null;
  return (
    <StatusChip
      status={status}
      labelMap={attendanceStatusLabelMap}
      colorMap={attendanceStatusChipColorMap}
    />
  );
}
