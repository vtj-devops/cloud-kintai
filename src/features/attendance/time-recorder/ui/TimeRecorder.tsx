import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  useGetAttendanceByStaffAndDateQuery,
  useListAttendancesByDateRangeWithPlaceholdersQuery,
} from "@entities/attendance/api/attendanceApi";
import { getWorkStatus } from "@entities/attendance/lib/actions/workStatus";
import {
  getEffectiveDateRange,
  getEffectivePastDateRangeEnd,
} from "@entities/attendance/lib/aggregationDateRange";
import { resolveCurrentBusinessWorkDate } from "@entities/attendance/lib/businessDate";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { onUpdateAttendance } from "@shared/api/graphql/documents/subscriptions";
import {
  Attendance,
  OnUpdateAttendanceSubscription,
  Staff,
} from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

import { WorkStatus } from "../lib/common";
import {
  type TimeRecorderContextValue,
  TimeRecorderProvider,
} from "./TimeRecorderContext";
import {
  formatClockDisplayText,
  hasPendingChangeRequests,
  resolveElapsedWorkInfo,
  summarizeAttendanceErrors,
  type TimeRecorderElapsedWorkInfo,
} from "./timeRecorderUtils";
import { TimeRecorderLoadingView, TimeRecorderView } from "./TimeRecorderView";
import { useAttendanceActions } from "./useAttendanceActions";

type TimeRecorderProps = {
  onAttendanceErrorCountChange?: (attendanceErrorCount: number) => void;
  onElapsedWorkTimeChange?: (payload: TimeRecorderElapsedWorkInfo) => void;
};
export type { TimeRecorderElapsedWorkInfo } from "./timeRecorderUtils";
export default function TimeRecorder({
  onAttendanceErrorCountChange,
  onElapsedWorkTimeChange,
}: TimeRecorderProps): JSX.Element {
  const VISIBILITY_REFRESH_THRESHOLD_MINUTES = 5;
  const { cognitoUser } = useContext(AuthContext);
  const dispatch = useDispatch();
  const {
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);
  const [currentWorkDate, setCurrentWorkDate] = useState(() =>
    resolveCurrentBusinessWorkDate(),
  );
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextWorkDate = resolveCurrentBusinessWorkDate();
      setCurrentWorkDate((prev) =>
        prev === nextWorkDate ? prev : nextWorkDate,
      );
    }, 30 * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const shouldFetchAttendance = Boolean(cognitoUser?.id);
  const {
    holidayCalendars,
    companyHolidayCalendars,
    isLoading: calendarLoading,
    error: calendarsError,
  } = useCalendars();
  const { closeDates, loading: closeDatesLoading } = useCloseDates();
  const attendanceErrorToday = useMemo(
    () => dayjs().startOf("day"),
    [currentWorkDate],
  );
  const attendanceErrorCurrentMonth = useMemo(
    () => attendanceErrorToday.startOf("month"),
    [attendanceErrorToday],
  );
  const attendanceErrorEffectiveDateRange = useMemo(
    () => getEffectiveDateRange(attendanceErrorCurrentMonth, closeDates),
    [attendanceErrorCurrentMonth, closeDates],
  );
  const attendanceErrorQueryEnd = useMemo(
    () =>
      getEffectivePastDateRangeEnd(
        attendanceErrorEffectiveDateRange,
        attendanceErrorToday,
      ),
    [attendanceErrorEffectiveDateRange, attendanceErrorToday],
  );
  const shouldFetchAttendanceErrors =
    shouldFetchAttendance &&
    !attendanceErrorEffectiveDateRange.start.isAfter(
      attendanceErrorQueryEnd,
      "day",
    );
  const {
    data: attendanceData,
    isLoading: isAttendanceInitialLoading,
    isFetching: isAttendanceFetching,
    isUninitialized: isAttendanceUninitialized,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetAttendanceByStaffAndDateQuery(
    { staffId: cognitoUser?.id ?? "", workDate: currentWorkDate },
    { skip: !shouldFetchAttendance },
  );
  const {
    data: attendancesData,
    isLoading: isAttendancesInitialLoading,
    isFetching: isAttendancesFetching,
    isUninitialized: isAttendancesUninitialized,
    error: attendancesError,
    refetch: refetchAttendances,
  } = useListAttendancesByDateRangeWithPlaceholdersQuery(
    {
      staffId: cognitoUser?.id ?? "",
      startDate: attendanceErrorEffectiveDateRange.start.format("YYYY-MM-DD"),
      endDate: attendanceErrorQueryEnd.format("YYYY-MM-DD"),
    },
    { skip: !shouldFetchAttendanceErrors },
  );
  const attendance = attendanceData;
  const attendances: Attendance[] = attendancesData?.attendances ?? [];
  const attendanceLoading =
    !shouldFetchAttendance ||
    isAttendanceInitialLoading ||
    isAttendanceFetching ||
    isAttendanceUninitialized;
  const attendancesLoading =
    closeDatesLoading ||
    (shouldFetchAttendanceErrors &&
      (isAttendancesInitialLoading ||
        isAttendancesFetching ||
        isAttendancesUninitialized));
  const [workStatus, setWorkStatus] = useState<WorkStatus | null | undefined>(
    undefined,
  );
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [attendanceErrorCount, setAttendanceErrorCount] = useState(0);
  const [isAttendanceError, setIsAttendanceError] = useState(false);
  const [isTimeElapsedError, setIsTimeElapsedError] = useState(false);
  const [directMode, setDirectMode] = useState(false);
  const [elapsedWorkTick, setElapsedWorkTick] = useState(() => Date.now());
  const lastActiveTimeRef = useRef(dayjs());
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedWorkTick(Date.now());
    }, 30 * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const hasChangeRequest = useMemo(
    () => hasPendingChangeRequests(attendance),
    [attendance],
  );
  const logger = new Logger("TimeRecorder", "DEBUG");
  const {
    localAttendanceUpdateIgnoreUntilRef,
    refreshAttendanceData,
    handleClockIn,
    handleClockOut,
    handleGoDirectly,
    handleReturnDirectly,
    handleRestStart,
    handleRestEnd,
  } = useAttendanceActions({
    attendance,
    staff,
    logger,
    shouldFetchAttendance,
    shouldFetchAttendanceErrors,
    refetchAttendance,
    refetchAttendances,
  });
  const refreshStaff = useCallback(async () => {
    if (!cognitoUser?.id) {
      return;
    }
    try {
      const latestStaff = await fetchStaff(cognitoUser.id);
      setStaff(latestStaff);
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [cognitoUser?.id, dispatch]);
  const refreshTimeRecorderData = useCallback(async () => {
    await Promise.allSettled([refreshStaff(), refreshAttendanceData()]);
  }, [refreshAttendanceData, refreshStaff]);
  useEffect(() => {
    if (calendarsError) {
      logger.debug(calendarsError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [calendarsError, dispatch, logger]);
  const clockInDisplayText = useMemo(
    () => formatClockDisplayText(attendance?.startTime, "出勤"),
    [attendance?.startTime],
  );
  const clockOutDisplayText = useMemo(
    () => formatClockDisplayText(attendance?.endTime, "退勤"),
    [attendance?.endTime],
  );
  const handleVisibilityChange = useCallback(() => {
    const now = dayjs();
    if (document.visibilityState !== "visible") {
      return;
    }
    if (
      now.diff(lastActiveTimeRef.current, "minute") >
      VISIBILITY_REFRESH_THRESHOLD_MINUTES
    ) {
      void refreshTimeRecorderData();
    }
    lastActiveTimeRef.current = now;
  }, [refreshTimeRecorderData]);
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
  useEffect(() => {
    void refreshStaff();
  }, [refreshStaff]);
  useEffect(() => {
    if (!shouldFetchAttendance || !attendanceError) {
      return;
    }
    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E01001,
      }),
    );
  }, [attendanceError, dispatch, shouldFetchAttendance]);
  useEffect(() => {
    if (!shouldFetchAttendance || !attendancesError) {
      return;
    }
    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E02001,
      }),
    );
  }, [attendancesError, dispatch, shouldFetchAttendance]);
  useEffect(() => {
    if (!staff || attendanceLoading || attendancesLoading || calendarLoading) {
      return;
    }
    const { errorCount, hasTimeElapsedError } = summarizeAttendanceErrors({
      staff,
      attendances,
      holidayCalendars,
      companyHolidayCalendars,
      today: attendanceErrorToday,
    });
    setAttendanceErrorCount(errorCount);
    setIsAttendanceError(errorCount > 0);
    setIsTimeElapsedError(hasTimeElapsedError);
  }, [
    attendanceLoading,
    attendancesLoading,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    attendances,
    calendarLoading,
    attendanceErrorToday,
  ]);
  useEffect(() => {
    setWorkStatus(getWorkStatus(attendance));
  }, [attendance]);
  const elapsedWorkInfo = useMemo<TimeRecorderElapsedWorkInfo>(() => {
    void elapsedWorkTick;
    return resolveElapsedWorkInfo({
      attendance,
      workStatus,
      now: dayjs(),
      lunchRestStartTime: getLunchRestStartTime(),
      lunchRestEndTime: getLunchRestEndTime(),
    });
  }, [
    attendance,
    getLunchRestEndTime,
    getLunchRestStartTime,
    workStatus,
    elapsedWorkTick,
  ]);
  useEffect(() => {
    onAttendanceErrorCountChange?.(attendanceErrorCount);
  }, [attendanceErrorCount, onAttendanceErrorCountChange]);
  useEffect(() => {
    onElapsedWorkTimeChange?.(elapsedWorkInfo);
  }, [elapsedWorkInfo, onElapsedWorkTimeChange]);
  // 勤怠データ更新のサブスクリプション
  useEffect(() => {
    if (!cognitoUser?.id) {
      return;
    }
    const subscription = graphqlClient
      .graphql({
        query: onUpdateAttendance,
        variables: {
          filter: {
            staffId: { eq: cognitoUser.id },
            workDate: { eq: currentWorkDate },
          },
        },
        authMode: "userPool",
      })
      .subscribe({
        next: (event) => {
          const updatedAttendance = (
            event.data as OnUpdateAttendanceSubscription
          )?.onUpdateAttendance;
          if (!updatedAttendance) {
            return;
          }
          const shouldIgnoreLocalUpdate =
            Date.now() < localAttendanceUpdateIgnoreUntilRef.current;
          if (shouldIgnoreLocalUpdate) {
            return;
          }
          void refreshTimeRecorderData();
        },
        error: (error: unknown) => {
          logger.error("Subscription error:", error);
        },
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [cognitoUser?.id, currentWorkDate, logger, refreshTimeRecorderData]);
  const contextValue = useMemo<TimeRecorderContextValue | null>(() => {
    if (workStatus === undefined || workStatus === null) {
      return null;
    }
    return {
      today: currentWorkDate,
      staffId: staff?.id ?? null,
      workStatus,
      directMode,
      hasChangeRequest,
      isAttendanceError,
      clockInDisplayText,
      clockOutDisplayText,
      onDirectModeChange: setDirectMode,
      onClockIn: handleClockIn,
      onClockOut: handleClockOut,
      onGoDirectly: handleGoDirectly,
      onReturnDirectly: handleReturnDirectly,
      onRestStart: handleRestStart,
      onRestEnd: handleRestEnd,
      isTimeElapsedError,
    };
  }, [
    currentWorkDate,
    staff?.id,
    workStatus,
    directMode,
    hasChangeRequest,
    isAttendanceError,
    clockInDisplayText,
    clockOutDisplayText,
    handleClockIn,
    handleClockOut,
    handleGoDirectly,
    handleReturnDirectly,
    handleRestStart,
    handleRestEnd,
    isTimeElapsedError,
  ]);
  if (attendanceLoading || calendarLoading || workStatus === undefined) {
    return <TimeRecorderLoadingView />;
  }
  if (workStatus === null) {
    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E00001,
      }),
    );
    return <></>;
  }
  return (
    <TimeRecorderProvider value={contextValue!}>
      <TimeRecorderView />
    </TimeRecorderProvider>
  );
}
