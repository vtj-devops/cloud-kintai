import dayjs from "dayjs";

/**
 * ISO 8601形式の日時文字列をHH:mm形式に変換
 *
 * @param isoString - ISO 8601形式の日時文字列 (例: "2024-01-15T09:00:00+09:00")
 * @returns HH:mm形式の時刻文字列 (例: "09:00")
 *
 * @example
 * formatISOToTime("2024-01-15T09:30:00+09:00") // "09:30"
 */
export function formatISOToTime(isoString: string): string {
  return dayjs(isoString).format("HH:mm");
}

/**
 * HH:mm形式の時刻を指定日付のISO 8601形式に変換
 *
 * @param timeString - HH:mm形式の時刻文字列 (例: "09:00")
 * @param baseDate - 基準日 (YYYY-MM-DD形式, 例: "2024-01-15")
 * @returns ISO 8601形式の日時文字列 (例: "2024-01-15T09:00:00+09:00")
 *
 * @example
 * parseTimeToISO("09:30", "2024-01-15") // "2024-01-15T09:30:00+09:00"
 */
export function parseTimeToISO(timeString: string, baseDate: string): string {
  return dayjs(`${baseDate} ${timeString}`)
    .second(0)
    .millisecond(0)
    .toISOString();
}

/**
 * 日付をYYYY-MM-DD形式に変換
 *
 * @param date - Date オブジェクトまたはdayjsオブジェクト
 * @returns YYYY-MM-DD形式の日付文字列
 *
 * @example
 * formatDateToString(new Date("2024-01-15")) // "2024-01-15"
 * formatDateToString(dayjs("2024-01-15")) // "2024-01-15"
 */
export function formatDateToString(date: Date | dayjs.Dayjs): string {
  return dayjs(date).format("YYYY-MM-DD");
}

/**
 * ISO 8601形式の日時文字列から日付部分を抽出
 *
 * @param isoString - ISO 8601形式の日時文字列
 * @returns YYYY-MM-DD形式の日付文字列
 *
 * @example
 * extractDateFromISO("2024-01-15T09:30:00+09:00") // "2024-01-15"
 */
export function extractDateFromISO(isoString: string): string {
  return dayjs(isoString).format("YYYY-MM-DD");
}

export function formatMinutesToHHmm(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0:00";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}
