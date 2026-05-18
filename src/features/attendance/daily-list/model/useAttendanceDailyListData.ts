import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import useAttendanceDaily, {
  AttendanceDaily,
} from "@entities/attendance/model/useAttendanceDaily";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import { useAttendanceDailyFetch } from "./useAttendanceDailyFetch";

type UseAttendanceDailyListDataResult = {
  targetWorkDate?: string;
  today: string;
  displayDateFormatted: string | undefined;
  sortedAttendanceList: AttendanceDaily[];
  pendingList: AttendanceDaily[];
  staffNameMap: Record<string, string>;
  attendanceMap: ReturnType<typeof useAttendanceDailyFetch>["attendanceMap"];
  attendanceLoadingMap: ReturnType<typeof useAttendanceDailyFetch>["attendanceLoadingMap"];
  attendanceErrorMap: ReturnType<typeof useAttendanceDailyFetch>["attendanceErrorMap"];
  getAttendanceForDisplayDate: ReturnType<typeof useAttendanceDailyFetch>["getAttendanceForDisplayDate"];
  getOvertimeMinutes: ReturnType<typeof useAttendanceDailyFetch>["getOvertimeMinutes"];
  mergedDuplicateAttendances: ReturnType<typeof useAttendanceDailyFetch>["mergedDuplicateAttendances"];
  duplicateInfoByStaff: ReturnType<typeof useAttendanceDailyFetch>["duplicateInfoByStaff"];
  holidayCalendars: ReturnType<typeof useCalendars>["holidayCalendars"];
  companyHolidayCalendars: ReturnType<typeof useCalendars>["companyHolidayCalendars"];
  calendarsLoading: boolean;
};

type UseAttendanceDailyListDataParams = {
  isAuthenticated: boolean;
  getEndTime: () => dayjs.Dayjs;
};

export function useAttendanceDailyListData({
  isAuthenticated,
  getEndTime,
}: UseAttendanceDailyListDataParams): UseAttendanceDailyListDataResult {
  const dispatch = useDispatch();
  const { targetWorkDate } = useParams();
  const today = dayjs().format(AttendanceDate.QueryParamFormat);
  const displayDate = targetWorkDate || today;
  const displayDateFormatted = displayDate
    ? dayjs(displayDate, AttendanceDate.QueryParamFormat).format(
        AttendanceDate.DataFormat,
      )
    : undefined;

  const { staffs, loading: staffLoading, error: staffError } = useStaffs({
    isAuthenticated,
  });
  const {
    attendanceDailyList,
    error,
    loading,
    duplicateAttendances,
    loadAttendanceDataByMonth,
  } = useAttendanceDaily({
    staffs,
    staffLoading,
    staffError,
  });
  const {
    holidayCalendars,
    companyHolidayCalendars,
    isLoading: calendarsLoading,
    error: calendarsError,
  } = useCalendars();
  const scheduledEnd = useMemo(() => {
    const parsed = getEndTime();
    return { hour: parsed.hour(), minute: parsed.minute() };
  }, [getEndTime]);

  useEffect(() => {
    if (!targetWorkDate && !today) {
      return;
    }

    const dateToLoad = targetWorkDate || today;
    loadAttendanceDataByMonth(dateToLoad).catch((loadError) => {
      console.error("Failed to load attendance data for month:", loadError);
    });
  }, [targetWorkDate, today, loadAttendanceDataByMonth]);

  useEffect(() => {
    if (!error) {
      return;
    }

    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E00001,
      }),
    );
    console.error(error);
  }, [dispatch, error]);

  useEffect(() => {
    if (!calendarsError) {
      return;
    }

    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E00001,
      }),
    );
    console.error(calendarsError);
  }, [calendarsError, dispatch]);

  const sortedAttendanceList = useMemo(() => {
    return (attendanceDailyList || []).toSorted((a, b) => {
      const aSortKey = a.sortKey || "";
      const bSortKey = b.sortKey || "";
      return aSortKey.localeCompare(bSortKey);
    });
  }, [attendanceDailyList]);

  const staffNameMap = useMemo(() => {
    return (attendanceDailyList || []).reduce<Record<string, string>>(
      (acc, row) => {
        acc[row.sub] = `${row.familyName} ${row.givenName}`.trim();
        return acc;
      },
      {},
    );
  }, [attendanceDailyList]);

  const {
    attendanceMap,
    attendanceLoadingMap,
    attendanceErrorMap,
    getAttendanceForDisplayDate,
    getOvertimeMinutes,
    mergedDuplicateAttendances,
    duplicateInfoByStaff,
  } = useAttendanceDailyFetch({
    attendanceDailyList,
    displayDateFormatted,
    staffNameMap,
    scheduledHour: scheduledEnd.hour,
    scheduledMinute: scheduledEnd.minute,
    duplicateAttendances,
    loading,
  });

  const isRequesting = useCallback(
    (row: AttendanceDaily) => {
      const targetAttendance = getAttendanceForDisplayDate(row);
      if (!targetAttendance?.changeRequests) {
        return false;
      }
      const changeRequests = targetAttendance.changeRequests || [];
      return changeRequests.filter((item) => item && !item.completed).length > 0;
    },
    [getAttendanceForDisplayDate],
  );

  const pendingList = useMemo(() => {
    if (loading) {
      return [];
    }

    return attendanceDailyList.filter((row) => isRequesting(row));
  }, [attendanceDailyList, isRequesting, loading]);

  return {
    targetWorkDate,
    today,
    displayDateFormatted,
    sortedAttendanceList,
    pendingList,
    staffNameMap,
    attendanceMap,
    attendanceLoadingMap,
    attendanceErrorMap,
    getAttendanceForDisplayDate,
    getOvertimeMinutes,
    mergedDuplicateAttendances,
    duplicateInfoByStaff,
    holidayCalendars,
    companyHolidayCalendars,
    calendarsLoading,
  };
}
