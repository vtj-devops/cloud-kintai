import {
  useCreateAttendanceMutation,
  useGetAttendanceByStaffAndDateQuery,
  useListRecentAttendancesQuery,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import {
  useGetCompanyHolidayCalendarsQuery,
  useGetHolidayCalendarsQuery,
} from "@entities/calendar/api/calendarApi";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  SxProps,
  Typography,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import {
  Attendance,
  CreateAttendanceInput,
  OnUpdateAttendanceSubscription,
  Staff,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import {
  clockInAction,
  clockOutAction,
  GoDirectlyFlag,
  restEndAction,
  restStartAction,
  ReturnDirectlyFlag,
} from "@/entities/attendance/lib/actions/attendanceActions";
import { getWorkStatus } from "@/entities/attendance/lib/actions/workStatus";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceState, AttendanceStatus } from "@/entities/attendance/lib/AttendanceState";
import * as MESSAGE_CODE from "@/errors";
import { graphqlClient } from "@/shared/api/amplify/graphqlClient";
import { onUpdateAttendance } from "@/shared/api/graphql/documents/subscriptions";
import { designTokenVar } from "@/shared/designSystem";
import { Logger } from "@/shared/lib/logger";
import { setSnackbarError } from "@/shared/lib/store/snackbarSlice";
import Clock from "@/shared/ui/clock/Clock";
import AttendanceErrorAlert from "@/shared/ui/time-recorder/AttendanceErrorAlert";
import DirectSwitch from "@/shared/ui/time-recorder/DirectSwitch";

import { WorkStatus } from "../lib/common";
import { clockInCallback } from "./clockInCallback";
import { clockOutCallback } from "./clockOutCallback";
import { goDirectlyCallback } from "./goDirectlyCallback";
import ClockInItem from "./items/ClockInItem";
import ClockOutItem from "./items/ClockOutItem";
import GoDirectlyItem from "./items/GoDirectlyItem";
import RestEndItem from "./items/RestEndItem";
import RestStartItem from "./items/RestStartItem";
import ReturnDirectly from "./items/ReturnDirectlyItem";
import QuickDailyReportCard from "./QuickDailyReportCard";
import { restEndCallback } from "./restEndCallback";
import { restStartCallback } from "./restStartCallback";
import { RestTimeMessage } from "./RestTimeMessage";
import { returnDirectlyCallback } from "./returnDirectlyCallback";

/**
 * 勤怠打刻用のメインコンポーネント。
 * ユーザーの勤怠状態に応じて打刻・休憩・直行直帰などの操作UIを表示する。
 * @returns {JSX.Element} 勤怠打刻UI
 */
export default function TimeRecorder(): JSX.Element {
  const { cognitoUser } = useContext(AuthContext);

  const dispatch = useDispatch();

  const { getStartTime, getEndTime } = useContext(AppConfigContext);

  const today = useMemo(() => dayjs().format(AttendanceDate.DataFormat), []);

  const shouldFetchAttendance = Boolean(cognitoUser?.id);

  const {
    data: holidayCalendars = [],
    isLoading: isHolidayCalendarsLoading,
    isFetching: isHolidayCalendarsFetching,
    error: holidayCalendarsError,
  } = useGetHolidayCalendarsQuery();
  const {
    data: companyHolidayCalendars = [],
    isLoading: isCompanyHolidayCalendarsLoading,
    isFetching: isCompanyHolidayCalendarsFetching,
    error: companyHolidayCalendarsError,
  } = useGetCompanyHolidayCalendarsQuery();
  const calendarLoading =
    isHolidayCalendarsLoading ||
    isHolidayCalendarsFetching ||
    isCompanyHolidayCalendarsLoading ||
    isCompanyHolidayCalendarsFetching;

  const {
    data: attendanceData,
    isLoading: isAttendanceInitialLoading,
    isFetching: isAttendanceFetching,
    isUninitialized: isAttendanceUninitialized,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetAttendanceByStaffAndDateQuery(
    { staffId: cognitoUser?.id ?? "", workDate: today },
    { skip: !shouldFetchAttendance }
  );

  const {
    data: attendancesData,
    isLoading: isAttendancesInitialLoading,
    isFetching: isAttendancesFetching,
    isUninitialized: isAttendancesUninitialized,
    error: attendancesError,
    refetch: refetchAttendances,
  } = useListRecentAttendancesQuery(
    { staffId: cognitoUser?.id ?? "" },
    { skip: !shouldFetchAttendance }
  );

  const attendance = attendanceData;
  const attendances: Attendance[] = attendancesData?.attendances ?? [];

  const attendanceLoading =
    !shouldFetchAttendance ||
    isAttendanceInitialLoading ||
    isAttendanceFetching ||
    isAttendanceUninitialized;

  const attendancesLoading =
    !shouldFetchAttendance ||
    isAttendancesInitialLoading ||
    isAttendancesFetching ||
    isAttendancesUninitialized;

  const [createAttendanceMutation] = useCreateAttendanceMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();

  const createAttendance = useCallback(
    (input: CreateAttendanceInput) => createAttendanceMutation(input).unwrap(),
    [createAttendanceMutation]
  );

  const updateAttendance = useCallback(
    (input: UpdateAttendanceInput) => updateAttendanceMutation(input).unwrap(),
    [updateAttendanceMutation]
  );

  const refreshAttendanceData = useCallback(async () => {
    if (!shouldFetchAttendance) {
      return;
    }

    await Promise.allSettled([refetchAttendance(), refetchAttendances()]);
  }, [refetchAttendance, refetchAttendances, shouldFetchAttendance]);

  const clockIn = useCallback(
    async (
      staffId: string,
      workDate: string,
      startTime: string,
      goDirectlyFlag = GoDirectlyFlag.NO
    ) => {
      const result = await clockInAction({
        attendance,
        staffId,
        workDate,
        startTime,
        goDirectlyFlag,
        createAttendance,
        updateAttendance,
      });

      await refreshAttendanceData();

      return result;
    },
    [attendance, createAttendance, updateAttendance, refreshAttendanceData]
  );

  const clockOut = useCallback(
    async (
      staffId: string,
      workDate: string,
      endTime: string,
      returnDirectlyFlag = ReturnDirectlyFlag.NO
    ) => {
      const result = await clockOutAction({
        attendance,
        staffId,
        workDate,
        endTime,
        returnDirectlyFlag,
        createAttendance,
        updateAttendance,
      });

      await refreshAttendanceData();

      return result;
    },
    [attendance, createAttendance, updateAttendance, refreshAttendanceData]
  );

  const restStart = useCallback(
    async (staffId: string, workDate: string, startTime: string) => {
      const result = await restStartAction({
        attendance,
        staffId,
        workDate,
        time: startTime,
        createAttendance,
        updateAttendance,
      });

      await refreshAttendanceData();

      return result;
    },
    [attendance, createAttendance, updateAttendance, refreshAttendanceData]
  );

  const restEnd = useCallback(
    async (staffId: string, workDate: string, endTime: string) => {
      const result = await restEndAction({
        attendance,
        staffId,
        workDate,
        time: endTime,
        createAttendance,
        updateAttendance,
      });

      await refreshAttendanceData();

      return result;
    },
    [attendance, createAttendance, updateAttendance, refreshAttendanceData]
  );

  const [workStatus, setWorkStatus] = useState<WorkStatus | null | undefined>(
    undefined
  );
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [isAttendanceError, setIsAttendanceError] = useState(false);
  const [isTimeElapsedError, setIsTimeElapsedError] = useState(false);
  const [directMode, setDirectMode] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(dayjs());

  // 変更リクエスト中かどうか
  const hasChangeRequest = useMemo(() => {
    if (!attendance?.changeRequests) return false;
    return attendance.changeRequests
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .some((item) => !item.completed);
  }, [attendance?.changeRequests]);

  const logger = new Logger("TimeRecorder", "DEBUG");

  useEffect(() => {
    if (holidayCalendarsError || companyHolidayCalendarsError) {
      logger.debug(holidayCalendarsError ?? companyHolidayCalendarsError);
      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    }
  }, [holidayCalendarsError, companyHolidayCalendarsError, dispatch, logger]);

  const clockInDisplayText = useMemo(() => {
    if (!attendance?.startTime) {
      return null;
    }
    return `${dayjs(attendance.startTime).format("HH:mm")} 出勤`;
  }, [attendance?.startTime]);

  const clockOutDisplayText = useMemo(() => {
    if (!attendance?.endTime) {
      return null;
    }
    return `${dayjs(attendance.endTime).format("HH:mm")} 退勤`;
  }, [attendance?.endTime]);

  const TIME_RECORDER_WIDTH_MD = designTokenVar(
    "component.timeRecorder.layout.widthMd",
    "400px"
  );
  const TIME_RECORDER_MARGIN_XS = designTokenVar(
    "component.timeRecorder.layout.marginXMobile",
    "24px"
  );
  const TIME_RECORDER_SURFACE_BG = designTokenVar(
    "component.timeRecorder.surface.background",
    "#FFFFFF"
  );
  const TIME_RECORDER_BORDER_COLOR = designTokenVar(
    "component.timeRecorder.surface.borderColor",
    "#E5E7EB"
  );
  const TIME_RECORDER_BORDER_WIDTH = designTokenVar(
    "component.timeRecorder.surface.borderWidth",
    "1px"
  );
  const TIME_RECORDER_BORDER_RADIUS = designTokenVar(
    "component.timeRecorder.surface.borderRadius",
    "12px"
  );
  const TIME_RECORDER_SURFACE_SHADOW = designTokenVar(
    "component.timeRecorder.surface.shadow",
    "0 12px 24px rgba(17, 24, 39, 0.08)"
  );
  const TIME_RECORDER_PADDING_XS = designTokenVar(
    "component.timeRecorder.surface.padding.xs",
    "16px"
  );
  const TIME_RECORDER_PADDING_MD = designTokenVar(
    "component.timeRecorder.surface.padding.md",
    "24px"
  );

  const BADGE_PADDING_X = designTokenVar("spacing.sm", "8px");
  const BADGE_PADDING_Y = designTokenVar("spacing.xs", "4px");
  const BADGE_RADIUS = designTokenVar("radius.sm", "4px");
  const BADGE_FONT_WEIGHT = designTokenVar("typography.fontWeight.bold", "600");
  const CLOCK_IN_BADGE_BG = designTokenVar(
    "color.feedback.success.surface",
    "#E4F8C9"
  );
  const CLOCK_IN_BADGE_TEXT = designTokenVar(
    "color.feedback.success.base",
    "#1EAA6A"
  );
  const CLOCK_OUT_BADGE_BG = designTokenVar(
    "color.feedback.danger.surface",
    "#FDE0E0"
  );
  const CLOCK_OUT_BADGE_TEXT = designTokenVar(
    "color.feedback.danger.base",
    "#B33D47"
  );

  const clockInBadgeStyles: SxProps<Theme> = {
    display: "inline-block",
    px: BADGE_PADDING_X,
    py: BADGE_PADDING_Y,
    borderRadius: BADGE_RADIUS,
    bgcolor: CLOCK_IN_BADGE_BG,
    color: CLOCK_IN_BADGE_TEXT,
    fontWeight: BADGE_FONT_WEIGHT,
  };

  const clockOutBadgeStyles: SxProps<Theme> = {
    display: "inline-block",
    px: BADGE_PADDING_X,
    py: BADGE_PADDING_Y,
    borderRadius: BADGE_RADIUS,
    bgcolor: CLOCK_OUT_BADGE_BG,
    color: CLOCK_OUT_BADGE_TEXT,
    fontWeight: BADGE_FONT_WEIGHT,
  };

  const handleClockIn = useCallback(
    () => clockInCallback(cognitoUser, today, clockIn, dispatch, staff, logger),
    [cognitoUser, clockIn, dispatch, staff]
  );

  const handleClockOut = useCallback(
    () =>
      clockOutCallback(cognitoUser, today, clockOut, dispatch, staff, logger),
    [cognitoUser, clockOut, dispatch, staff]
  );

  const handleGoDirectly = useCallback(() => {
    const configured = getStartTime();
    const startIso = dayjs()
      .hour(configured.hour())
      .minute(configured.minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    goDirectlyCallback(
      cognitoUser,
      today,
      staff,
      dispatch,
      clockIn,
      logger,
      startIso
    );
  }, [
    cognitoUser,
    clockIn,
    dispatch,
    staff,
    today,
    logger,
    getStartTime,
    goDirectlyCallback,
  ]);

  const handleReturnDirectly = useCallback(() => {
    const configured = getEndTime();
    const endIso = dayjs()
      .hour(configured.hour())
      .minute(configured.minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    returnDirectlyCallback(
      cognitoUser,
      today,
      staff,
      dispatch,
      clockOut,
      logger,
      endIso
    );
  }, [
    cognitoUser,
    staff,
    dispatch,
    clockOut,
    today,
    logger,
    getEndTime,
    returnDirectlyCallback,
  ]);

  const handleRestStart = useCallback(
    () => restStartCallback(cognitoUser, today, dispatch, restStart, logger),
    [cognitoUser, restStart, dispatch]
  );

  const handleRestEnd = useCallback(
    () => restEndCallback(cognitoUser, today, restEnd, dispatch, logger),
    [cognitoUser, restEnd, dispatch]
  );

  const handleVisibilityChange = useMemo(() => {
    return () => {
      const now = dayjs();
      if (document.visibilityState === "visible") {
        if (now.diff(lastActiveTime, "minute") > 5) {
          window.location.reload();
        }
        setLastActiveTime(now);
      }
    };
  }, [lastActiveTime]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  useEffect(() => {
    if (!cognitoUser) return;

    fetchStaff(cognitoUser.id)
      .then(setStaff)
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E00001)));
  }, [cognitoUser, dispatch]);

  useEffect(() => {
    if (!shouldFetchAttendance || !attendanceError) {
      return;
    }

    dispatch(setSnackbarError(MESSAGE_CODE.E01001));
  }, [attendanceError, dispatch, shouldFetchAttendance]);

  useEffect(() => {
    if (!shouldFetchAttendance || !attendancesError) {
      return;
    }

    dispatch(setSnackbarError(MESSAGE_CODE.E02001));
  }, [attendancesError, dispatch, shouldFetchAttendance]);

  useEffect(() => {
    if (!staff || attendanceLoading || attendancesLoading || calendarLoading) {
      return;
    }

    const errorCount = attendances
      .map((attendance) => {
        const status = new AttendanceState(
          staff,
          attendance,
          holidayCalendars,
          companyHolidayCalendars
        ).get();
        return status;
      })
      .filter((status) => status === AttendanceStatus.Error).length;

    setIsAttendanceError(errorCount > 0);

    // 1週間以上前にエラーがあるかチェック
    const timeElapsedErrorCount = attendances.filter((attendance) => {
      const { workDate } = attendance;
      const isAfterOneWeek = dayjs().isAfter(dayjs(workDate).add(1, "week"));
      if (!isAfterOneWeek) return false;
      const status = new AttendanceState(
        staff,
        attendance,
        holidayCalendars,
        companyHolidayCalendars
      ).get();
      return status === AttendanceStatus.Error;
    }).length;

    setIsTimeElapsedError(timeElapsedErrorCount > 0);
  }, [
    attendanceLoading,
    attendancesLoading,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    attendances,
    calendarLoading,
  ]);

  useEffect(() => {
    setWorkStatus(getWorkStatus(attendance));
  }, [attendance]);

  // 勤怠データ更新のサブスクリプション
  useEffect(() => {
    if (!cognitoUser?.id) {
      return;
    }

    const subscription = graphqlClient
      .graphql({
        query: onUpdateAttendance,
        variables: {},
        authMode: "userPool",
      })
      .subscribe({
        next: async (event) => {
          const updatedAttendance =
            event.data as OnUpdateAttendanceSubscription;
          if (updatedAttendance?.onUpdateAttendance) {
            await Promise.allSettled([
              refetchAttendance(),
              refetchAttendances(),
            ]);
          }
        },
        error: (error: unknown) => {
          logger.error("Subscription error:", error);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [cognitoUser?.id, refetchAttendance, refetchAttendances, logger]);

  if (attendanceLoading || calendarLoading || workStatus === undefined) {
    return (
      <Box
        sx={{
          width: { xs: "100%", md: TIME_RECORDER_WIDTH_MD },
          maxWidth: TIME_RECORDER_WIDTH_MD,
          px: { xs: TIME_RECORDER_MARGIN_XS, md: 0 },
          mx: "auto",
          boxSizing: "border-box",
        }}
      >
        <LinearProgress />
      </Box>
    );
  }

  if (workStatus === null) {
    dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    return <></>;
  }

  return (
    <Box
      sx={{
        width: { xs: "100%", md: TIME_RECORDER_WIDTH_MD },
        maxWidth: TIME_RECORDER_WIDTH_MD,
        px: { xs: TIME_RECORDER_MARGIN_XS, md: 0 },
        mx: "auto",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          backgroundColor: TIME_RECORDER_SURFACE_BG,
          borderRadius: TIME_RECORDER_BORDER_RADIUS,
          borderColor: TIME_RECORDER_BORDER_COLOR,
          borderWidth: TIME_RECORDER_BORDER_WIDTH,
          borderStyle: "solid",
          boxShadow: TIME_RECORDER_SURFACE_SHADOW,
          p: { xs: TIME_RECORDER_PADDING_XS, md: TIME_RECORDER_PADDING_MD },
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography
              variant="h3"
              textAlign="center"
              data-testid="work-status-text"
            >
              {workStatus.text || "読み込み中..."}
            </Typography>
            {(clockInDisplayText || clockOutDisplayText) && (
              <Box display="flex" justifyContent="center" gap={1} mt={0.5}>
                {clockInDisplayText && (
                  <Typography
                    variant="body1"
                    textAlign="center"
                    data-testid="clock-in-time-text"
                    sx={clockInBadgeStyles}
                  >
                    {clockInDisplayText}
                  </Typography>
                )}
                {clockOutDisplayText && (
                  <Typography
                    variant="body1"
                    textAlign="center"
                    data-testid="clock-out-time-text"
                    sx={clockOutBadgeStyles}
                  >
                    {clockOutDisplayText}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            <Clock />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <DirectSwitch
                  onChange={() => setDirectMode(!directMode)}
                  inputProps={
                    {
                      "data-testid": "direct-mode-switch",
                    } as React.InputHTMLAttributes<HTMLInputElement>
                  }
                />
              }
              label="直行/直帰モード"
            />
          </Grid>
          <Grid item xs={6} sx={{ display: "flex", justifyContent: "center" }}>
            {directMode ? (
              <GoDirectlyItem
                workStatus={workStatus}
                onClick={handleGoDirectly}
              />
            ) : (
              <ClockInItem
                workStatus={workStatus}
                onClick={handleClockIn}
                disabled={hasChangeRequest}
              />
            )}
          </Grid>
          <Grid item xs={6} sx={{ display: "flex", justifyContent: "center" }}>
            {directMode ? (
              <ReturnDirectly
                workStatus={workStatus}
                onClick={handleReturnDirectly}
              />
            ) : (
              <ClockOutItem
                workStatus={workStatus}
                onClick={handleClockOut}
                disabled={hasChangeRequest}
              />
            )}
          </Grid>

          {/* 休憩 */}
          <Grid item xs={6} sx={{ display: "flex", justifyContent: "center" }}>
            <RestStartItem
              workStatus={workStatus}
              onClick={handleRestStart}
              disabled={hasChangeRequest}
            />
          </Grid>
          <Grid item xs={6} sx={{ display: "flex", justifyContent: "center" }}>
            <RestEndItem
              workStatus={workStatus}
              onClick={handleRestEnd}
              disabled={hasChangeRequest}
            />
          </Grid>

          {hasChangeRequest && (
            <Grid item xs={12}>
              <Alert severity="warning">
                変更リクエスト申請中です。承認されるまで打刻はできません。
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <QuickDailyReportCard staffId={staff?.id ?? null} date={today} />
          </Grid>
          {isAttendanceError && (
            <Grid item xs={12}>
              <AttendanceErrorAlert />
            </Grid>
          )}

          <TimeElapsedErrorDialog isTimeElapsedError={isTimeElapsedError} />

          <Grid item xs={12}>
            <RestTimeMessage />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

/**
 * 1週間以上経過した打刻エラーがある場合に表示するダイアログコンポーネント。
 * @param isTimeElapsedError - エラーが存在するかどうかのフラグ
 * @returns {JSX.Element} ダイアログUI
 */
function TimeElapsedErrorDialog({
  isTimeElapsedError,
}: {
  isTimeElapsedError: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isTimeElapsedError);
  }, [isTimeElapsedError]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      data-testid="time-elapsed-error-dialog"
    >
      <DialogTitle id="alert-dialog-title">
        <span data-testid="time-elapsed-error-dialog-title-text">
          1週間以上経過した打刻エラーがあります
        </span>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <span data-testid="time-elapsed-error-dialog-description-text">
            1週間以上経過した打刻エラーがあります。
          </span>
          <br />
          勤怠一覧を確認して打刻修正を申請してください。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          data-testid="time-elapsed-error-dialog-later-btn"
        >
          あとで
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            handleClose();
            window.open("/attendance/list", "_blank");
          }}
          data-testid="time-elapsed-error-dialog-confirm-btn"
        >
          確認する
        </Button>
      </DialogActions>
    </Dialog>
  );
}
