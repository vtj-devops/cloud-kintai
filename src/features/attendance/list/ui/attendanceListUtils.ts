import {
  type CloseDatePeriod,
  type DateRange,
  formatDateRangeLabel,
  getAttendanceQueryDateRange,
  getEffectiveDateRange,
} from "@entities/attendance/lib/aggregationDateRange";
import { MONTH_QUERY_KEY } from "@shared/lib/monthQuery";
import dayjs, { Dayjs } from "dayjs";

export type { CloseDatePeriod, DateRange };
export { MONTH_QUERY_KEY };

export const getCurrentMonthFromQuery = (monthParam: string | null): Dayjs => {
  if (!monthParam) {
    return dayjs().startOf("month");
  }

  const parsedMonth = dayjs(monthParam, "YYYY-MM", true);
  if (!parsedMonth.isValid()) {
    return dayjs().startOf("month");
  }

  return parsedMonth.startOf("month");
};

export const shouldRefetchForAttendanceEvent = (
  currentStaffId: string,
  queryRange: DateRange,
  eventStaffId?: string | null,
  workDate?: string | null,
): boolean => {
  if (!eventStaffId || !workDate) return false;
  if (eventStaffId !== currentStaffId) return false;

  const eventDate = dayjs(workDate);
  return eventDate.isBetween(queryRange.start, queryRange.end, "day", "[]");
};

export {
  formatDateRangeLabel,
  getAttendanceQueryDateRange,
  getEffectiveDateRange,
};
