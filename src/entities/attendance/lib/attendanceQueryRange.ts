import dayjs from "dayjs";

import { AttendanceDate } from "./AttendanceDate";

export type AttendanceQueryRange = {
  readonly start: dayjs.Dayjs;
  readonly end: dayjs.Dayjs;
};

export type AttendanceQueryRangeInput = {
  readonly startDate: string;
  readonly endDate: string;
};

export const getAttendanceMonthRange = (
  baseDate?: dayjs.ConfigType,
): AttendanceQueryRange => {
  const base = baseDate === undefined ? dayjs() : dayjs(baseDate);
  return {
    start: base.startOf("month"),
    end: base.endOf("month"),
  };
};

export const getAttendanceMonthRangeInput = (
  baseDate?: dayjs.ConfigType,
): AttendanceQueryRangeInput => {
  const range = getAttendanceMonthRange(baseDate);
  return {
    startDate: range.start.format(AttendanceDate.DataFormat),
    endDate: range.end.format(AttendanceDate.DataFormat),
  };
};

export const getAttendancePreviousMonthToCurrentMonthRange = (
  baseMonth?: dayjs.ConfigType,
): AttendanceQueryRange => {
  const month = baseMonth === undefined ? dayjs().startOf("month") : dayjs(baseMonth);
  return {
    start: month.subtract(1, "month").startOf("month"),
    end: month.endOf("month"),
  };
};

export const getAttendancePreviousMonthToCurrentMonthRangeInput = (
  baseMonth?: dayjs.ConfigType,
): AttendanceQueryRangeInput => {
  const range = getAttendancePreviousMonthToCurrentMonthRange(baseMonth);
  return {
    startDate: range.start.format(AttendanceDate.DataFormat),
    endDate: range.end.format(AttendanceDate.DataFormat),
  };
};
