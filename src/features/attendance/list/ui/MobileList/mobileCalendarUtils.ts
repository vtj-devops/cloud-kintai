import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { normalizeHolidayName } from "@entities/attendance/lib/Holiday";
import {
  attendanceStatusLabelMap,
  attendanceStatusTextColorMap,
  getAttendanceStatusBadgeMeta,
} from "@entities/attendance/lib/statusPresentation";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { formatISOTimeRange } from "@shared/lib/time";
import dayjs, { Dayjs } from "dayjs";

import { getStatus, isHolidayLike } from "../../lib/attendanceStatusUtils";
import {
  MonthTerm,
  resolveMonthlyTerms as resolveMonthlyTermsBase,
} from "../../lib/monthlyTermUtils";

export type { MonthTerm };

export type HolidayInfo = {
  name: string;
  type: "holiday" | "company";
};

export type CalendarDay = {
  date: Dayjs;
  isCurrentMonth: boolean;
};

export type DayCellMeta = {
  status: AttendanceStatus;
  hasError: boolean;
  holidayInfo: HolidayInfo | null;
  termColor?: string;
};

const DATE_KEY_FORMAT = "YYYY-MM-DD";

export const statusLabelMap = attendanceStatusLabelMap;
export const statusTextColorMap = attendanceStatusTextColorMap;

export const formatDateKey = (date: Dayjs) => date.format(DATE_KEY_FORMAT);

export const buildAttendanceMap = (attendances: Attendance[]) => {
  const map = new Map<string, Attendance>();
  attendances.forEach((attendance) => {
    map.set(formatDateKey(dayjs(attendance.workDate)), attendance);
  });
  return map;
};

export const createCalendarDays = (
  monthStart: Dayjs,
  monthEnd: Dayjs,
): CalendarDay[] => {
  const startDate = monthStart.subtract(monthStart.day(), "day");
  const endDate = monthEnd.add(6 - monthEnd.day(), "day");
  const days: CalendarDay[] = [];

  let current = startDate.clone();
  while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
    days.push({
      date: current.clone(),
      isCurrentMonth: current.isSame(monthStart, "month"),
    });
    current = current.add(1, "day");
  }

  return days;
};

export const getHolidayInfoByDate = (
  date: Dayjs,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[],
): HolidayInfo | null => {
  const dateStr = formatDateKey(date);

  const holiday = holidayCalendars.find((h) => h.holidayDate === dateStr);
  if (holiday) {
    return {
      name: normalizeHolidayName(holiday.name || "祝日"),
      type: "holiday",
    };
  }

  const companyHoliday = companyHolidayCalendars.find(
    (h) => h.holidayDate === dateStr,
  );
  if (companyHoliday) {
    return { name: companyHoliday.name || "会社休日", type: "company" };
  }

  return null;
};

const hasDayError = (status: AttendanceStatus) =>
  status === AttendanceStatus.Error || status === AttendanceStatus.Late;

const resolveDayTermColor = ({
  date,
  monthlyTerms,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
}: {
  date: Dayjs;
  monthlyTerms: MonthTerm[];
  staff?: Staff | null;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
}) => {
  const isWeekend = [0, 6].includes(date.day());
  const holidayLike = isHolidayLike(
    date,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
  );
  const allowTermHighlight =
    staff?.workType === "shift" ? true : !holidayLike && !isWeekend;

  if (!allowTermHighlight) return undefined;

  const primaryTerm = monthlyTerms.find(
    (term) =>
      !date.isBefore(term.start, "day") && !date.isAfter(term.end, "day"),
  );
  return primaryTerm?.color;
};

export const getDayCellMeta = ({
  date,
  attendance,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
  monthlyTerms,
}: {
  date: Dayjs;
  attendance: Attendance | undefined;
  staff?: Staff | null;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  monthlyTerms: MonthTerm[];
}): DayCellMeta => {
  const status = getStatus(
    attendance,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    date,
  );

  return {
    status,
    hasError: hasDayError(status),
    holidayInfo: getHolidayInfoByDate(
      date,
      holidayCalendars,
      companyHolidayCalendars,
    ),
    termColor: resolveDayTermColor({
      date,
      monthlyTerms,
      staff,
      holidayCalendars,
      companyHolidayCalendars,
    }),
  };
};

export const getStatusBadgeMeta = getAttendanceStatusBadgeMeta;

export const formatTimeRange = (
  startTime?: string | null,
  endTime?: string | null,
  emptyLabel = "--:--",
) => {
  return (
    formatISOTimeRange(startTime, endTime, {
      emptyLabel,
      missingTimeLabel: "--:--",
    }) ?? emptyLabel
  );
};

export const resolveMonthlyTerms = (
  currentMonth: Dayjs,
  closeDates: CloseDate[] = [],
  palette: string[],
): MonthTerm[] => {
  return resolveMonthlyTermsBase(currentMonth, closeDates, palette, "mobile");
};
