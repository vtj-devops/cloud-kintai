import dayjs from "dayjs";

import { AttendanceDate } from "./AttendanceDate";

export class AttendanceDateTime {
  date: dayjs.Dayjs = dayjs();

  static convertToDayjs(date: string) {
    return dayjs(date);
  }

  setDateString(date: string) {
    if (!date) {
      return this;
    }

    this.date = AttendanceDateTime.convertToDayjs(date);
    return this;
  }

  setDate(date: dayjs.Dayjs) {
    this.date = date;
    return this;
  }

  setWorkStart() {
    this.date = this.date.hour(9).minute(0).second(0).millisecond(0);
    return this;
  }

  setWorkEnd() {
    this.date = this.date.hour(18).minute(0).second(0).millisecond(0);
    return this;
  }

  setRestStart() {
    this.setNoon();
    return this;
  }

  setRestEnd() {
    this.date = this.date.hour(13).minute(0).second(0).millisecond(0);
    return this;
  }

  setNoon() {
    this.date = this.date.hour(12).minute(0).second(0).millisecond(0);
    return this;
  }

  toISOString() {
    return this.date.toISOString();
  }

  toDayjs() {
    return this.date;
  }

  toDataFormat() {
    return this.date.format(AttendanceDate.DataFormat);
  }

  toDisplayDateFormat() {
    return this.date.format(AttendanceDate.DisplayFormat);
  }

  toDisplayDateTimeFormat() {
    return this.date.format("YYYY/MM/DD HH:mm");
  }

  toTimeFormat() {
    return this.date.format("HH:mm");
  }
}
