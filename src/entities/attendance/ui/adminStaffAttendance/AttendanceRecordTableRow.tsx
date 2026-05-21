import { CreatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/CreatedAtTableCell";
import { RestTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/RestTimeTableCell";
import { SummaryTableCell } from "@entities/attendance/ui/adminStaffAttendance/SummaryTableCell";
import { UpdatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/UpdatedAtTableCell";
import { WorkDateTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkDateTableCell";
import { WorkTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkTimeTableCell";
import {
  AttendanceRowVariant,
  attendanceRowVariantStyles,
} from "@entities/attendance/ui/rowVariant";
import { TableCell, TableRow } from "@mui/material";
import type {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import type { ReactNode } from "react";

type AttendanceRecordTableRowProps = {
  attendance: Attendance;
  rowVariant: AttendanceRowVariant;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  actionCell: ReactNode;
  applyCheckCell?: ReactNode;
  selectionCell?: ReactNode;
  rowTestId?: string;
  applyCheckAlign?: "left" | "right";
};

export function AttendanceRecordTableRow({
  attendance,
  rowVariant,
  holidayCalendars,
  companyHolidayCalendars,
  actionCell,
  applyCheckCell,
  selectionCell,
  rowTestId,
  applyCheckAlign = "left",
}: AttendanceRecordTableRowProps) {
  return (
    <TableRow sx={attendanceRowVariantStyles[rowVariant]} data-testid={rowTestId}>
      {selectionCell && <TableCell padding="checkbox">{selectionCell}</TableCell>}
      <TableCell>{actionCell}</TableCell>
      <WorkDateTableCell
        workDate={attendance.workDate}
        holidayCalendars={holidayCalendars}
        companyHolidayCalendars={companyHolidayCalendars}
      />
      <WorkTimeTableCell attendance={attendance} />
      <RestTimeTableCell attendance={attendance} />
      <SummaryTableCell
        substituteHolidayDate={attendance.substituteHolidayDate}
        specialHolidayFlag={attendance.specialHolidayFlag}
        paidHolidayFlag={attendance.paidHolidayFlag}
        absentFlag={attendance.absentFlag}
      />
      <CreatedAtTableCell createdAt={attendance.createdAt} />
      <UpdatedAtTableCell updatedAt={attendance.updatedAt} />
      <TableCell sx={{ width: 1 }} align={applyCheckAlign}>
        {applyCheckCell}
      </TableCell>
    </TableRow>
  );
}
