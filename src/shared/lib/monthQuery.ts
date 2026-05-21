import type { Dayjs } from "dayjs";

export const MONTH_QUERY_KEY = "month";

export const formatMonthQueryValue = (date: Dayjs): string =>
  date.startOf("month").format("YYYY-MM");

export const createMonthSearchParams = (
  month: string,
): URLSearchParams =>
  new URLSearchParams({
    [MONTH_QUERY_KEY]: month,
  });

export const createMonthSearchParamsFromDate = (
  date: Dayjs,
): URLSearchParams => createMonthSearchParams(formatMonthQueryValue(date));
