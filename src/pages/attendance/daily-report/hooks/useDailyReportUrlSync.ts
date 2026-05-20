import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SetURLSearchParams } from "react-router-dom";

const resolveDateFromParams = (
  searchParams: URLSearchParams,
  dateFormat: string,
) => {
  const dateParam = searchParams.get("date");
  if (dateParam) {
    const parsed = dayjs(dateParam, dateFormat);
    if (parsed.isValid()) {
      return parsed.startOf("day");
    }
  }
  return dayjs().startOf("day");
};

interface UseDailyReportUrlSyncParams {
  dateFormat: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  onInitialize: (dateKey: string) => void;
}

interface SyncCalendarDateResult {
  dateKey: string;
  normalizedDate: Dayjs;
}

export function useDailyReportUrlSync({
  dateFormat,
  searchParams,
  setSearchParams,
  onInitialize,
}: UseDailyReportUrlSyncParams) {
  const [calendarDate, setCalendarDate] = useState<Dayjs>(() =>
    resolveDateFromParams(searchParams, dateFormat),
  );
  const isInitializedFromUrlRef = useRef(false);

  useEffect(() => {
    if (isInitializedFromUrlRef.current) return;

    const dateParam = searchParams.get("date");
    const targetDate = resolveDateFromParams(searchParams, dateFormat);
    const dateKey = targetDate.format(dateFormat);
    onInitialize(dateKey);

    if (!dateParam || !dayjs(dateParam, dateFormat).isValid()) {
      setSearchParams({ date: dateKey }, { replace: true });
    }

    isInitializedFromUrlRef.current = true;
  }, [dateFormat, onInitialize, searchParams, setSearchParams]);

  const syncCalendarDateToUrl = useCallback(
    (value: Dayjs): SyncCalendarDateResult => {
      const normalizedDate = value.startOf("day");
      const dateKey = normalizedDate.format(dateFormat);
      setCalendarDate(normalizedDate);
      setSearchParams({ date: dateKey });
      return { dateKey, normalizedDate };
    },
    [dateFormat, setSearchParams],
  );

  return {
    calendarDate,
    syncCalendarDateToUrl,
  };
}
