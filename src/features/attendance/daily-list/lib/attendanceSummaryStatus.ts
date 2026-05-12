import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { getStatus } from "@features/attendance/list/lib/attendanceStatusUtils";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { Dayjs } from "dayjs";

export type AttendanceSummaryStatus = "ok" | "requesting" | "error" | "none";

export const resolveAttendanceSummaryStatus = ({
  attendances,
  holidayCalendars,
  companyHolidayCalendars,
  staff,
  baseDate,
}: {
  attendances: Attendance[];
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  staff: Staff;
  baseDate: Dayjs;
}): AttendanceSummaryStatus => {
  const attendanceMap = attendances.reduce((map, attendance) => {
    if (!attendance.workDate || map.has(attendance.workDate)) {
      return map;
    }
    map.set(attendance.workDate, attendance);
    return map;
  }, new Map<string, Attendance>());

  const monthStart = baseDate.startOf("month");
  const monthEnd = baseDate.endOf("month");
  const judgedStatus: AttendanceStatus[] = [];
  let cursor = monthStart;

  while (cursor.isBefore(monthEnd, "day") || cursor.isSame(monthEnd, "day")) {
    const workDate = cursor.format(AttendanceDate.DataFormat);
    judgedStatus.push(
      getStatus(
        attendanceMap.get(workDate),
        staff,
        holidayCalendars,
        companyHolidayCalendars,
        cursor,
      ),
    );
    cursor = cursor.add(1, "day");
  }

  const validDataCount = judgedStatus.filter(
    (status) => status !== AttendanceStatus.None,
  ).length;
  const statusOkCount = judgedStatus.filter((status) =>
    [AttendanceStatus.Ok, AttendanceStatus.Working].includes(status),
  ).length;

  if (validDataCount === 0) {
    return "none";
  }

  if (statusOkCount === validDataCount) {
    return "ok";
  }

  if (judgedStatus.includes(AttendanceStatus.Requesting)) {
    return "requesting";
  }

  return "error";
};
