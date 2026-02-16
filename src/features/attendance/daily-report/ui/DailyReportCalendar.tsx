import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import {
  PickersDay,
  type PickersDayProps,
} from "@mui/x-date-pickers/PickersDay";
import { type Dayjs } from "dayjs";
import { useMemo } from "react";

export type DailyReportCalendarProps = {
  value: Dayjs;
  reportedDateSet: Set<string>;
  isLoadingReports: boolean;
  hasReports: boolean;
  onChange: (value: Dayjs | null) => void;
};

export function DailyReportCalendar({
  value,
  reportedDateSet,
  isLoadingReports,
  hasReports,
  onChange,
}: DailyReportCalendarProps) {
  const CalendarDay = useMemo(
    () =>
      function CalendarDay(dayProps: PickersDayProps) {
        const { day, outsideCurrentMonth, selected, ...other } = dayProps;
        const typedDay = day as Dayjs;
        const dateKey = typedDay.format("YYYY-MM-DD");
        const hasReport = reportedDateSet.has(dateKey);

        return (
          <PickersDay
            {...other}
            day={typedDay}
            outsideCurrentMonth={outsideCurrentMonth}
            selected={selected}
            sx={(theme) => {
              const baseStyle = { borderRadius: 2 };
              if (selected || outsideCurrentMonth) {
                return baseStyle;
              }
              if (hasReport) {
                return {
                  ...baseStyle,
                  bgcolor: alpha(theme.palette.success.main, 0.4),
                  color: theme.palette.success.contrastText,
                  "&:hover, &:focus": {
                    bgcolor: alpha(theme.palette.success.main, 0.6),
                  },
                };
              }
              return baseStyle;
            }}
          />
        );
      },
    [reportedDateSet],
  );

  return (
    <Paper variant="outlined" sx={{ height: "100%", overflow: "hidden" }}>
      <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
          <DateCalendar
            value={value}
            onChange={onChange}
            reduceAnimations
            slots={{ day: CalendarDay }}
            sx={{
              minWidth: 0,
              width: "100%",
              maxWidth: 360,
              mx: "auto",
              ".MuiDayCalendar-header": {
                justifyContent: "space-between",
              },
              ".MuiDayCalendar-weekContainer": {
                justifyContent: "space-between",
                margin: 0,
              },
              ".MuiDayCalendar-weekDayLabel": {
                width: "clamp(28px, 9.5vw, 36px)",
                height: "clamp(28px, 9.5vw, 36px)",
                margin: 0,
                fontSize: "clamp(0.7rem, 2.6vw, 0.85rem)",
              },
              ".MuiPickersDay-root": {
                width: "clamp(28px, 9.5vw, 36px)",
                height: "clamp(28px, 9.5vw, 36px)",
                margin: 0,
                fontSize: "clamp(0.75rem, 2.8vw, 0.9rem)",
              },
              ".MuiPickersCalendarHeader-root": {
                px: 0.5,
              },
              ".MuiPickersCalendarHeader-label": {
                fontSize: "clamp(0.9rem, 3.4vw, 1.05rem)",
              },
              ".MuiPickersArrowSwitcher-root": {
                ml: 0,
              },
            }}
          />
        </LocalizationProvider>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.5 }}
        >
          カレンダーの日付を選択すると該当日の日報を確認・作成できます。
        </Typography>
        {isLoadingReports && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            日報を読み込み中です…
          </Typography>
        )}
        {!isLoadingReports && !hasReports && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            まだ日報がありません。カレンダーから日付を選択して作成してください。
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
