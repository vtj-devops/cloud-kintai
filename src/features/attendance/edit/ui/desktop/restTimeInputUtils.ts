import {
  formatISOToTimeOrEmpty,
  isCompleteTime as isCompleteTimeBase,
  normalizeTimeDraft as normalizeTimeDraftBase,
  parseTimeToISOOrNull,
} from "@shared/lib/time";
import { type Dayjs } from "dayjs";

export function toTimeValue(value: string | null | undefined): string {
  return formatISOToTimeOrEmpty(value);
}

export function toIsoDateTime(value: string, workDate: Dayjs): string | null {
  return parseTimeToISOOrNull(value, workDate);
}

export function normalizeTimeDraft(value: string): string {
  return normalizeTimeDraftBase(value);
}

export function isCompleteTime(value: string): boolean {
  return isCompleteTimeBase(value);
}
