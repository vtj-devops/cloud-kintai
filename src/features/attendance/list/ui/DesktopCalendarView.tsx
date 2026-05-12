import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import AttendanceStatusChip from "@entities/attendance/ui/AttendanceStatusChip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { Box, Chip, Divider, Stack, styled, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { PANEL_HEIGHTS } from "@shared/config/uiDimensions";
import { AppIconButton } from "@shared/ui/button";
import dayjs, { Dayjs } from "dayjs";
import { useMemo } from "react";

import {
  buildWeeks,
  formatTimeRange,
  getHolidayNames,
  getNetWorkingHours,
  getStatus,
  getSubstituteHolidayLabel,
  getTotalRestHours,
  isHolidayLike,
} from "../lib/attendanceStatusUtils";
import { resolveMonthlyTerms } from "../lib/monthlyTermUtils";
import { useOptionalAttendanceListContext } from "./AttendanceListContext";

const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

const DayCell = styled(Box, {
  shouldForwardProp: (prop) =>
    !["$isCurrentMonth", "$isToday", "$isHoliday"].includes(String(prop)),
})<{
  $isCurrentMonth: boolean;
  $isToday: boolean;
  $isHoliday: boolean;
}>(({ theme, $isCurrentMonth, $isToday, $isHoliday }) => ({
  minHeight: PANEL_HEIGHTS.CALENDAR_MIN,
  borderRadius: 18,
  padding: theme.spacing(1.5),
  border: `1px solid rgba(148, 163, 184, 0.14)`,
  opacity: $isCurrentMonth ? 1 : 0.4,
  backgroundColor: $isToday
    ? alpha(theme.palette.success.main, 0.08)
    : $isHoliday
      ? alpha(theme.palette.warning.main, 0.08)
      : "rgba(255,255,255,0.92)",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  transition: "background-color 0.2s ease",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: alpha(theme.palette.success.main, 0.07),
  },
  [theme.breakpoints.down("lg")]: {
    minHeight: 110,
    padding: theme.spacing(1),
  },
}));

type Props = {
  attendances?: Attendance[];
  staff?: Staff | null | undefined;
  holidayCalendars?: HolidayCalendar[];
  companyHolidayCalendars?: CompanyHolidayCalendar[];
  navigate?: (path: string) => void;
  buildNavigatePath?: (formattedWorkDate: string) => string;
  closeDates?: CloseDate[];
  closeDatesLoading?: boolean;
  closeDatesError?: Error | null;
  currentMonth?: Dayjs;
  onMonthChange?: (nextMonth: Dayjs) => void;
  onOpenInRightPanel?: (
    attendance: Attendance | undefined,
    date: Dayjs,
  ) => void;
};

export default function DesktopCalendarView({
  attendances: attendancesProp,
  staff: staffProp,
  holidayCalendars: holidayCalendarsProp,
  companyHolidayCalendars: companyHolidayCalendarsProp,
  navigate: navigateProp,
  buildNavigatePath,
  closeDates: closeDatesProp,
  closeDatesLoading: closeDatesLoadingProp,
  closeDatesError: closeDatesErrorProp,
  currentMonth: currentMonthProp,
  onMonthChange: onMonthChangeProp,
  onOpenInRightPanel,
}: Props) {
  const context = useOptionalAttendanceListContext();
  const attendances = attendancesProp ?? context?.attendances ?? [];
  const staff = staffProp ?? context?.staff;
  const holidayCalendars =
    holidayCalendarsProp ?? context?.holidayCalendars ?? [];
  const companyHolidayCalendars =
    companyHolidayCalendarsProp ?? context?.companyHolidayCalendars ?? [];
  const navigate = navigateProp ?? context?.navigate;
  const closeDates = closeDatesProp ?? context?.closeDates ?? [];
  const closeDatesLoading =
    closeDatesLoadingProp ?? context?.closeDatesLoading ?? false;
  const closeDatesError =
    closeDatesErrorProp ?? context?.closeDatesError ?? null;
  const currentMonth =
    currentMonthProp ?? context?.currentMonth ?? dayjs().startOf("month");
  const onMonthChange = onMonthChangeProp ?? context?.onMonthChange;
  const theme = useTheme();
  const resolvedCurrentMonth = currentMonth;

  const updateMonth = (updater: (prev: Dayjs) => Dayjs) => {
    const nextMonth = updater(resolvedCurrentMonth);
    if (!onMonthChange) return;
    onMonthChange(nextMonth);
  };

  const attendanceMap = useMemo(() => {
    return attendances.reduce((map, attendance) => {
      if (attendance.workDate) {
        map.set(attendance.workDate, attendance);
      }
      return map;
    }, new Map<string, Attendance>());
  }, [attendances]);

  const weeks = useMemo(
    () => buildWeeks(resolvedCurrentMonth),
    [resolvedCurrentMonth],
  );

  const handleDayClick = (date: Dayjs) => {
    if (!navigate) return;
    const formatted = date.format(AttendanceDate.QueryParamFormat);
    const path = buildNavigatePath
      ? buildNavigatePath(formatted)
      : `/attendance/${formatted}/edit`;
    navigate(path);
  };

  const termPalette = useMemo(
    () => [
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.secondary.main,
    ],
    [
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.secondary.main,
    ],
  );

  const monthlyTerms = useMemo(
    () => resolveMonthlyTerms(resolvedCurrentMonth, closeDates, termPalette),
    [closeDates, resolvedCurrentMonth, termPalette],
  );
  const showFallbackNotice =
    monthlyTerms.length === 1 &&
    monthlyTerms[0]?.source === "fallback" &&
    !closeDatesLoading;
  const showCloseDateError = Boolean(closeDatesError);

  return (
    <div className="hidden rounded-[28px] border border-emerald-500/15 bg-[linear-gradient(180deg,rgba(247,252,248,0.96)_0%,rgba(255,255,255,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:block lg:p-6">
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <AppIconButton
              aria-label="previous-month"
              onClick={() => updateMonth((prev) => prev.add(-1, "month"))}
              size="sm"
            >
              <ChevronLeftIcon />
            </AppIconButton>
            <AppIconButton
              aria-label="next-month"
              onClick={() => updateMonth((prev) => prev.add(1, "month"))}
              size="sm"
            >
              <ChevronRightIcon />
            </AppIconButton>
            <Divider orientation="vertical" flexItem />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {resolvedCurrentMonth.format("YYYY年M月")}
            </Typography>
          </Stack>
          <Box>
            <AppIconButton
              onClick={() => updateMonth(() => dayjs().startOf("month"))}
              aria-label="今月に戻る"
              size="sm"
              tooltip="今月に戻る"
            >
              <Typography variant="body2">今月</Typography>
            </AppIconButton>
          </Box>
        </Stack>

        <Stack spacing={0.5}>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="body2" color="text.secondary">
              集計期間:
            </Typography>
            {monthlyTerms.map((term, index) => (
              <Chip
                key={`${term.label}-${index}`}
                size="small"
                label={term.label}
                variant="outlined"
                sx={{
                  bgcolor: alpha(term.color, 0.06),
                  color: term.color,
                  borderColor: alpha(term.color, 0.5),
                  borderStyle: "solid",
                  borderWidth: 1,
                }}
              />
            ))}
          </Stack>
          {showFallbackNotice && (
            <Typography variant="caption" color="text.secondary">
              集計対象月が未登録のため、暫定で月初〜月末を表示しています。
            </Typography>
          )}
          {showCloseDateError && (
            <Typography variant="caption" color="error">
              集計対象月の取得に失敗したため、暫定の期間で表示しています。
            </Typography>
          )}
        </Stack>
      </Stack>

      <div className="mb-1 grid grid-cols-7 gap-3 lg:gap-2.5">
        {DAYS_OF_WEEK.map((label, index) => (
          <Typography
            key={label}
            variant="subtitle2"
            align="center"
            sx={{
              color:
                index === 0
                  ? "error.main"
                  : index === 6
                    ? "info.main"
                    : "text.secondary",
            }}
          >
            {label}
          </Typography>
        ))}
      </div>

      <Stack spacing={1.5}>
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid grid-cols-7 gap-3 lg:gap-2.5"
          >
            {week.map((date) => {
              const workDate = date.format(AttendanceDate.DataFormat);
              const attendance = attendanceMap.get(workDate);
              const status = getStatus(
                attendance,
                staff,
                holidayCalendars,
                companyHolidayCalendars,
                date,
              );
              const netHours = getNetWorkingHours(attendance);
              const totalRestHours = getTotalRestHours(attendance);
              const timeRangeLabel = attendance
                ? formatTimeRange(attendance)
                : undefined;
              const isToday = date.isSame(dayjs(), "day");
              const isCurrentMonth = date.isSame(resolvedCurrentMonth, "month");
              const holidayLike = isHolidayLike(
                date,
                staff,
                holidayCalendars,
                companyHolidayCalendars,
              );
              const isWeekend = date.day() === 0 || date.day() === 6;
              const { holidayName, companyHolidayName } = getHolidayNames(
                date,
                holidayCalendars,
                companyHolidayCalendars,
              );
              const holidayLabels = [
                holidayName,
                companyHolidayName
                  ? `会社休日 ${companyHolidayName}`
                  : undefined,
                getSubstituteHolidayLabel(attendance),
              ].filter((label): label is string => Boolean(label));

              const termsForDay = monthlyTerms.filter(
                (term) =>
                  !date.isBefore(term.start, "day") &&
                  !date.isAfter(term.end, "day"),
              );
              // シフト勤務の場合は休日関係なく集計期間の色を表示
              const allowTermHighlight =
                staff?.workType === "shift" ? true : !holidayLike && !isWeekend;
              const primaryTerm = allowTermHighlight
                ? termsForDay[0]
                : undefined;
              const termBackground = primaryTerm
                ? alpha(primaryTerm.color, 0.08)
                : undefined;
              const termBorder = primaryTerm
                ? `3px solid ${alpha(primaryTerm.color, 0.35)}`
                : undefined;
              const hasOverlap = allowTermHighlight && termsForDay.length > 1;

              return (
                <DayCell
                  key={workDate}
                  onClick={() => handleDayClick(date)}
                  $isCurrentMonth={isCurrentMonth}
                  $isToday={isToday}
                  $isHoliday={holidayLike}
                  sx={{
                    backgroundColor: termBackground,
                    borderLeft: termBorder,
                  }}
                >
                  {hasOverlap && primaryTerm && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: alpha(primaryTerm.color, 0.9),
                        border: `1px solid ${alpha(
                          theme.palette.common.white,
                          0.9,
                        )}`,
                      }}
                    />
                  )}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {date.date()}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {onOpenInRightPanel && attendance && (
                        <AppIconButton
                          size="sm"
                          aria-label="右側で開く"
                          tooltip="右側で開く"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInRightPanel(attendance, date);
                          }}
                        >
                          <OpenInNewOutlinedIcon sx={{ fontSize: "16px" }} />
                        </AppIconButton>
                      )}
                      <AttendanceStatusChip status={status} />
                    </Box>
                  </Stack>
                  {timeRangeLabel && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {timeRangeLabel}
                    </Typography>
                  )}
                  {attendance?.paidHolidayFlag ? (
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      有給休暇
                    </Typography>
                  ) : (
                    netHours > 0 && (
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {`${netHours.toFixed(1)}h`}
                      </Typography>
                    )
                  )}
                  {attendance &&
                    !attendance.paidHolidayFlag &&
                    totalRestHours > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {`休憩 ${totalRestHours.toFixed(1)}h`}
                      </Typography>
                    )}
                  {holidayLabels.map((label) => (
                    <Typography
                      key={label}
                      variant="caption"
                      color="error.main"
                      sx={{ fontWeight: "bold" }}
                    >
                      {label}
                    </Typography>
                  ))}
                </DayCell>
              );
            })}
          </div>
        ))}
      </Stack>
    </div>
  );
}
