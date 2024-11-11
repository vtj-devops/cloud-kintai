import dayjs from "dayjs";

import { Attendance, CompanyHolidayCalendar, HolidayCalendar } from "@/API";

import { CompanyHoliday } from "./CompanyHoliday";
import { Holiday } from "./Holiday";

export class Remarks {
  private summaryMessage: string[] = [];

  constructor(
    private workDate: Attendance["workDate"],
    private paidHolidayFlag: Attendance["paidHolidayFlag"],
    private remarks: Attendance["remarks"],
    private holidayCalendars: HolidayCalendar[],
    private companyHolidayCalendars: CompanyHolidayCalendar[],
    private substituteHolidayDate: Attendance["substituteHolidayDate"]
  ) {}

  get() {
    this.setPaidHoliday();
    this.setSubstituteHoliday();
    this.setHoliday();
    this.setCompanyHoliday();
    this.setRemarks();

    return this.summaryMessage.join(" ");
  }

  private isSubstituteHoliday() {
    return this.substituteHolidayDate
      ? dayjs(this.substituteHolidayDate).isValid()
      : false;
  }

  private setPaidHoliday() {
    if (!this.paidHolidayFlag) {
      return;
    }

    this.summaryMessage.push("有給休暇");
  }

  private setSubstituteHoliday() {
    if (!this.isSubstituteHoliday()) {
      return;
    }

    this.summaryMessage.push("振替休日");
  }

  private setHoliday() {
    const holiday = new Holiday(
      this.holidayCalendars,
      this.workDate
    ).getHoliday();

    if (!holiday) {
      return;
    }

    this.summaryMessage.push(holiday.name);
  }

  private setCompanyHoliday() {
    const companyHoliday = new CompanyHoliday(
      this.companyHolidayCalendars,
      this.workDate
    ).getHoliday();

    if (!companyHoliday) {
      return;
    }

    this.summaryMessage.push(companyHoliday.name);
  }

  private setRemarks() {
    if (!this.remarks) {
      return;
    }

    this.summaryMessage.push(this.remarks);
  }
}
