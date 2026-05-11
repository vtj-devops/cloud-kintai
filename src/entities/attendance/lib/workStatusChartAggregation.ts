import {
  calcTotalRestTime,
  calcTotalWorkTime,
} from "@entities/attendance/lib/time";
import type { Attendance } from "@shared/api/graphql/types";

export type AttendanceWorkStatusHours = {
  workHours: number;
  paidHolidayHours: number;
  restHours: number;
  overtimeHours: number;
};

export const toAttendanceWorkStatusHours = ({
  attendance,
  standardWorkHours,
  hideRestHoursOnPaidHoliday,
}: {
  attendance: Attendance;
  standardWorkHours: number;
  hideRestHoursOnPaidHoliday?: boolean;
}): AttendanceWorkStatusHours => {
  if (!attendance.startTime || !attendance.endTime) {
    return {
      workHours: 0,
      paidHolidayHours: 0,
      restHours: 0,
      overtimeHours: 0,
    };
  }

  const grossWorkHours = calcTotalWorkTime(
    attendance.startTime,
    attendance.endTime,
  );
  const totalRestHours = (attendance.rests ?? [])
    .filter((item): item is NonNullable<typeof item> => !!item)
    .reduce((restAcc, rest) => {
      if (!rest.startTime || !rest.endTime) return restAcc;
      return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
    }, 0);

  if (!Number.isFinite(grossWorkHours) || !Number.isFinite(totalRestHours)) {
    return {
      workHours: 0,
      paidHolidayHours: 0,
      restHours: 0,
      overtimeHours: 0,
    };
  }

  const isPaidHoliday = attendance.paidHolidayFlag === true;
  const shouldHideRestHours = hideRestHoursOnPaidHoliday !== false;
  const restHoursForChart =
    isPaidHoliday && shouldHideRestHours ? 0 : Math.max(totalRestHours, 0);
  const workHoursBase =
    isPaidHoliday && shouldHideRestHours
      ? Math.max(grossWorkHours, 0)
      : Math.max(grossWorkHours - totalRestHours, 0);
  const clampedStandardWorkHours = Math.max(standardWorkHours, 0);

  if (isPaidHoliday) {
    return {
      workHours: 0,
      paidHolidayHours: Number(workHoursBase.toFixed(2)),
      restHours: Number(restHoursForChart.toFixed(2)),
      overtimeHours: 0,
    };
  }

  const overtimeHours = Math.max(workHoursBase - clampedStandardWorkHours, 0);
  const regularWorkHours = Math.max(workHoursBase - overtimeHours, 0);

  return {
    workHours: Number(regularWorkHours.toFixed(2)),
    paidHolidayHours: 0,
    restHours: Number(restHoursForChart.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
  };
};
