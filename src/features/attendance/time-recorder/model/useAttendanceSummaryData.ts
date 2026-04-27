import { AuthContext } from "@app/providers/auth/AuthContext";
import { useListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import {
  getAttendanceQueryDateRange,
  getEffectiveDateRange,
} from "@entities/attendance/lib/aggregationDateRange";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";

export function useAttendanceSummaryData() {
  const { cognitoUser } = useContext(AuthContext);
  const {
    closeDates,
    loading: closeDatesLoading,
    error: closeDatesError,
  } = useCloseDates();

  const today = useMemo(() => dayjs().startOf("day"), []);
  const currentMonth = useMemo(() => dayjs().startOf("month"), []);

  const effectiveDateRange = useMemo(
    () => getEffectiveDateRange(currentMonth, closeDates),
    [closeDates, currentMonth],
  );

  const queryDateRange = useMemo(
    () => getAttendanceQueryDateRange(currentMonth, effectiveDateRange),
    [currentMonth, effectiveDateRange],
  );

  const startDate = queryDateRange.start.format(AttendanceDate.DataFormat);
  const endDate = queryDateRange.end.format(AttendanceDate.DataFormat);

  const {
    data: attendances = [],
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    isUninitialized: attendanceUninitialized,
    error: attendancesError,
  } = useListAttendancesByDateRangeQuery(
    {
      staffId: cognitoUser?.id ?? "",
      startDate,
      endDate,
    },
    {
      skip: !cognitoUser?.id,
      refetchOnMountOrArgChange: true,
    },
  );

  const filteredAttendances = useMemo(
    () =>
      attendances.filter((attendance) => {
        if (!attendance.workDate) {
          return false;
        }
        const workDate = dayjs(attendance.workDate);
        const isToday = workDate.isSame(today, "day");
        if (isToday && !attendance.endTime) {
          return false;
        }
        return (
          !workDate.isBefore(effectiveDateRange.start, "day") &&
          !workDate.isAfter(effectiveDateRange.end, "day") &&
          !workDate.isAfter(today, "day")
        );
      }),
    [attendances, effectiveDateRange, today],
  );

  const isLoading =
    closeDatesLoading ||
    attendanceLoading ||
    attendanceFetching ||
    attendanceUninitialized;
  const hasError = Boolean(closeDatesError || attendancesError);

  return {
    filteredAttendances,
    effectiveDateRange,
    isLoading,
    hasError,
  };
}
