import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  calcTotalRestTime,
  calcTotalWorkTime,
} from "@entities/attendance/lib/time";
import type { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

export type AttendanceSummary = {
  totalHours: number;
  workDays: number;
};

export type AttendanceChartEntry = {
  label: string;
  workHours: number;
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
    Record<string, { netWorkHours: number; restHours: number }>
  >((acc, attendance) => {
    if (
      !attendance.workDate ||
      !attendance.startTime ||
      !attendance.endTime
    ) {
      return acc;
    }
    const totalWorkHours = calcTotalWorkTime(
      attendance.startTime,
      attendance.endTime,
    );
    const totalRestHours = (attendance.rests ?? [])
      .filter((item): item is NonNullable<typeof item> => !!item)
      .reduce((restAcc, rest) => {
        if (!rest.startTime || !rest.endTime) return restAcc;
        return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
      }, 0);
    const netWorkHours = Math.max(totalWorkHours - totalRestHours, 0);
    const workDateKey = dayjs(attendance.workDate).format(
      AttendanceDate.DataFormat,
    );
    const existing = acc[workDateKey] ?? { netWorkHours: 0, restHours: 0 };
    acc[workDateKey] = {
      netWorkHours: existing.netWorkHours + netWorkHours,
      restHours: existing.restHours + totalRestHours,
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
      netWorkHours: 0,
      restHours: 0,
    };
    const netWorkHours = Number(workStatusHours.netWorkHours.toFixed(2));
    const restHours = Number(workStatusHours.restHours.toFixed(2));
    const overtimeHours = Number(
      Math.max(netWorkHours - clampedStandardWorkHours, 0).toFixed(2),
    );
    const regularWorkHours = Number(
      Math.max(netWorkHours - overtimeHours, 0).toFixed(2),
    );
    return {
      label: workDate.format("M/D"),
      workHours: regularWorkHours,
      restHours,
      overtimeHours,
      workDateValue: workDate.valueOf(),
    };
  });
}
