import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { AttendanceDate } from "./AttendanceDate";
import { CompanyHoliday } from "./CompanyHoliday";
import { DayOfWeek } from "./DayOfWeek";
import { Holiday } from "./Holiday";

export enum AttendanceStatus {
  Ok = "OK",
  Error = "Error",
  Requesting = "申請中",
  Late = "遅刻",
  Working = "勤務中",
  None = "",
}

/**
 * 勤怠情報の状態を判定するクラス。
 *
 * スタッフ情報、勤怠データ、休日カレンダー、会社休日カレンダーを元に、
 * 勤怠の状態（OK、エラー、申請中、遅刻、勤務中、なし）を判定する。
 */
export class AttendanceState {
  private today = dayjs();

  constructor(
    private staff: Staff,
    private attendance: Attendance,
    private holidayCalendars: HolidayCalendar[],
    private companyHolidayCalendars: CompanyHolidayCalendar[],
  ) {}

  get(): AttendanceStatus {
    const attendanceManagementEnabled = (
      this.staff as Staff & { attendanceManagementEnabled?: boolean | null }
    ).attendanceManagementEnabled;

    if (attendanceManagementEnabled === false) {
      return AttendanceStatus.None;
    }

    // 当日の勤怠は確定前のためステータス判定から除外する
    if (this.isToday()) {
      return AttendanceStatus.None;
    }

    if (this.isEnabledStartDate()) {
      return AttendanceStatus.None;
    }

    if (this.isPaidHoliday() || this.isSubstituteHoliday()) {
      return AttendanceStatus.Ok;
    }

    if (
      (this.staff.workType === "shift" && this.attendance.isDeemedHoliday) ||
      (this.staff.workType !== "shift" &&
        (this.isHoliday() || this.isCompanyHoliday()))
    ) {
      return AttendanceStatus.None;
    }

    if (this.isChangeRequesting()) {
      return AttendanceStatus.Requesting;
    }

    // Shift の場合は土日関係なく判定する（週末判定を無視して常に平日扱いにする）
    const isShift = this.staff.workType === "shift" && !this.isDeemedHoliday();
    const isWeekday = isShift
      ? true
      : new DayOfWeek(this.holidayCalendars).isWeekday(
          this.attendance.workDate,
        );

    if (isWeekday) {
      return this.isLate() || this.isWorking()
        ? AttendanceStatus.Error
        : AttendanceStatus.Ok;
    }

    if (!this.attendance.startTime && !this.attendance.endTime) {
      return AttendanceStatus.None;
    }

    return AttendanceStatus.Ok;
  }

  private isDeemedHoliday() {
    return !!this.attendance.isDeemedHoliday;
  }

  private isEnabledStartDate() {
    if (!this.staff.usageStartDate) {
      return false;
    }

    const usageStartDate = dayjs(this.staff.usageStartDate);
    const workDate = dayjs(this.attendance.workDate);

    return usageStartDate.isAfter(workDate, "date");
  }

  private isPaidHoliday() {
    return this.attendance.paidHolidayFlag;
  }

  private isSubstituteHoliday() {
    if (!this.attendance.substituteHolidayDate) {
      return false;
    }

    const substituteHolidayDate = dayjs(this.attendance.substituteHolidayDate);

    return substituteHolidayDate.isValid();
  }

  private isHoliday() {
    return new Holiday(
      this.holidayCalendars,
      this.attendance.workDate,
    ).isHoliday();
  }

  private isCompanyHoliday() {
    return new CompanyHoliday(
      this.companyHolidayCalendars,
      this.attendance.workDate,
    ).isHoliday();
  }

  private isChangeRequesting() {
    if (!this.attendance.changeRequests) {
      return false;
    }

    const changeRequests = this.attendance.changeRequests.filter(
      (item): item is NonNullable<typeof item> => !!item,
    );

    return changeRequests.filter((item) => !item.completed).length > 0;
  }

  private isLate() {
    return !this.attendance.startTime;
  }

  private isWorking() {
    return !this.attendance.endTime;
  }

  private isToday() {
    return (
      this.today.format(AttendanceDate.DataFormat) === this.attendance.workDate
    );
  }
}
