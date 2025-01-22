import dayjs from "dayjs";

import { Attendance, CompanyHolidayCalendar } from "@/API";

import { AttendanceDate } from "./AttendanceDate";

export class CompanyHoliday {
  constructor(
    private calendars: CompanyHolidayCalendar[],
    private workDate: Attendance["workDate"]
  ) {}

  getHoliday() {
    return this.calendars.find(({ holidayDate }) => {
      return this.convertDate(holidayDate) === this.workDate;
    });
  }

  isHoliday() {
    return !!this.getHoliday();
  }

  convertDate(value: string) {
    return dayjs(value).format(AttendanceDate.DataFormat);
  }
}
