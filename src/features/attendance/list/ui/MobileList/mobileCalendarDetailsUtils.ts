import { Attendance } from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";

export const getSelectedDateLabel = (selectedDate: string) =>
  `${dayjs(selectedDate).format("M月D日(ddd)")}`;

export const getRestTimes = (selectedAttendance: Attendance | null) => {
  return (
    selectedAttendance?.rests?.filter(
      (rest): rest is NonNullable<typeof rest> => !!rest,
    ) ?? []
  );
};

export const getSummaryText = (selectedAttendance: Attendance | null) => {
  if (!selectedAttendance) return "";

  const labels: string[] = [];
  if (selectedAttendance.paidHolidayFlag) labels.push("有給休暇");
  if (selectedAttendance.specialHolidayFlag) labels.push("特別休暇");
  if (selectedAttendance.absentFlag) labels.push("欠勤");
  if (selectedAttendance.substituteHolidayDate) {
    labels.push(
      `振替休日 (${dayjs(selectedAttendance.substituteHolidayDate).format("M/D")})`,
    );
  }
  return labels.join(" ");
};

const toReferenceClockTime = (reference: Dayjs, clockTime: Dayjs) =>
  reference
    .startOf("day")
    .hour(clockTime.hour())
    .minute(clockTime.minute())
    .second(clockTime.second())
    .millisecond(clockTime.millisecond());

export const getAssumedLunchRestRange = ({
  selectedDate,
  selectedAttendance,
  restCount,
  lunchRestStartTime,
  lunchRestEndTime,
  now = dayjs(),
}: {
  selectedDate: string;
  selectedAttendance: Attendance | null;
  restCount: number;
  lunchRestStartTime: Dayjs;
  lunchRestEndTime: Dayjs;
  now?: Dayjs;
}) => {
  if (!selectedAttendance?.startTime || selectedAttendance.endTime) return null;
  if (restCount > 0) return null;

  const selectedDay = dayjs(selectedDate);
  if (!selectedDay.isSame(now, "day")) return null;

  const assumedRestStart = toReferenceClockTime(selectedDay, lunchRestStartTime);
  const assumedRestEnd = toReferenceClockTime(selectedDay, lunchRestEndTime);
  if (!assumedRestEnd.isAfter(assumedRestStart) || now.isBefore(assumedRestEnd)) {
    return null;
  }

  return {
    startTime: assumedRestStart.toISOString(),
    endTime: assumedRestEnd.toISOString(),
  };
};
