import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

export { formatMinutesToHHmm } from "@shared/lib/time/timeConverter";

const clampPositive = (value: number) => (value > 0 ? value : 0);
const createScheduledDate = (
  attendance: Attendance,
  scheduledHour: number,
  scheduledMinute: number
) => {
  const baseDate = attendance.workDate
    ? dayjs(attendance.workDate)
    : dayjs(attendance.endTime).startOf("day");

  return baseDate
    .hour(scheduledHour)
    .minute(scheduledMinute)
    .second(0)
    .millisecond(0);
};

const resolveActualEnd = (attendance: Attendance) => {
  if (!attendance.endTime) return null;
  const parsed = dayjs(attendance.endTime);
  return parsed.isValid() ? parsed : null;
};

const calculateSingleOvertimeMinutes = (
  attendance: Attendance,
  scheduledHour: number,
  scheduledMinute: number
) => {
  const actualEnd = resolveActualEnd(attendance);
  if (!actualEnd) return 0;

  const scheduled = createScheduledDate(
    attendance,
    scheduledHour,
    scheduledMinute
  );
  if (!scheduled.isValid()) return 0;

  const diffMinutes = actualEnd.diff(scheduled, "minute");
  return clampPositive(diffMinutes);
};

export const calculateTotalOvertimeMinutes = (
  attendances: Attendance[] | undefined,
  scheduledHour: number,
  scheduledMinute: number
) => {
  if (!attendances || attendances.length === 0) return 0;

  return attendances.reduce(
    (acc, attendance) =>
      acc +
      calculateSingleOvertimeMinutes(
        attendance,
        scheduledHour,
        scheduledMinute
      ),
    0
  );
};
