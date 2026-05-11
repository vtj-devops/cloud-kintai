import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { calcTotalRestTime, calcTotalWorkTime } from "@entities/attendance/lib/time";
import { toAttendanceWorkStatusHours } from "@entities/attendance/lib/workStatusChartAggregation";
import type { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

export type AttendanceSummary = {
  totalHours: number;
  workDays: number;
};

export type AttendanceChartEntry = {
  label: string;
  workHours: number;
  paidHolidayHours: number;
  restHours: number;
  overtimeHours: number;
  workDateValue: number;
};

export function calcAttendanceSummary(
  filteredAttendances: Attendance[],
): AttendanceSummary {
  const totalWorkTime = filteredAttendances.reduce((acc, attendance) => {
    if (!attendance.startTime || !attendance.endTime) return acc;
    return acc + calcTotalWorkTime(attendance.startTime, attendance.endTime);
  }, 0);

  const totalRestTime = filteredAttendances.reduce((acc, attendance) => {
    if (!attendance.rests) return acc;
    const restTime = attendance.rests
      .filter((item): item is NonNullable<typeof item> => !!item)
      .reduce((restAcc, rest) => {
        if (!rest.startTime || !rest.endTime) return restAcc;
        return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
      }, 0);
    return acc + restTime;
  }, 0);

  return {
    totalHours: totalWorkTime - totalRestTime,
    workDays: filteredAttendances.length,
  };
}

export function calcAttendanceChartSummary(
  filteredAttendances: Attendance[],
  effectiveDateRange: DateRange,
  standardWorkHours: number,
): AttendanceChartEntry[] {
  const clampedStandardWorkHours = Math.max(standardWorkHours, 0);

  const workStatusHoursByDate = filteredAttendances.reduce<
    Record<
      string,
      {
        workHours: number;
        paidHolidayHours: number;
        restHours: number;
        overtimeHours: number;
      }
    >
  >((acc, attendance) => {
    if (!attendance.workDate || !attendance.startTime || !attendance.endTime) {
      return acc;
    }
    const {
      workHours,
      paidHolidayHours,
      restHours,
      overtimeHours,
    } = toAttendanceWorkStatusHours({
      attendance,
      standardWorkHours: clampedStandardWorkHours,
      hideRestHoursOnPaidHoliday: true,
    });
    const workDateKey = dayjs(attendance.workDate).format(
      AttendanceDate.DataFormat,
    );
    const existing = acc[workDateKey] ?? {
      workHours: 0,
      paidHolidayHours: 0,
      restHours: 0,
      overtimeHours: 0,
    };
    acc[workDateKey] = {
      workHours: existing.workHours + workHours,
      paidHolidayHours: existing.paidHolidayHours + paidHolidayHours,
      restHours: existing.restHours + restHours,
      overtimeHours: existing.overtimeHours + overtimeHours,
    };
    return acc;
  }, {});

  const periodDays: ReturnType<typeof dayjs>[] = [];
  let cursor = effectiveDateRange.start.startOf("day");
  const periodEnd = effectiveDateRange.end.startOf("day");
  while (!cursor.isAfter(periodEnd, "day")) {
    periodDays.push(cursor);
    cursor = cursor.add(1, "day");
  }

  return periodDays.map((workDate) => {
    const workDateKey = workDate.format(AttendanceDate.DataFormat);
    const workStatusHours = workStatusHoursByDate[workDateKey] ?? {
      workHours: 0,
      paidHolidayHours: 0,
      restHours: 0,
      overtimeHours: 0,
    };
    return {
      label: workDate.format("M/D"),
      workHours: Number(workStatusHours.workHours.toFixed(2)),
      paidHolidayHours: Number(workStatusHours.paidHolidayHours.toFixed(2)),
      restHours: Number(workStatusHours.restHours.toFixed(2)),
      overtimeHours: Number(workStatusHours.overtimeHours.toFixed(2)),
      workDateValue: workDate.valueOf(),
    };
  });
}
