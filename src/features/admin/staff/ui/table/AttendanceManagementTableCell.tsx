import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { TableCell } from "@mui/material";

export function AttendanceManagementTableCell({ staff }: { staff: StaffType }) {
  const isAttendanceManaged = staff.attendanceManagementEnabled !== false;

  return <TableCell>{isAttendanceManaged ? "✓ 対象" : "✗ 対象外"}</TableCell>;
}

export default AttendanceManagementTableCell;
