import { Attendance, HolidayCalendar } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { AttendanceDate } from "./AttendanceDate";

/**
 * 祝日の表示名を正規化する。
 * 政府の祝日データでは振替休日が「○○振替休日」や「休日」という名称で登録されているため、
 * 「振替休日」に統一する。
 */
export function normalizeHolidayName(name: string): string {
  if (name === "休日" || name.endsWith("振替休日")) {
    return "振替休日";
  }
  return name;
}

export class Holiday {
  constructor(
    private calendars: HolidayCalendar[],
    private workDate: Attendance["workDate"],
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
