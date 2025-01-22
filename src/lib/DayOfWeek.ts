import dayjs from "dayjs";

import { HolidayCalendar } from "@/API";

import { Holiday } from "./Holiday";

export enum DayOfWeekString {
  Sun = "日",
  Mon = "月",
  Tue = "火",
  Wed = "水",
  Thu = "木",
  Fri = "金",
  Sat = "土",
  Holiday = "祝",
}

export class DayOfWeek {
  constructor(private holidayCalendars: HolidayCalendar[]) {}

  getLabel(date: string) {
    if (this.isHoliday(date)) {
      return DayOfWeekString.Holiday;
    }

    const dayOfWeekList = Object.values(DayOfWeekString);
    const dayOfWeek = dayjs(date).day();

    return dayOfWeekList[dayOfWeek];
  }

  private isHoliday(date: string) {
    return new Holiday(this.holidayCalendars, date).isHoliday();
  }

  isWeekday(date: string) {
    const dayOfWeek = this.getLabel(date);
    return (
      dayOfWeek === DayOfWeekString.Mon ||
      dayOfWeek === DayOfWeekString.Tue ||
      dayOfWeek === DayOfWeekString.Wed ||
      dayOfWeek === DayOfWeekString.Thu ||
      dayOfWeek === DayOfWeekString.Fri
    );
  }
}
