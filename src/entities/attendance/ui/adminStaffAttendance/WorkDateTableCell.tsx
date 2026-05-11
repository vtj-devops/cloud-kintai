import { CompanyHoliday } from "@entities/attendance/lib/CompanyHoliday";
import { DayOfWeek } from "@entities/attendance/lib/DayOfWeek";
import {
  Holiday,
  normalizeHolidayName,
} from "@entities/attendance/lib/Holiday";
import { styled, TableCell as MuiTableCell } from "@mui/material";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

const TableCell = styled(MuiTableCell)(({ theme }) => ({
  width: theme.spacing(10),
  minWidth: theme.spacing(10),
  textAlign: "left",
}));

export function WorkDateTableCell({
  workDate,
  holidayCalendars,
  companyHolidayCalendars,
}: {
  workDate: Attendance["workDate"];
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
}) {
  const date = dayjs(workDate);

  const holiday = new Holiday(holidayCalendars, workDate);
  const holidayName = holiday.getHoliday()?.name
    ? normalizeHolidayName(holiday.getHoliday()!.name)
    : undefined;

  const dayOfWeek = new DayOfWeek(holidayCalendars).getLabel(workDate);

  const companyHoliday = new CompanyHoliday(companyHolidayCalendars, workDate);
  const companyHolidayName = companyHoliday.getHoliday()?.name;

  return (
    <TableCell sx={{ whiteSpace: "nowrap" }}>{`${date.format(
      "M/D",
    )}(${dayOfWeek}) ${holidayName || companyHolidayName || ""}`}</TableCell>
  );
}
