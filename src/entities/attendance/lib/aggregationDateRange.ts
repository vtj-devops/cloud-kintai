import dayjs, { Dayjs } from "dayjs";

import {
  getMonthDateRange,
  getOverlappingCloseDateRanges,
} from "./closeDateRangeUtils";

export type CloseDatePeriod = {
  startDate?: string | null;
  endDate?: string | null;
  closeDate?: string | null;
  updatedAt?: string | null;
};

export type DateRange = {
  start: Dayjs;
  end: Dayjs;
};

export const getEffectiveDateRange = (
  currentMonth: Dayjs,
  closeDates: CloseDatePeriod[],
): DateRange & { hasValidPeriod: boolean } => {
  const { monthStart, monthEnd } = getMonthDateRange(currentMonth);
  const today = dayjs();

  const applicableCloseDates = getOverlappingCloseDateRanges(currentMonth, closeDates);

  if (applicableCloseDates.length === 0) {
    return {
      start: monthStart,
      end: monthEnd,
      hasValidPeriod: false,
    };
  }

  const containingToday = applicableCloseDates.find((closeDate) => {
    const { start, end } = closeDate;
    return !today.isBefore(start, "day") && !today.isAfter(end, "day");
  });

  if (containingToday) {
    return {
      start: containingToday.start,
      end: containingToday.end,
      hasValidPeriod: true,
    };
  }

  const latestCloseDate = applicableCloseDates.reduce((prev, current) => {
    const prevUpdatedAt = dayjs(
      prev.source.updatedAt ?? prev.source.closeDate,
    ).valueOf();
    const currentUpdatedAt = dayjs(
      current.source.updatedAt ?? current.source.closeDate,
    ).valueOf();
    return currentUpdatedAt > prevUpdatedAt ? current : prev;
  });

  return {
    start: latestCloseDate.start,
    end: latestCloseDate.end,
    hasValidPeriod: true,
  };
};

export const getAttendanceQueryDateRange = (
  currentMonth: Dayjs,
  effectiveDateRange: DateRange,
): DateRange => {
  const { monthStart, monthEnd } = getMonthDateRange(currentMonth);

  return {
    start: effectiveDateRange.start.isBefore(monthStart, "day")
      ? effectiveDateRange.start
      : monthStart,
    end: effectiveDateRange.end.isAfter(monthEnd, "day")
      ? effectiveDateRange.end
      : monthEnd,
  };
};

export const getEffectivePastDateRangeEnd = (
  effectiveDateRange: DateRange,
  today: Dayjs,
): Dayjs => {
  const currentDay = today.startOf("day");
  return effectiveDateRange.end.isAfter(currentDay, "day")
    ? currentDay
    : effectiveDateRange.end.startOf("day");
};

export const formatDateRangeLabel = (range: DateRange): string => {
  const startLabel = range.start.format("M/D");
  const endLabel = range.end.format("M/D");
  return `${startLabel}〜${endLabel}`;
};
