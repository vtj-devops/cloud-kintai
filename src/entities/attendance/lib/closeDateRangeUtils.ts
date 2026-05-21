import dayjs, { Dayjs } from "dayjs";

export type CloseDateRangeInput = {
  startDate?: string | null;
  endDate?: string | null;
};

export type ParsedCloseDateRange<T extends CloseDateRangeInput> = {
  start: Dayjs;
  end: Dayjs;
  source: T;
};

export type MonthDateRange = {
  monthStart: Dayjs;
  monthEnd: Dayjs;
};

export const getMonthDateRange = (currentMonth: Dayjs): MonthDateRange => ({
  monthStart: currentMonth.startOf("month"),
  monthEnd: currentMonth.endOf("month"),
});

export const getOverlappingCloseDateRanges = <T extends CloseDateRangeInput>(
  currentMonth: Dayjs,
  closeDates: T[],
): ParsedCloseDateRange<T>[] => {
  const { monthStart, monthEnd } = getMonthDateRange(currentMonth);

  return closeDates
    .map((closeDate) => {
      const start = dayjs(closeDate.startDate);
      const end = dayjs(closeDate.endDate);
      return { start, end, source: closeDate };
    })
    .filter(
      ({ start, end }) =>
        start.isValid() &&
        end.isValid() &&
        !end.isBefore(monthStart, "day") &&
        !start.isAfter(monthEnd, "day"),
    );
};
