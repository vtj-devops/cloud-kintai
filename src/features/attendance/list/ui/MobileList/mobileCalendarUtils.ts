import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { normalizeHolidayName } from "@entities/attendance/lib/Holiday";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
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

export const statusLabelMap: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Ok]: "OK",
  [AttendanceStatus.Error]: "要確認",
  [AttendanceStatus.Requesting]: "申請中",
  [AttendanceStatus.Late]: "遅刻",
  [AttendanceStatus.Working]: "勤務中",
  [AttendanceStatus.None]: "",
};

export const statusTextColorMap: Partial<Record<AttendanceStatus, string>> = {
  [AttendanceStatus.Ok]: "var(--mui-palette-success-main)",
  [AttendanceStatus.Error]: "var(--mui-palette-error-main)",
  [AttendanceStatus.Late]: "var(--mui-palette-warning-main)",
  [AttendanceStatus.Requesting]: "var(--mui-palette-info-main)",
  [AttendanceStatus.Working]: "var(--mui-palette-info-main)",
};

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

export const getStatusBadgeMeta = (status: AttendanceStatus) => {
  if (status === AttendanceStatus.Error) {
    return {
      label: "エラー",
      backgroundColor: "rgba(211, 47, 47, 0.14)",
      color: "#8f1d1d",
    };
  }
  if (status === AttendanceStatus.Late) {
    return {
      label: "遅刻",
      backgroundColor: "rgba(237, 108, 2, 0.18)",
      color: "#8a3b00",
    };
  }
  if (status === AttendanceStatus.Ok) {
    return {
      label: "正常",
      backgroundColor: "rgba(46, 125, 50, 0.14)",
      color: "#1f5f24",
    };
  }
  return {
    label: "未入力",
    backgroundColor: "var(--mui-palette-grey-200)",
    color: "var(--mui-palette-text-secondary)",
  };
};

export const formatTimeRange = (
  startTime?: string | null,
  endTime?: string | null,
  emptyLabel = "--:--",
) => {
  const formattedStart = startTime ? dayjs(startTime).format("HH:mm") : "--:--";
  const formattedEnd = endTime ? dayjs(endTime).format("HH:mm") : "--:--";

  if (!startTime && !endTime) return emptyLabel;
  return `${formattedStart} 〜 ${formattedEnd}`;
};

export const resolveMonthlyTerms = (
  currentMonth: Dayjs,
  closeDates: CloseDate[] = [],
  palette: string[],
): MonthTerm[] => {
  return resolveMonthlyTermsBase(currentMonth, closeDates, palette, "mobile");
};
