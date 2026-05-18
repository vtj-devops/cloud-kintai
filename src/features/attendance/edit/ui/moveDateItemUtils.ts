import { formatMonthQueryValue,MONTH_QUERY_KEY } from "@shared/lib/monthQuery";
import dayjs from "dayjs";

export function buildAttendanceEditPath(params: {
  date: dayjs.Dayjs;
  isAdmin: boolean;
  staffId?: string;
  searchParams: URLSearchParams;
  queryParamFormat: string;
}) {
  const { date, isAdmin, staffId, searchParams, queryParamFormat } = params;
  const formatted = date.format(queryParamFormat);

  if (isAdmin) {
    return `/admin/attendances/edit/${formatted}/${staffId}`;
  }

  const nextParams = new URLSearchParams(searchParams);
  nextParams.set(MONTH_QUERY_KEY, formatMonthQueryValue(date));
  return `/attendance/${formatted}/edit?${nextParams.toString()}`;
}

export function applyWorkDateValue(params: {
  value: string;
  navigate: (path: string) => void;
  buildPath: (date: dayjs.Dayjs) => string;
}) {
  const { value, navigate, buildPath } = params;
  if (!value) return;

  const date = dayjs(value);
  if (!date.isValid()) return;

  navigate(buildPath(date));
}
