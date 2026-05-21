import dayjs, { type Dayjs } from "dayjs";

import { formatISOToTimeOrEmpty } from "./timeConverter";

export function formatDateSlash(d?: string | null) {
  if (!d) return "";
  return d.replace(/-/g, "/");
}

export function isoDateFromTimestamp(ts?: string | null) {
  if (!ts) return "";
  return ts.split("T")[0];
}

export function formatDateTimeReadable(
  value?: string | null,
  emptyValueFallback = "",
) {
  if (!value) return emptyValueFallback;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format("YYYY/MM/DD HH:mm");
}

type FormatISOTimeRangeOptions = {
  separator?: string;
  emptyLabel?: string;
  missingTimeLabel?: string;
  emptyAsUndefined?: boolean;
};

export function formatISOTimeRange(
  startTime?: string | null,
  endTime?: string | null,
  options: FormatISOTimeRangeOptions = {},
): string | undefined {
  const {
    separator = " 〜 ",
    emptyLabel = "--:--",
    missingTimeLabel = "--:--",
    emptyAsUndefined = false,
  } = options;

  if (!startTime && !endTime) {
    return emptyAsUndefined ? undefined : emptyLabel;
  }

  const start = formatISOToTimeOrEmpty(startTime) || missingTimeLabel;
  const end = formatISOToTimeOrEmpty(endTime) || missingTimeLabel;
  return `${start}${separator}${end}`.trim();
}

export function formatRelativeDateTime(value?: string | null, now?: Dayjs) {
  if (!value) return "";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;

  const current = now ?? dayjs();
  const elapsedSeconds = current.diff(parsed, "second");

  if (elapsedSeconds <= 0) {
    return "今";
  }
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}秒前`;
  }

  const elapsedMinutes = current.diff(parsed, "minute");
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}分前`;
  }

  const dayDiff = current.startOf("day").diff(parsed.startOf("day"), "day");
  if (dayDiff === 1) {
    return "昨日";
  }
  if (dayDiff >= 2 && dayDiff <= 6) {
    return `${dayDiff}日前`;
  }
  if (dayDiff >= 7) {
    if (current.year() === parsed.year()) {
      return parsed.format("M/D");
    }
    return parsed.format("YYYY/MM/DD");
  }

  const elapsedHours = current.diff(parsed, "hour");
  if (elapsedHours < 24) {
    return `${elapsedHours}時間前`;
  }
  return parsed.format("YYYY/MM/DD");
}
