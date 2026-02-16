import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Stack,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { NavigateFunction } from "react-router-dom";

import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceState, AttendanceStatus } from "@/entities/attendance/lib/AttendanceState";
import { CompanyHoliday } from "@/entities/attendance/lib/CompanyHoliday";
import { Holiday } from "@/entities/attendance/lib/Holiday";
import { calcTotalRestTime , calcTotalWorkTime } from "@/entities/attendance/lib/time";
import { PANEL_HEIGHTS } from "@/shared/config/uiDimensions";

const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

const CalendarWrapper = styled(Box)(({ theme }) => ({
  padding: "0px 40px 32px 40px",
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down("lg")]: {
    padding: "0px 24px 24px 24px",
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const CalendarGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: theme.spacing(1),
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(0.75),
  },
}));

const DayCell = styled(Box, {
  shouldForwardProp: (prop) =>
    !["$isCurrentMonth", "$isToday", "$isHoliday"].includes(String(prop)),
})<{
  $isCurrentMonth: boolean;
  $isToday: boolean;
  $isHoliday: boolean;
}>(({ theme, $isCurrentMonth, $isToday, $isHoliday }) => ({
  minHeight: PANEL_HEIGHTS.CALENDAR_MIN,
  borderRadius: 12,
  padding: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  opacity: $isCurrentMonth ? 1 : 0.4,
  backgroundColor: $isToday
    ? theme.palette.action.hover
    : $isHoliday
    ? theme.palette.action.selected
    : theme.palette.background.default,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  transition: "background-color 0.2s ease",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down("lg")]: {
    minHeight: 110,
    padding: theme.spacing(1),
  },
}));

const statusLabelMap: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Ok]: "OK",
  [AttendanceStatus.Error]: "要確認",
  [AttendanceStatus.Requesting]: "申請中",
  [AttendanceStatus.Late]: "遅刻",
  [AttendanceStatus.Working]: "勤務中",
  [AttendanceStatus.None]: "",
};

const statusChipColor: Record<
  AttendanceStatus,
  "default" | "success" | "error" | "warning" | "info"
> = {
  [AttendanceStatus.Ok]: "success",
  [AttendanceStatus.Error]: "error",
  [AttendanceStatus.Requesting]: "warning",
  [AttendanceStatus.Late]: "error",
  [AttendanceStatus.Working]: "info",
  [AttendanceStatus.None]: "default",
};

function buildWeeks(targetMonth: Dayjs) {
  const monthStart = targetMonth.startOf("month").startOf("week");
  const monthEnd = targetMonth.endOf("month").endOf("week");
  const days: Dayjs[] = [];

  let cursor = monthStart;
  while (cursor.isBefore(monthEnd) || cursor.isSame(monthEnd, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const weeks: Dayjs[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function getNetWorkingHours(attendance: Attendance | undefined) {
  if (!attendance) return 0;
  if (!attendance.startTime || !attendance.endTime) return 0;

  const workTime = calcTotalWorkTime(attendance.startTime, attendance.endTime);
  const totalRest = getTotalRestHours(attendance);

  return Math.max(workTime - totalRest, 0);
}

function getTotalRestHours(attendance: Attendance | undefined) {
  if (!attendance?.rests || !attendance.endTime) return 0;

  const totalRest = (attendance.rests || [])
    .filter((rest): rest is NonNullable<typeof rest> => !!rest)
    .reduce((acc, rest) => {
      if (!rest.startTime || !rest.endTime) return acc;
      return acc + calcTotalRestTime(rest.startTime, rest.endTime);
    }, 0);

  return totalRest;
}

function formatTimeRange(attendance: Attendance | undefined) {
  if (!attendance) return undefined;

  const format = (value?: string | null) =>
    value ? dayjs(value).format("HH:mm") : undefined;

  const start = format(attendance.startTime || undefined);
  const end = format(attendance.endTime || undefined);

  if (!start && !end) {
    return undefined;
  }

  return `${start ?? ""} - ${end ?? ""}`.trim();
}

function getStatus(
  attendance: Attendance | undefined,
  staff: Staff | null | undefined,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[],
  date: Dayjs
) {
  if (!staff) return AttendanceStatus.None;

  // 打刻がない場合の処理
  if (!attendance) {
    const workDate = date.format(AttendanceDate.DataFormat);
    const today = dayjs();

    // 今日または未来日の場合はステータスなし
    if (date.isSame(today, "day") || date.isAfter(today, "day")) {
      return AttendanceStatus.None;
    }

    // 利用開始日より前の場合はステータスなし
    if (
      staff.usageStartDate &&
      date.isBefore(dayjs(staff.usageStartDate), "day")
    ) {
      return AttendanceStatus.None;
    }

    // 休日の場合はステータスなし
    const isHoliday = new Holiday(holidayCalendars, workDate).isHoliday();
    const isCompanyHoliday = new CompanyHoliday(
      companyHolidayCalendars,
      workDate
    ).isHoliday();

    if (staff.workType === "shift") {
      // シフトタイプの場合は休日のみチェック
      if (isHoliday || isCompanyHoliday) {
        return AttendanceStatus.None;
      }
    } else {
      // シフトタイプ以外の場合は休日と土日をチェック
      if (isHoliday || isCompanyHoliday || [0, 6].includes(date.day())) {
        return AttendanceStatus.None;
      }
    }

    // 過去日で休日以外の場合はエラー
    return AttendanceStatus.Error;
  }

  return new AttendanceState(
    staff,
    attendance,
    holidayCalendars,
    companyHolidayCalendars
  ).get();
}

function isHolidayLike(
  date: Dayjs,
  staff: Staff | null | undefined,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[]
) {
  const workDate = date.format(AttendanceDate.DataFormat);
  const isHoliday = new Holiday(holidayCalendars, workDate).isHoliday();
  const isCompanyHoliday = new CompanyHoliday(
    companyHolidayCalendars,
    workDate
  ).isHoliday();

  if (staff?.workType === "shift") {
    // シフトタイプの場合も法定休日と会社休日の両方をチェック
    return isHoliday || isCompanyHoliday;
  }

  return isHoliday || isCompanyHoliday || [0, 6].includes(date.day());
}

function getHolidayNames(
  date: Dayjs,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[]
) {
  const workDate = date.format(AttendanceDate.DataFormat);
  const holiday = new Holiday(holidayCalendars, workDate).getHoliday();
  const companyHoliday = new CompanyHoliday(
    companyHolidayCalendars,
    workDate
  ).getHoliday();

  return {
    holidayName: holiday?.name,
    companyHolidayName: companyHoliday?.name,
  };
}

type Props = {
  attendances: Attendance[];
  staff: Staff | null | undefined;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  navigate: NavigateFunction;
  buildNavigatePath?: (formattedWorkDate: string) => string;
  closeDates?: CloseDate[];
  closeDatesLoading?: boolean;
  closeDatesError?: Error | null;
  currentMonth?: Dayjs;
  onMonthChange?: (nextMonth: Dayjs) => void;
  onOpenInRightPanel?: (
    attendance: Attendance | undefined,
    date: Dayjs
  ) => void;
};

type MonthTerm = {
  start: Dayjs;
  end: Dayjs;
  source: "closeDate" | "fallback";
  label: string;
  color: string;
};

function resolveMonthlyTerms(
  currentMonth: Dayjs,
  closeDates: CloseDate[] = [],
  palette: string[]
): MonthTerm[] {
  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");

  const fallback: MonthTerm = {
    start: monthStart,
    end: monthEnd,
    source: "fallback",
    label: `${currentMonth
      .startOf("month")
      .format(AttendanceDate.DisplayFormat)} 〜 ${currentMonth
      .endOf("month")
      .format(AttendanceDate.DisplayFormat)}`,
    color: palette[0] ?? "#90CAF9",
  };

  if (closeDates.length === 0) {
    return [fallback];
  }

  const terms = closeDates
    .map((item) => {
      const closeDate = dayjs(item.closeDate);
      const start = dayjs(item.startDate);
      const end = dayjs(item.endDate);
      const updatedAt = dayjs(item.updatedAt ?? item.closeDate);
      return { item, closeDate, start, end, updatedAt };
    })
    .filter(({ closeDate, start, end }) => {
      return (
        closeDate.isValid() &&
        start.isValid() &&
        end.isValid() &&
        // 月の範囲と少しでも重なれば対象
        !end.isBefore(monthStart, "day") &&
        !start.isAfter(monthEnd, "day")
      );
    })
    .toSorted((a, b) => a.start.valueOf() - b.start.valueOf())
    .map(
      ({ start, end }, index): MonthTerm => ({
        start: start.startOf("day"),
        end: end.startOf("day"),
        source: "closeDate",
        label: `${start.format(AttendanceDate.DisplayFormat)} 〜 ${end.format(
          AttendanceDate.DisplayFormat
        )}`,
        color: palette[index % palette.length] ?? palette[0] ?? "#90CAF9",
      })
    );

  if (terms.length === 0) return [fallback];
  return terms;
}

export default function DesktopCalendarView({
  attendances,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
  navigate,
  buildNavigatePath,
  closeDates,
  closeDatesLoading,
  closeDatesError,
  currentMonth,
  onMonthChange,
  onOpenInRightPanel,
}: Props) {
  const theme = useTheme();
  const [internalMonth, setInternalMonth] = useState(
    () => currentMonth ?? dayjs().startOf("month")
  );
  const resolvedCurrentMonth = currentMonth ?? internalMonth;

  const updateMonth = (updater: (prev: Dayjs) => Dayjs) => {
    const nextMonth = updater(resolvedCurrentMonth);
    if (onMonthChange) {
      onMonthChange(nextMonth);
      return;
    }
    setInternalMonth(nextMonth);
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
    [resolvedCurrentMonth]
  );

  const handleDayClick = (date: Dayjs) => {
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
    ]
  );

  const monthlyTerms = useMemo(
    () => resolveMonthlyTerms(resolvedCurrentMonth, closeDates, termPalette),
    [closeDates, resolvedCurrentMonth, termPalette]
  );
  const hasCloseDateContext =
    closeDates !== undefined ||
    closeDatesLoading !== undefined ||
    closeDatesError !== undefined;

  const showFallbackNotice =
    hasCloseDateContext &&
    monthlyTerms.length === 1 &&
    monthlyTerms[0]?.source === "fallback" &&
    !closeDatesLoading;
  const showCloseDateError = hasCloseDateContext && Boolean(closeDatesError);

  return (
    <CalendarWrapper>
      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              aria-label="previous-month"
              onClick={() => updateMonth((prev) => prev.add(-1, "month"))}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="next-month"
              onClick={() => updateMonth((prev) => prev.add(1, "month"))}
            >
              <ChevronRightIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <Typography variant="h6">
              {resolvedCurrentMonth.format("YYYY年M月")}
            </Typography>
          </Stack>
          <Box>
            <Tooltip title="今月に戻る">
              <IconButton
                onClick={() => updateMonth(() => dayjs().startOf("month"))}
              >
                <Typography variant="body2">今月</Typography>
              </IconButton>
            </Tooltip>
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

      <CalendarGrid sx={{ mb: 1 }}>
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
      </CalendarGrid>

      <Stack spacing={1.5}>
        {weeks.map((week, weekIndex) => (
          <CalendarGrid key={`week-${weekIndex}`}>
            {week.map((date) => {
              const workDate = date.format(AttendanceDate.DataFormat);
              const attendance = attendanceMap.get(workDate);
              const status = getStatus(
                attendance,
                staff,
                holidayCalendars,
                companyHolidayCalendars,
                date
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
                companyHolidayCalendars
              );
              const isWeekend = date.day() === 0 || date.day() === 6;
              const { holidayName, companyHolidayName } = getHolidayNames(
                date,
                holidayCalendars,
                companyHolidayCalendars
              );
              const holidayLabels = [
                holidayName,
                companyHolidayName
                  ? `会社休日 ${companyHolidayName}`
                  : undefined,
              ].filter((label): label is string => Boolean(label));

              const termsForDay = monthlyTerms.filter(
                (term) =>
                  !date.isBefore(term.start, "day") &&
                  !date.isAfter(term.end, "day")
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
                          0.9
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
                        <Tooltip title="右側で開く">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInRightPanel(attendance, date);
                            }}
                            sx={{
                              padding: "2px",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}
                          >
                            <OpenInNewOutlinedIcon sx={{ fontSize: "16px" }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {status !== AttendanceStatus.None && (
                        <Chip
                          size="small"
                          label={statusLabelMap[status]}
                          color={statusChipColor[status]}
                        />
                      )}
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
          </CalendarGrid>
        ))}
      </Stack>
    </CalendarWrapper>
  );
}
