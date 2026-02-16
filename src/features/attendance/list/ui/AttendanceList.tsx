/**
 * スタッフ向けの勤怠一覧ページのコンポーネント。
 * ユーザーの勤怠情報を取得し、デスクトップ・モバイル両方のリストで表示する。
 * MaterialUIを使用し、日付選択や合計勤務時間の表示も行う。
 */
import { useListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import {
  useGetCompanyHolidayCalendarsQuery,
  useGetHolidayCalendarsQuery,
} from "@entities/calendar/api/calendarApi";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import {
  Box,
  LinearProgress,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Staff } from "@shared/api/graphql/types";
/**
 * 日付操作ライブラリ。日付のフォーマットや計算に使用。
 */
/**
 * ReactのContext, Hooks。
 */
import dayjs, { Dayjs } from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { calcTotalRestTime , calcTotalWorkTime } from "@/entities/attendance/lib/time";
import * as MESSAGE_CODE from "@/errors";
import { designTokenVar } from "@/shared/designSystem";
/**
 * AmplifyのLogger。デバッグ・エラー出力に使用。
 */
import { Logger } from "@/shared/lib/logger";
import { setSnackbarError } from "@/shared/lib/store/snackbarSlice";

import DesktopList from "./DesktopList";
import MobileList from "./MobileList/MobileList";

/**
 * 勤怠一覧ページの説明文用Typographyコンポーネント。
 */
const DescriptionTypography = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    padding: "0px 10px",
  },
}));

/**
 * 勤怠一覧テーブルのメインコンポーネント。
 * ユーザーの勤怠データ取得、合計勤務時間計算、リスト表示を行う。
 * @returns JSX.Element
 */
export default function AttendanceTable() {
  /**
   * 認証済みユーザー情報。
   */
  const { cognitoUser } = useContext(AuthContext);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  /**
   * Reduxのdispatch関数。
   */
  const dispatch = useDispatch();
  /**
   * ページ遷移用navigate関数。
   */
  const navigate = useNavigate();
  /**
   * 勤怠情報取得用カスタムフック。
   */
  const shouldFetchAttendances = Boolean(cognitoUser?.id);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    dayjs().startOf("month")
  );

  const startDate = currentMonth
    .startOf("month")
    .format(AttendanceDate.DataFormat);
  const endDate = currentMonth.endOf("month").format(AttendanceDate.DataFormat);

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
  const {
    closeDates,
    loading: closeDatesLoading,
    error: closeDatesError,
  } = useCloseDates();
  const calendarLoading =
    isHolidayCalendarsLoading ||
    isHolidayCalendarsFetching ||
    isCompanyHolidayCalendarsLoading ||
    isCompanyHolidayCalendarsFetching;
  const {
    data: attendances = [],
    isLoading: isAttendancesInitialLoading,
    isFetching: isAttendancesFetching,
    isUninitialized: isAttendancesUninitialized,
    error: attendancesError,
  } = useListAttendancesByDateRangeQuery(
    {
      staffId: cognitoUser?.id ?? "",
      startDate,
      endDate,
    },
    { skip: !shouldFetchAttendances }
  );

  const attendanceLoading =
    !shouldFetchAttendances ||
    isAttendancesInitialLoading ||
    isAttendancesFetching ||
    isAttendancesUninitialized;

  /**
   * スタッフ情報の状態。
   */
  const logger = useMemo(
    () => new Logger("AttendanceList", import.meta.env.DEV ? "DEBUG" : "ERROR"),
    []
  );
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);

  /**
   * ユーザー情報取得・勤怠情報取得の副作用。
   */
  useEffect(() => {
    if (!cognitoUser) return;
    fetchStaff(cognitoUser.id)
      .then((res: Staff | undefined) => {
        setStaff(res);
      })
      .catch((error: unknown) => {
        logger.debug(error);
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      });
  }, [cognitoUser, dispatch, logger]);

  useEffect(() => {
    if (holidayCalendarsError || companyHolidayCalendarsError) {
      logger.debug(holidayCalendarsError ?? companyHolidayCalendarsError);
      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    }
  }, [holidayCalendarsError, companyHolidayCalendarsError, dispatch, logger]);

  useEffect(() => {
    if (closeDatesError) {
      logger.debug(closeDatesError);
      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    }
  }, [closeDatesError, dispatch, logger]);

  useEffect(() => {
    if (attendancesError) {
      logger.debug(attendancesError);
      dispatch(setSnackbarError(MESSAGE_CODE.E02001));
    }
  }, [attendancesError, dispatch, logger]);

  /**
   * 現在有効期間中の集計期間を解決する。
   * closeDatesから該当月の有効期間を取得し、フォールバックは月初〜月末。
   */
  const effectiveDateRange = useMemo(() => {
    const monthStart = currentMonth.startOf("month");
    const monthEnd = currentMonth.endOf("month");

    // 該当月と重複する有効期間を探す
    const applicableCloseDates = closeDates.filter((closeDate) => {
      const start = dayjs(closeDate.startDate);
      const end = dayjs(closeDate.endDate);
      return (
        start.isValid() &&
        end.isValid() &&
        // 月の範囲と少しでも重なれば対象
        !end.isBefore(monthStart, "day") &&
        !start.isAfter(monthEnd, "day")
      );
    });

    if (applicableCloseDates.length > 0) {
      // 有効期間が複数ある場合は、最新の更新日時を優先
      const latest = applicableCloseDates.reduce((prev, current) => {
        const prevUpdatedAt = dayjs(prev.updatedAt ?? prev.closeDate).valueOf();
        const currentUpdatedAt = dayjs(
          current.updatedAt ?? current.closeDate
        ).valueOf();
        return currentUpdatedAt > prevUpdatedAt ? current : prev;
      });

      return {
        start: dayjs(latest.startDate),
        end: dayjs(latest.endDate),
        hasValidPeriod: true,
      };
    }

    // フォールバック: 月初〜月末
    return {
      start: monthStart,
      end: monthEnd,
      hasValidPeriod: false,
    };
  }, [currentMonth, closeDates]);

  /**
   * 勤怠データから合計勤務時間（休憩時間を除く）を計算する。
   * 有効期間内のデータのみを対象とする。
   */
  const totalTime = useMemo(() => {
    // 有効期間内のデータのみをフィルター
    const filteredAttendances = attendances.filter((attendance) => {
      if (!attendance.workDate) return false;
      const workDate = dayjs(attendance.workDate);
      return (
        !workDate.isBefore(effectiveDateRange.start, "day") &&
        !workDate.isAfter(effectiveDateRange.end, "day")
      );
    });

    const totalWorkTime = filteredAttendances.reduce((acc, attendance) => {
      if (!attendance.startTime || !attendance.endTime) return acc;
      const workTime = calcTotalWorkTime(
        attendance.startTime,
        attendance.endTime
      );
      return acc + workTime;
    }, 0);

    const totalRestTime = filteredAttendances.reduce((acc, attendance) => {
      if (!attendance.rests) return acc;
      const restTime = attendance.rests
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((acc, rest) => {
          if (!rest.startTime || !rest.endTime) return acc;
          return acc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);
      return acc + restTime;
    }, 0);
    return totalWorkTime - totalRestTime;
  }, [attendances, effectiveDateRange]);

  /**
   * 集計期間のラベルを生成する。
   */
  const rangeLabelForDisplay = useMemo(() => {
    const startLabel = effectiveDateRange.start.format(
      AttendanceDate.DisplayFormat
    );
    const endLabel = effectiveDateRange.end.format(
      AttendanceDate.DisplayFormat
    );
    return `${startLabel} 〜 ${endLabel}`;
  }, [effectiveDateRange]);

  if (attendanceLoading || calendarLoading || closeDatesLoading) {
    return <LinearProgress />;
  }

  const headerBackground = designTokenVar(
    "component.pageSection.background",
    "#FFFFFF"
  );
  const headerShadow = designTokenVar(
    "component.pageSection.shadow",
    "0 12px 24px rgba(17, 24, 39, 0.06)"
  );
  const headerRadius = designTokenVar("component.pageSection.radius", "12px");
  const headerPaddingX = designTokenVar("spacing.lg", "16px");
  const headerPaddingY = designTokenVar("spacing.md", "12px");
  const headerGap = designTokenVar("spacing.sm", "8px");

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          backgroundColor: headerBackground,
          boxShadow: headerShadow,
          borderRadius: headerRadius,
          px: { xs: "12px", sm: headerPaddingX },
          py: { xs: "10px", sm: headerPaddingY },
          display: "flex",
          flexDirection: "column",
          gap: headerGap,
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
          >
            勤怠一覧
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "0.95rem", md: "1rem" } }}
          >
            {rangeLabelForDisplay}の合計勤務時間: {totalTime.toFixed(1)}h
          </Typography>
        </Stack>
        <DescriptionTypography
          variant="body1"
          sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" } }}
        >
          月を選択して勤怠情報を表示・編集できます
        </DescriptionTypography>
      </Box>
      {isDesktop ? (
        <DesktopList
          attendances={attendances}
          holidayCalendars={holidayCalendars}
          companyHolidayCalendars={companyHolidayCalendars}
          navigate={navigate}
          staff={staff}
          closeDates={closeDates}
          closeDatesLoading={closeDatesLoading}
          closeDatesError={closeDatesError}
          currentMonth={currentMonth}
          onMonthChange={(nextMonth) => setCurrentMonth(nextMonth)}
        />
      ) : (
        <MobileList
          attendances={attendances}
          holidayCalendars={holidayCalendars}
          companyHolidayCalendars={companyHolidayCalendars}
          staff={staff}
          currentMonth={currentMonth}
          onMonthChange={(nextMonth) => setCurrentMonth(nextMonth)}
          closeDates={closeDates}
        />
      )}
    </Stack>
  );
}
