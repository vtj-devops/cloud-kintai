import dayjs from "dayjs";

export function toTimeValue(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("HH:mm") : "";
}

export function toIsoDateTime(value: string, workDate: dayjs.Dayjs): string | null {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return dayjs(workDate)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toISOString();
}

export function normalizeTimeDraft(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isCompleteTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}
