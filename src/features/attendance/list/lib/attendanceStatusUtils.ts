/**
 * 勤怠カレンダーの状態判定および計算ロジック
 * 複数のコンポーネント間で共有されるロジックを集約
 */
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  AttendanceState,
  AttendanceStatus,
} from "@entities/attendance/lib/AttendanceState";
import { CompanyHoliday } from "@entities/attendance/lib/CompanyHoliday";
import {
  Holiday,
  normalizeHolidayName,
} from "@entities/attendance/lib/Holiday";
import {
  calcTotalRestTime,
  calcTotalWorkTime,
} from "@entities/attendance/lib/time";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";

/**
 * カレンダーの週・日リストを生成
 */
export function buildWeeks(targetMonth: Dayjs) {
  const monthStart = targetMonth.startOf("month").startOf("week");
  const monthEnd = targetMonth.endOf("month").endOf("week");
  const days: Dayjs[] = [];

  let cursor = monthStart;
  while (cursor.isBefore(monthEnd) || cursor.isSame(monthEnd, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const weeks: Dayjs[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/**
 * 実働時間を計算
 */
export function getNetWorkingHours(attendance: Attendance | undefined) {
  if (!attendance) return 0;
  if (!attendance.startTime || !attendance.endTime) return 0;

  const workTime = calcTotalWorkTime(attendance.startTime, attendance.endTime);
  const totalRest = getTotalRestHours(attendance);

  return Math.max(workTime - totalRest, 0);
}

/**
 * 合計休憩時間を計算
 */
export function getTotalRestHours(attendance: Attendance | undefined) {
  if (!attendance?.rests || !attendance.endTime) return 0;

  const totalRest = (attendance.rests || [])
    .filter((rest): rest is NonNullable<typeof rest> => !!rest)
    .reduce((acc, rest) => {
      if (!rest.startTime || !rest.endTime) return acc;
      return acc + calcTotalRestTime(rest.startTime, rest.endTime);
    }, 0);

  return totalRest;
}

/**
 * 勤務時間帯のラベルをフォーマット (HH:mm - HH:mm)
 */
export function formatTimeRange(attendance: Attendance | undefined) {
  if (!attendance) return undefined;

  const format = (value?: string | null) =>
    value ? dayjs(value).format("HH:mm") : undefined;

  const start = format(attendance.startTime || undefined);
  const end = format(attendance.endTime || undefined);

  if (!start && !end) {
    return undefined;
  }

  return `${start ?? ""} - ${end ?? ""}`.trim();
}

/**
 * 指定日付の祝日・会社休日名を取得
 */
export function getHolidayNames(
  date: Dayjs,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[],
) {
  const workDate = date.format(AttendanceDate.DataFormat);
  const holiday = new Holiday(holidayCalendars, workDate).getHoliday();
  const companyHoliday = new CompanyHoliday(
    companyHolidayCalendars,
    workDate,
  ).getHoliday();

  return {
    holidayName: holiday?.name ? normalizeHolidayName(holiday.name) : undefined,
    companyHolidayName: companyHoliday?.name,
  };
}

/**
 * 振替休日ラベルを返す
 */
export function getSubstituteHolidayLabel(attendance: Attendance | undefined) {
  if (!attendance?.substituteHolidayDate) return undefined;
  return "振替休日";
}

/**
 * 指定日付が祝日・会社休日・週末かどうかを判定
 */
export const isHolidayLike = (
  date: Dayjs,
  staff: Staff | null | undefined,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[],
): boolean => {
  const workDate = date.format(AttendanceDate.DataFormat);
  const isHoliday = new Holiday(holidayCalendars, workDate).isHoliday();
  const isCompanyHoliday = new CompanyHoliday(
    companyHolidayCalendars,
    workDate,
  ).isHoliday();

  if (staff?.workType === "shift") {
    // シフトタイプの場合も法定休日と会社休日の両方をチェック
    return isHoliday || isCompanyHoliday;
  }

  return isHoliday || isCompanyHoliday || [0, 6].includes(date.day());
};

export const hasSystemComment = (attendance: Attendance | undefined): boolean =>
  Boolean(
    attendance &&
    Array.isArray(attendance.systemComments) &&
    attendance.systemComments.length > 0,
  );

/**
 * 指定日付の勤怠ステータスを判定
 */
export const getStatus = (
  attendance: Attendance | undefined,
  staff: Staff | null | undefined,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[],
  date: Dayjs,
): AttendanceStatus => {
  if (!staff) return AttendanceStatus.None;

  if (!attendance) {
    const today = dayjs();

    // 今日以降の日付は None
    if (date.isSame(today, "day") || date.isAfter(today, "day")) {
      return AttendanceStatus.None;
    }

    // 利用開始日より前は None
    if (
      staff.usageStartDate &&
      date.isBefore(dayjs(staff.usageStartDate), "day")
    ) {
      return AttendanceStatus.None;
    }

    // 非シフト勤務のみ、祝日・会社休日・週末を判定対象外にする。
    // シフト勤務は祝日でも判定対象とする。
    if (staff.workType !== "shift") {
      const holidayLike = isHolidayLike(
        date,
        staff,
        holidayCalendars,
        companyHolidayCalendars,
      );
      if (holidayLike) return AttendanceStatus.None;
    }

    // 過去の営業日で打刻データなし → Error
    return AttendanceStatus.Error;
  }

  if (hasSystemComment(attendance)) {
    return AttendanceStatus.Error;
  }

  // 打刻データがある場合は AttendanceState で判定
  return new AttendanceState(
    staff,
    attendance,
    holidayCalendars,
    companyHolidayCalendars,
  ).get();
};
