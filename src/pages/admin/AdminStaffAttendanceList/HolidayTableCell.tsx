import { TableCell } from "@mui/material";

import { CompanyHoliday } from "@/lib/CompanyHoliday";
import { Holiday } from "@/lib/Holiday";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
} from "../../../API";

export function HolidayTableCell({
  attendance,
  holidayCalendars,
  companyHolidayCalendars,
}: {
  attendance: Attendance;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
}) {
  const holidayName = new Holiday(
    holidayCalendars,
    attendance.workDate
  ).getHoliday()?.name;

  const companyHolidayName = new CompanyHoliday(
    companyHolidayCalendars,
    attendance.workDate
  ).getHoliday()?.name;

  return (
    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {holidayName || companyHolidayName || ""}
    </TableCell>
  );
}
