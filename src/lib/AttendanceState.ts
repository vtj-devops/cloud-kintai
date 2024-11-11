import dayjs from "dayjs";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@/API";

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

export class AttendanceState {
  private today = dayjs();

  constructor(
    private staff: Staff,
    private attendance: Attendance,
    private holidayCalendars: HolidayCalendar[],
    private companyHolidayCalendars: CompanyHolidayCalendar[]
  ) {}

  get() {
    if (this.isEnabledStartDate()) {
      return AttendanceStatus.None;
    }

    if (this.isPaidHoliday() || this.isSubstituteHoliday()) {
      return AttendanceStatus.Ok;
    }

    if (this.isHoliday() || this.isCompanyHoliday()) {
      return AttendanceStatus.None;
    }

    if (this.isChangeRequesting()) {
      return AttendanceStatus.Requesting;
    }

    const isWeekday = new DayOfWeek(this.holidayCalendars).isWeekday(
      this.attendance.workDate
    );

    if (isWeekday) {
      if (this.isToday()) {
        if (this.isLate()) return AttendanceStatus.Late;
        if (this.isWorking()) return AttendanceStatus.Working;
        return AttendanceStatus.Ok;
      }

      return this.isLate() || this.isWorking()
        ? AttendanceStatus.Error
        : AttendanceStatus.Ok;
    }

    if (!this.attendance.startTime && !this.attendance.endTime) {
      return AttendanceStatus.None;
    }

    return AttendanceStatus.Ok;
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
      this.attendance.workDate
    ).isHoliday();
  }

  private isCompanyHoliday() {
    return new CompanyHoliday(
      this.companyHolidayCalendars,
      this.attendance.workDate
    ).isHoliday();
  }

  private isChangeRequesting() {
    if (!this.attendance.changeRequests) {
      return false;
    }

    const changeRequests = this.attendance.changeRequests.filter(
      (item): item is NonNullable<typeof item> => !!item
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
