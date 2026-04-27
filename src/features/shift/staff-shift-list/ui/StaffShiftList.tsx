import { AuthContext } from "@app/providers/auth/AuthContext";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import {
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAppNotification } from "@shared/lib/useAppNotification";
import CommonBreadcrumbs from "@shared/ui/breadcrumbs/CommonBreadcrumbs";
import { ProgressBar } from "@shared/ui/feedback";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

export default function StaffShiftList() {
  const { notify } = useAppNotification();
  const { staffId } = useParams();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });

  const staff = staffs.find((s) => String(s.id) === String(staffId));

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const monthStart = currentMonth.startOf("month");
  const daysInMonth = monthStart.daysInMonth();
  const monthYear = monthStart.year();
  const monthMonth = monthStart.month();

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }).map((_, i) =>
        monthStart.add(i, "day"),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthYear, monthMonth, daysInMonth],
  );

  const {
    holidayCalendars,
    companyHolidayCalendars,
    isLoading: calendarLoading,
    error: calendarsError,
  } = useCalendars();

  useEffect(() => {
    if (calendarsError) {
      console.error(calendarsError);
      notify({
        title: "エラー",
        description: MESSAGE_CODE.E00001,
        tone: "error",
        dedupeKey: "holiday-calendar-error",
      });
    }
  }, [calendarsError, notify]);

  const publicHolidaySet = useMemo(
    () => new Set(holidayCalendars.map((h) => h.holidayDate)),
    [holidayCalendars],
  );

  const companyHolidaySet = useMemo(
    () => new Set(companyHolidayCalendars.map((h) => h.holidayDate)),
    [companyHolidayCalendars],
  );

  // モックデータ: 未登録 / 出勤 / 休み を表示・編集できるよう state にする
  const [shifts, setShifts] = useState<
    Record<string, "work" | "off" | undefined>
  >(() => {
    const map: Record<string, "work" | "off" | undefined> = {};
    days.forEach((d) => {
      const r = Math.random();
      if (r < 0.2)
        map[d.format("YYYY-MM-DD")] = undefined; // 未登録
      else map[d.format("YYYY-MM-DD")] = r > 0.6 ? "work" : "off";
    });
    return map;
  });

  // 月が切り替わったらモックデータを再生成する
  useEffect(() => {
    const map: Record<string, "work" | "off" | undefined> = {};
    days.forEach((d) => {
      const r = Math.random();
      if (r < 0.2) map[d.format("YYYY-MM-DD")] = undefined;
      else map[d.format("YYYY-MM-DD")] = r > 0.6 ? "work" : "off";
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShifts(map);
  }, [monthStart.year(), monthStart.month(), daysInMonth]);

  const handleShiftChange = (key: string, value: string | null) => {
    setShifts((prev) => ({
      ...prev,
      [key]: value === "work" ? "work" : value === "off" ? "off" : undefined,
    }));
  };

  const prevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((m) => m.add(1, "month"));

  if (calendarLoading) {
    return <ProgressBar className="w-full" />;
  }

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ mb: 2 }}>
        <CommonBreadcrumbs
          items={[
            { label: "TOP", href: "/" },
            { label: "シフト管理", href: "/admin/shift" },
          ]}
          current={"シフト詳細"}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5">
          {staff
            ? `${staff.familyName} ${staff.givenName} のシフト`
            : "スタッフが見つかりません"}
        </Typography>
        <Box>
          <Chip label="前月" onClick={prevMonth} sx={{ mr: 1 }} clickable />
          <Chip label={monthStart.format("YYYY年 M月")} sx={{ mr: 1 }} />
          <Chip label="翌月" onClick={nextMonth} clickable />
        </Box>
      </Box>

      {staff && (
        <Paper
          elevation={2}
          sx={{
            overflow: "auto",
            borderRadius: 2,
            p: 1,
            bgcolor: "background.paper",
          }}
        >
          <Table size="small" sx={{ minWidth: 320 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 260,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1,
                  }}
                >
                  日付
                </TableCell>
                <TableCell
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1,
                  }}
                  align="right"
                >
                  状態
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {days.map((d) => {
                const key = d.format("YYYY-MM-DD");
                const state = shifts[key];
                const isSunday = d.day() === 0;
                const isSaturday = d.day() === 6;
                const isCompanyHoliday = companyHolidaySet.has(key);
                const isPublicHoliday = publicHolidaySet.has(key);

                // 勤怠一覧のスタイルに合わせる:
                // today -> #FFFF93, saturday -> #93FFFF, sunday/holiday -> #FF9393
                const todayKey = dayjs().format("YYYY-MM-DD");

                let rowBg = "transparent";
                let rowFontWeight: number | undefined = undefined;

                // 管理画面の判定を踏襲: shift 勤務タイプの場合は色付けしない
                if (staff?.workType === "shift") {
                  rowBg = "transparent";
                } else if (key === todayKey) {
                  rowBg = "#FFFF93"; // today
                  rowFontWeight = 700;
                } else if (isPublicHoliday || isCompanyHoliday) {
                  rowBg = "#FF9393"; // holiday -> use sunday color
                } else if (isSunday) {
                  rowBg = "#FF9393"; // sunday
                } else if (isSaturday) {
                  rowBg = "#93FFFF"; // saturday
                }

                return (
                  <TableRow
                    key={key}
                    sx={{
                      alignItems: "center",
                      bgcolor: rowBg,
                      fontWeight: rowFontWeight,
                    }}
                  >
                    <TableCell
                      sx={{
                        pr: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Tooltip title={key}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            <CalendarTodayIcon
                              sx={{ mr: 1 }}
                              fontSize="small"
                            />
                            <Box
                              sx={{ display: "flex", flexDirection: "column" }}
                            >
                              <Typography sx={{ fontWeight: 600 }}>
                                {d.format("M月D日")}
                              </Typography>
                              <Typography
                                sx={{ fontSize: 12, color: "text.secondary" }}
                              >
                                {d.format("dddd")}
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>

                        {(isPublicHoliday || isCompanyHoliday) && (
                          <Chip
                            label={isPublicHoliday ? "祝日" : "会社休日"}
                            color="error"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <ToggleButtonGroup
                          value={state ?? ""}
                          exclusive
                          size="small"
                          onChange={(_, val) => handleShiftChange(key, val)}
                        >
                          <ToggleButton value="">未登録</ToggleButton>
                          <ToggleButton value="work">出勤</ToggleButton>
                          <ToggleButton value="off">休み</ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
