import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  type AttendanceUpsertAction,
  useGetAttendanceByStaffAndDateQuery,
  useListAttendancesByDateRangeWithPlaceholdersQuery,
  useUpdateAttendanceMutation,
  useUpsertAttendanceByStaffAndDateMutation,
} from "@entities/attendance/api/attendanceApi";
import {
  clockInAction,
  clockOutAction,
  GoDirectlyFlag,
  restEndAction,
  restStartAction,
  ReturnDirectlyFlag,
} from "@entities/attendance/lib/actions/attendanceActions";
import { getWorkStatus } from "@entities/attendance/lib/actions/workStatus";
import {
  getEffectiveDateRange,
  getEffectivePastDateRangeEnd,
} from "@entities/attendance/lib/aggregationDateRange";
import { resolveCurrentBusinessWorkDate } from "@entities/attendance/lib/businessDate";
import { buildAttendanceIdempotencyKey } from "@entities/attendance/lib/operationContext";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { onUpdateAttendance } from "@shared/api/graphql/documents/subscriptions";
import {
  Attendance,
  CreateAttendanceInput,
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
import { clockInCallback } from "./clockInCallback";
import { clockOutCallback } from "./clockOutCallback";
import { goDirectlyCallback } from "./goDirectlyCallback";
import { restEndCallback } from "./restEndCallback";
import { restStartCallback } from "./restStartCallback";
import { returnDirectlyCallback } from "./returnDirectlyCallback";
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
  toConfiguredTimeISO,
} from "./timeRecorderUtils";
import { TimeRecorderLoadingView, TimeRecorderView } from "./TimeRecorderView";

type TimeRecorderProps = {
  onAttendanceErrorCountChange?: (attendanceErrorCount: number) => void;
  onElapsedWorkTimeChange?: (payload: TimeRecorderElapsedWorkInfo) => void;
};
export type { TimeRecorderElapsedWorkInfo } from "./timeRecorderUtils";
export default function TimeRecorder({
  onAttendanceErrorCountChange,
  onElapsedWorkTimeChange,
}: TimeRecorderProps): JSX.Element {
  const LOCAL_ATTENDANCE_UPDATE_IGNORE_MS = 3000;
  const VISIBILITY_REFRESH_THRESHOLD_MINUTES = 5;
  const { cognitoUser } = useContext(AuthContext);
  const dispatch = useDispatch();
  const {
    getStartTime,
    getEndTime,
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
  const [upsertAttendanceMutation] =
    useUpsertAttendanceByStaffAndDateMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();
  const localAttendanceUpdateIgnoreUntilRef = useRef(0);
  const resolveUpsertAction = useCallback(
    (input: CreateAttendanceInput): AttendanceUpsertAction => {
      if (input.goDirectlyFlag) return "go_directly";
      if (input.returnDirectlyFlag) return "return_directly";
      if (input.startTime) return "clock_in";
      if (input.endTime) return "clock_out";
      const rests = input.rests ?? [];
      if (rests.some((rest) => Boolean(rest?.startTime) && !rest?.endTime)) {
        return "rest_start";
      }
      if (rests.some((rest) => Boolean(rest?.endTime))) {
        return "rest_end";
      }
      return "manual";
    },
    [],
  );
  const resolveOccurredAtFromCreateInput = useCallback(
    (input: CreateAttendanceInput) =>
      input.startTime ??
      input.endTime ??
      input.rests?.find((rest) => rest?.startTime)?.startTime ??
      input.rests?.find((rest) => rest?.endTime)?.endTime ??
      getNowISOStringWithZeroSeconds(),
    [],
  );
  const createAttendance = useCallback(
    (input: CreateAttendanceInput) => {
      const occurredAt = resolveOccurredAtFromCreateInput(input);
      const action = resolveUpsertAction(input);
      const idempotencyKey = buildAttendanceIdempotencyKey({
        action,
        staffId: input.staffId,
        occurredAt,
      });
      return upsertAttendanceMutation({
        input,
        action,
        occurredAt,
        idempotencyKey,
      }).unwrap();
    },
    [
      resolveOccurredAtFromCreateInput,
      resolveUpsertAction,
      upsertAttendanceMutation,
    ],
  );
  const updateAttendance = useCallback(
    (input: Parameters<typeof updateAttendanceMutation>[0]) => {
      localAttendanceUpdateIgnoreUntilRef.current =
        Date.now() + LOCAL_ATTENDANCE_UPDATE_IGNORE_MS;
      return updateAttendanceMutation(input).unwrap();
    },
    [updateAttendanceMutation],
  );
  const refreshAttendanceData = useCallback(async () => {
    if (!shouldFetchAttendance) {
      return;
    }
    await refetchAttendance();
    if (shouldFetchAttendanceErrors) {
      await refetchAttendances();
    }
  }, [
    refetchAttendance,
    refetchAttendances,
    shouldFetchAttendance,
    shouldFetchAttendanceErrors,
  ]);
  const runAttendanceActionWithRefresh = useCallback(
    async <T,>(action: () => Promise<T>) => {
      const result = await action();
      await refreshAttendanceData();
      return result;
    },
    [refreshAttendanceData],
  );
  const clockIn = useCallback(
    (
      staffId: string,
      workDate: string,
      startTime: string,
      goDirectlyFlag = GoDirectlyFlag.NO,
    ) =>
      runAttendanceActionWithRefresh(() =>
        clockInAction({
          attendance,
          staffId,
          workDate,
          startTime,
          goDirectlyFlag,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );
  const clockOut = useCallback(
    (
      staffId: string,
      workDate: string,
      endTime: string,
      returnDirectlyFlag = ReturnDirectlyFlag.NO,
    ) =>
      runAttendanceActionWithRefresh(() =>
        clockOutAction({
          attendance,
          staffId,
          workDate,
          endTime,
          returnDirectlyFlag,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );
  const restStart = useCallback(
    (staffId: string, workDate: string, startTime: string) =>
      runAttendanceActionWithRefresh(() =>
        restStartAction({
          attendance,
          staffId,
          workDate,
          time: startTime,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );
  const restEnd = useCallback(
    (staffId: string, workDate: string, endTime: string) =>
      runAttendanceActionWithRefresh(() =>
        restEndAction({
          attendance,
          staffId,
          workDate,
          time: endTime,
          createAttendance,
          updateAttendance,
        }),
      ),
    [
      attendance,
      createAttendance,
      runAttendanceActionWithRefresh,
      updateAttendance,
    ],
  );
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
  // 変更リクエスト中かどうか
  const hasChangeRequest = useMemo(
    () => hasPendingChangeRequests(attendance),
    [attendance],
  );
  const logger = new Logger("TimeRecorder", "DEBUG");
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
  const handleClockIn = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return clockInCallback(
      cognitoUser,
      clockIn,
      dispatch,
      staff,
      logger,
      occurredAt,
    );
  }, [clockIn, cognitoUser, dispatch, logger, staff]);
  const handleClockOut = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return clockOutCallback(
      cognitoUser,
      clockOut,
      dispatch,
      staff,
      logger,
      undefined,
      occurredAt,
    );
  }, [clockOut, cognitoUser, dispatch, logger, staff]);
  const handleGoDirectly = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    const startIso = toConfiguredTimeISO(occurredAt, getStartTime());
    return goDirectlyCallback(
      cognitoUser,
      staff,
      dispatch,
      clockIn,
      logger,
      startIso,
      occurredAt,
    );
  }, [cognitoUser, clockIn, dispatch, staff, logger, getStartTime]);
  const handleReturnDirectly = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    const endIso = toConfiguredTimeISO(occurredAt, getEndTime());
    return returnDirectlyCallback(
      cognitoUser,
      staff,
      dispatch,
      clockOut,
      logger,
      endIso,
      occurredAt,
    );
  }, [cognitoUser, staff, dispatch, clockOut, logger, getEndTime]);
  const handleRestStart = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return restStartCallback(
      cognitoUser,
      dispatch,
      restStart,
      logger,
      occurredAt,
    );
  }, [cognitoUser, dispatch, logger, restStart]);
  const handleRestEnd = useCallback(() => {
    const occurredAt = getNowISOStringWithZeroSeconds();
    return restEndCallback(cognitoUser, restEnd, dispatch, logger, occurredAt);
  }, [cognitoUser, dispatch, logger, restEnd]);
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
