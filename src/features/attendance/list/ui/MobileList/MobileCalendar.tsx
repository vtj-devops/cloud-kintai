/**
 * モバイル用カレンダー表示コンポーネント
 * スタッフの勤怠情報をカレンダー形式で表示する
 */
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  styled,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceStatus } from "@/entities/attendance/lib/AttendanceState";

import { getStatus, isHolidayLike } from "../../lib/attendanceStatusUtils";

const CalendarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const DayOfWeekHeader = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "2px",
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(0.5, 0),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
}));

const DayOfWeekCell = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "0.625rem",
  color: theme.palette.text.secondary,
}));

const CalendarGrid = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "2px",
}));

interface CalendarDayProps {
  isCurrentMonth: boolean;
  hasError: boolean;
  status?: AttendanceStatus;
  isSelected?: boolean;
  termColor?: string;
}

const CalendarDayBase = styled(Box)(() => {
  return {
    position: "relative",
    minHeight: "48px",
    borderRadius: "4px",
    padding: "2px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    transition: "all 0.2s ease",
    overflow: "hidden",
  };
});

const CalendarDayCell = ({
  isCurrentMonth,
  hasError,
  status,
  isSelected,
  termColor,
  children,
  onClick,
}: CalendarDayProps & { children: React.ReactNode; onClick?: () => void }) => {
  const theme = useTheme();

  let backgroundColor = isCurrentMonth
    ? theme.palette.background.paper
    : theme.palette.grey[50];
  let borderColor = theme.palette.divider;
  let color = isCurrentMonth
    ? theme.palette.text.primary
    : theme.palette.text.secondary;

  if (status === AttendanceStatus.Error || hasError) {
    // エラー系：枠線なし、テキスト色のみ
    color = theme.palette.error.dark;
  } else if (status === AttendanceStatus.Late) {
    // 遅刻系：背景色なし、枠線のみ
    borderColor = theme.palette.warning.main;
    color = theme.palette.warning.dark;
  } else if (status === AttendanceStatus.None && !isCurrentMonth) {
    // 月外のステータスなし：グレーアウト
    backgroundColor = theme.palette.grey[200];
    color = theme.palette.text.secondary;
  }

  if (isSelected) {
    borderColor = theme.palette.primary.main;
  }

  return (
    <CalendarDayBase
      sx={{
        border: isSelected
          ? `2px solid ${borderColor}`
          : `1px solid ${borderColor}`,
        paddingBottom: termColor ? "6px" : "2px",
        cursor: isCurrentMonth ? "pointer" : "default",
        backgroundColor,
        color,
        // 集計期間の色を下側の横帯として表示
        ...(termColor && {
          "::after": {
            content: '""',
            position: "absolute",
            bottom: "2px",
            left: "2px",
            right: "2px",
            height: "4px",
            backgroundColor: termColor,
            borderRadius: "2px",
          },
        }),
        "&:hover": isCurrentMonth
          ? {
              boxShadow: theme.shadows[1],
              transform: "scale(1.02)",
            }
          : {},
      }}
      onClick={onClick}
    >
      {children}
    </CalendarDayBase>
  );
};

const DayNumber = styled(Typography)({
  fontSize: "0.75rem",
  fontWeight: "bold",
  lineHeight: 1,
  marginBottom: "2px",
});

const HolidayName = styled(Typography)({
  fontSize: "0.45rem",
  lineHeight: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#d32f2f",
  marginBottom: "2px",
});

const statusLabelMap: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Ok]: "OK",
  [AttendanceStatus.Error]: "要確認",
  [AttendanceStatus.Requesting]: "申請中",
  [AttendanceStatus.Late]: "遅刻",
  [AttendanceStatus.Working]: "勤務中",
  [AttendanceStatus.None]: "",
};

const statusTextColorMap: Partial<Record<AttendanceStatus, string>> = {
  [AttendanceStatus.Ok]: "success.main",
  [AttendanceStatus.Error]: "error.main",
  [AttendanceStatus.Late]: "warning.main",
  [AttendanceStatus.Requesting]: "info.main",
  [AttendanceStatus.Working]: "info.main",
};

type MonthTerm = {
  start: Dayjs;
  end: Dayjs;
  source: "closeDate" | "fallback";
  label: string;
  color: string;
};

const resolveMonthlyTerms = (
  currentMonth: Dayjs,
  closeDates: CloseDate[] = [],
  palette: string[]
): MonthTerm[] => {
  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");

  const fallback: MonthTerm = {
    start: monthStart,
    end: monthEnd,
    source: "fallback",
    label: `${monthStart.format(
      AttendanceDate.DisplayFormat
    )} 〜 ${monthEnd.format(AttendanceDate.DisplayFormat)}`,
    color: palette[0] ?? "#90CAF9",
  };

  if (closeDates.length === 0) return [fallback];

  const terms = closeDates
    .map((item) => {
      const start = dayjs(item.startDate);
      const end = dayjs(item.endDate);
      return { start, end };
    })
    .filter(({ start, end }) => {
      return (
        start.isValid() &&
        end.isValid() &&
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
};

interface MobileCalendarProps {
  attendances: Attendance[];
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  staff: Staff | null | undefined;
  currentMonth: Dayjs;
  onMonthChange?: (newMonth: Dayjs) => void;
  closeDates?: CloseDate[];
  buildNavigatePath?: (formattedWorkDate: string) => string;
}

export default function MobileCalendar({
  attendances,
  holidayCalendars,
  companyHolidayCalendars,
  staff,
  currentMonth,
  onMonthChange,
  closeDates,
  buildNavigatePath,
}: MobileCalendarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = dayjs();
    // 今日の日付が表示中の月に含まれる場合のみ選択状態にする
    return today.isSame(currentMonth, "month")
      ? today.format("YYYY-MM-DD")
      : null;
  });

  // 月が変更された時に今日の日付を選択
  useEffect(() => {
    const today = dayjs();
    if (today.isSame(currentMonth, "month")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(today.format("YYYY-MM-DD"));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(null);
    }
  }, [currentMonth]);

  // 月の最初の日を取得
  const monthStart = currentMonth.startOf("month");
  // 月の最後の日を取得
  const monthEnd = currentMonth.endOf("month");
  // 前月の末日から必要な日数を取得
  const startDate = monthStart.subtract(monthStart.day(), "day");
  // 次月の初日まで続ける
  const endDate = monthEnd.add(6 - monthEnd.day(), "day");

  // 勤怠データを日付でマッピング
  const attendanceMap = new Map<string, Attendance>();
  attendances.forEach((a) => {
    const dateKey = dayjs(a.workDate).format("YYYY-MM-DD");
    attendanceMap.set(dateKey, a);
  });

  // デバッグ：attendancesのデータを確認
  if (process.env.NODE_ENV === "development") {
    const today = dayjs().format("YYYY-MM-DD");
    const todayData = attendanceMap.get(today);
    const attendanceDates = Array.from(attendanceMap.keys()).toSorted();
    console.log(
      `[MobileCalendar] currentMonth=${currentMonth.format(
        "YYYY-MM-DD"
      )}, today=${today}, attendanceDates=${
        attendanceDates.length
      }件, todayData=${todayData ? "○" : "✗"}`,
      {
        attendanceDates: attendanceDates.slice(0, 10),
        todayData,
      }
    );
  }

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
    () => resolveMonthlyTerms(currentMonth, closeDates ?? [], termPalette),
    [closeDates, currentMonth, termPalette]
  );

  // カレンダーの日付配列を生成
  const days: { date: Dayjs; isCurrentMonth: boolean }[] = [];
  let current = startDate.clone();
  while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
    days.push({
      date: current.clone(),
      isCurrentMonth: current.isSame(monthStart, "month"),
    });
    current = current.add(1, "day");
  }

  const handleDateClick = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    setSelectedDate(selectedDate === dateKey ? null : dateKey);
  };

  const handleEdit = (date: string) => {
    const dateStr = dayjs(date).format(AttendanceDate.QueryParamFormat);
    const path = buildNavigatePath
      ? buildNavigatePath(dateStr)
      : `/attendance/${dateStr}/edit`;
    navigate(path);
  };

  // 祝祭日判定のヘルパー関数
  const getHolidayInfo = (date: Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");

    // 国民の祝日
    const holiday = holidayCalendars.find((h) => h.holidayDate === dateStr);
    if (holiday) {
      return { name: holiday.name || "祝日", type: "holiday" as const };
    }

    // 会社休日
    const companyHoliday = companyHolidayCalendars.find(
      (h) => h.holidayDate === dateStr
    );
    if (companyHoliday) {
      return {
        name: companyHoliday.name || "会社休日",
        type: "company" as const,
      };
    }

    return null;
  };

  const selectedAttendance = selectedDate
    ? attendanceMap.get(selectedDate)
    : null;
  const selectedDateStatus = selectedDate
    ? getStatus(
        selectedAttendance ?? undefined,
        staff,
        holidayCalendars,
        companyHolidayCalendars,
        dayjs(selectedDate)
      )
    : AttendanceStatus.None;

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <CalendarContainer>
      {/* 月の移動ヘッダー */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <IconButton
          size="small"
          onClick={() => onMonthChange?.(currentMonth.subtract(1, "month"))}
          aria-label="前月"
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {currentMonth.format("YYYY年M月")}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = dayjs();
              onMonthChange?.(today);
            }}
            sx={{ fontSize: "0.75rem", py: 0.5, px: 1 }}
          >
            今日
          </Button>
          <IconButton
            size="small"
            onClick={() => onMonthChange?.(currentMonth.add(1, "month"))}
            aria-label="次月"
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      {monthlyTerms.length > 0 && (
        <Stack
          direction="row"
          spacing={0.5}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 0.5 }}
        >
          {monthlyTerms.map((term, index) => (
            <Chip
              key={`${term.label}-${index}`}
              size="small"
              label={term.label}
              sx={{
                bgcolor: alpha(term.color, 0.1),
                color: term.color,
                borderColor: alpha(term.color, 0.4),
                borderStyle: "solid",
                borderWidth: 1,
                fontSize: "0.625rem",
                height: 22,
              }}
            />
          ))}
        </Stack>
      )}

      <DayOfWeekHeader>
        {weekDays.map((day, index) => (
          <DayOfWeekCell key={`dow-${index}`}>{day}</DayOfWeekCell>
        ))}
      </DayOfWeekHeader>

      <CalendarGrid>
        {days.map((day, index) => {
          const dateKey = day.date.format("YYYY-MM-DD");
          const attendance = attendanceMap.get(dateKey);
          const holidayInfo = getHolidayInfo(day.date);

          const status = getStatus(
            attendance,
            staff,
            holidayCalendars,
            companyHolidayCalendars,
            day.date
          );
          const hasError =
            (Array.isArray(attendance?.systemComments) &&
              attendance.systemComments.length > 0) ||
            status === AttendanceStatus.Error ||
            status === AttendanceStatus.Late;

          const isWeekend = [0, 6].includes(day.date.day());
          const holidayLike = isHolidayLike(
            day.date,
            staff,
            holidayCalendars,
            companyHolidayCalendars
          );
          const termsForDay = monthlyTerms.filter(
            (term) =>
              !day.date.isBefore(term.start, "day") &&
              !day.date.isAfter(term.end, "day")
          );
          const allowTermHighlight =
            staff?.workType === "shift" ? true : !holidayLike && !isWeekend;
          const primaryTerm = allowTermHighlight ? termsForDay[0] : undefined;
          const termColor = primaryTerm?.color;

          return (
            <CalendarDayCell
              key={`day-${index}`}
              isCurrentMonth={day.isCurrentMonth}
              hasError={hasError}
              status={status}
              isSelected={selectedDate === dateKey}
              termColor={termColor}
              onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
            >
              <Stack spacing={0.25} sx={{ height: "100%" }}>
                <DayNumber>{day.date.format("D")}</DayNumber>
                {status !== undefined && status !== AttendanceStatus.None && (
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: "bold",
                      color: statusTextColorMap[status] ?? "text.secondary",
                      lineHeight: 1.1,
                    }}
                  >
                    {statusLabelMap[status]}
                  </Typography>
                )}
                {holidayInfo && <HolidayName>{holidayInfo.name}</HolidayName>}
              </Stack>
            </CalendarDayCell>
          );
        })}
      </CalendarGrid>

      {selectedDate && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {dayjs(selectedDate).format("M月D日(ddd)")} の詳細
              </Typography>
              <Box
                component="span"
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor:
                    selectedDateStatus === AttendanceStatus.Error
                      ? "error.light"
                      : selectedDateStatus === AttendanceStatus.Late
                      ? "warning.light"
                      : selectedDateStatus === AttendanceStatus.Ok
                      ? "success.light"
                      : "grey.200",
                  color:
                    selectedDateStatus === AttendanceStatus.Error
                      ? "error.dark"
                      : selectedDateStatus === AttendanceStatus.Late
                      ? "warning.dark"
                      : selectedDateStatus === AttendanceStatus.Ok
                      ? "success.dark"
                      : "text.secondary",
                }}
              >
                {selectedDateStatus === AttendanceStatus.Error
                  ? "エラー"
                  : selectedDateStatus === AttendanceStatus.Late
                  ? "遅刻"
                  : selectedDateStatus === AttendanceStatus.Ok
                  ? "正常"
                  : "未入力"}
              </Box>
            </Stack>

            <Stack spacing={1}>
              {(() => {
                const holidayInfo = getHolidayInfo(dayjs(selectedDate));
                if (holidayInfo) {
                  return (
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor:
                          holidayInfo.type === "holiday"
                            ? "#ffebee"
                            : "#e3f2fd",
                        border: "1px solid",
                        borderColor:
                          holidayInfo.type === "holiday"
                            ? "#ef5350"
                            : "#42a5f5",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color:
                            holidayInfo.type === "holiday"
                              ? "#d32f2f"
                              : "#1976d2",
                        }}
                      >
                        {holidayInfo.type === "holiday"
                          ? "国民の祝日"
                          : "会社休日"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            holidayInfo.type === "holiday"
                              ? "#d32f2f"
                              : "#1976d2",
                        }}
                      >
                        {holidayInfo.name}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })()}

              {!selectedAttendance &&
                dayjs(selectedDate).isSame(dayjs(), "day") && (
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: "#fff3cd",
                      border: "1px solid",
                      borderColor: "#ffc107",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#856404", fontWeight: 500 }}
                    >
                      本日の勤務データはまだ記録されていません
                    </Typography>
                  </Box>
                )}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  勤務時間
                </Typography>
                <Typography variant="body2">
                  {selectedAttendance?.startTime && selectedAttendance?.endTime
                    ? `${dayjs(selectedAttendance.startTime).format(
                        "HH:mm"
                      )} - ${dayjs(selectedAttendance.endTime).format("HH:mm")}`
                    : "未入力"}
                </Typography>
              </Box>

              {selectedAttendance?.rests &&
                selectedAttendance.rests.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      休憩時間
                    </Typography>
                    {selectedAttendance.rests
                      .filter(
                        (rest): rest is NonNullable<typeof rest> => !!rest
                      )
                      .map((rest, idx) => (
                        <Typography key={idx} variant="body2">
                          {rest.startTime && rest.endTime
                            ? `${dayjs(rest.startTime).format(
                                "HH:mm"
                              )} - ${dayjs(rest.endTime).format("HH:mm")}`
                            : "-"}
                        </Typography>
                      ))}
                  </Box>
                )}

              {(selectedAttendance?.paidHolidayFlag ||
                selectedAttendance?.specialHolidayFlag ||
                selectedAttendance?.absentFlag ||
                selectedAttendance?.substituteHolidayDate) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    摘要
                  </Typography>
                  <Typography variant="body2">
                    {selectedAttendance?.paidHolidayFlag && "有給休暇"}
                    {selectedAttendance?.specialHolidayFlag && "特別休暇"}
                    {selectedAttendance?.absentFlag && "欠勤"}
                    {selectedAttendance?.substituteHolidayDate &&
                      `振替休日 (${dayjs(
                        selectedAttendance.substituteHolidayDate
                      ).format("M/D")})`}
                  </Typography>
                </Box>
              )}

              {selectedAttendance?.systemComments &&
                selectedAttendance.systemComments.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="error">
                      システムコメント
                    </Typography>
                    {selectedAttendance.systemComments
                      .filter(
                        (comment): comment is NonNullable<typeof comment> =>
                          !!comment
                      )
                      .map((comment, idx) => (
                        <Typography key={idx} variant="body2" color="error">
                          {comment.comment}
                        </Typography>
                      ))}
                  </Box>
                )}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Box
                component="button"
                onClick={() => handleEdit(selectedDate)}
                sx={{
                  flex: 1,
                  py: 1,
                  px: 2,
                  border: "1px solid",
                  borderColor: "primary.main",
                  borderRadius: 1,
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                編集
              </Box>
              <Box
                component="button"
                onClick={() => setSelectedDate(null)}
                sx={{
                  flex: 1,
                  py: 1,
                  px: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  color: "text.primary",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                閉じる
              </Box>
            </Stack>
          </Stack>
        </Box>
      )}
    </CalendarContainer>
  );
}
