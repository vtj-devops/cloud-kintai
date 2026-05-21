import { TableHead } from "@aws-amplify/ui-react";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceRecordTableRow } from "@entities/attendance/ui/adminStaffAttendance/AttendanceRecordTableRow";
import {
  AttendanceRowVariant,
  getAttendanceRowVariant,
} from "@entities/attendance/ui/rowVariant";
import { AttendanceRecordActionCell } from "@features/attendance/list/ui/AttendanceRecordActionCell";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  AlertTitle,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { createMonthSearchParamsFromDate } from "@shared/lib/monthQuery";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { useAttendanceListContext } from "./AttendanceListContext";
import DesktopCalendarView from "./DesktopCalendarView";
import { useErrorAttendances } from "./useErrorAttendances";

const MAX_VISIBLE_ERROR_ATTENDANCES = 5;

export default function DesktopList() {
  const {
    attendances,
    staff,
    holidayCalendars,
    companyHolidayCalendars,
    navigate,
    currentMonth,
    effectiveDateRange,
  } = useAttendanceListContext();

  const errorAttendances = useErrorAttendances({
    staff,
    attendances,
    holidayCalendars,
    companyHolidayCalendars,
    effectiveDateRange,
  });
  const [isErrorListExpanded, setIsErrorListExpanded] = useState(false);

  const hasHiddenErrorAttendances =
    errorAttendances.length > MAX_VISIBLE_ERROR_ATTENDANCES;
  const visibleErrorAttendances = useMemo(
    () =>
      hasHiddenErrorAttendances && !isErrorListExpanded
        ? errorAttendances.slice(0, MAX_VISIBLE_ERROR_ATTENDANCES)
        : errorAttendances,
    [errorAttendances, hasHiddenErrorAttendances, isErrorListExpanded],
  );
  const hiddenErrorAttendanceCount =
    errorAttendances.length - MAX_VISIBLE_ERROR_ATTENDANCES;

  const getRowVariant = (attendance: Attendance): AttendanceRowVariant => {
    if (staff?.workType === "shift" && attendance.isDeemedHoliday) {
      return "sunday";
    }

    // シフト勤務のスタッフは土日祝の色付けをしない
    if (staff?.workType === "shift") {
      return "default";
    }

    return getAttendanceRowVariant(
      attendance,
      holidayCalendars,
      companyHolidayCalendars,
    );
  };
  const handleEdit = (attendance: Attendance) => {
    const { workDate } = attendance;
    const formattedWorkDate = dayjs(workDate).format(
      AttendanceDate.QueryParamFormat,
    );
    navigate(buildNavigatePath(formattedWorkDate));
  };

  const buildNavigatePath = (formattedWorkDate: string) => {
    const monthQuery = createMonthSearchParamsFromDate(currentMonth).toString();
    return `/attendance/${formattedWorkDate}/edit?${monthQuery}`;
  };

  return (
    <div className="hidden md:block">
      {errorAttendances.length > 0 && (
        <Box sx={{ pb: 3 }}>
          <Box
            sx={{
              border: "1px solid rgba(245, 158, 11, 0.22)",
              borderRadius: "24px",
              p: 3,
              background:
                "linear-gradient(180deg, rgba(255,251,235,0.92) 0%, rgba(255,255,255,0.96) 100%)",
              boxShadow: "0 24px 54px -40px rgba(15,23,42,0.32)",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                mb: 1,
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              打刻エラー一覧 ({errorAttendances.length})
            </Typography>
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: "18px",
                border: "1px solid rgba(245, 158, 11, 0.18)",
                bgcolor: "rgba(255,255,255,0.88)",
              }}
            >
              <AlertTitle sx={{ fontWeight: "bold" }}>
                確認してください
              </AlertTitle>
              打刻エラーがあります
            </Alert>
            {hasHiddenErrorAttendances && (
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <AppButton
                  variant="outline"
                  tone="neutral"
                  size="sm"
                  aria-expanded={isErrorListExpanded}
                  onClick={() => setIsErrorListExpanded((current) => !current)}
                  endIcon={
                    isErrorListExpanded ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )
                  }
                >
                  {isErrorListExpanded
                    ? "5件表示に戻す"
                    : `残り${hiddenErrorAttendanceCount}件を表示`}
                </AppButton>
              </Box>
            )}
            <TableContainer
              sx={{
                borderRadius: "18px",
                border: "1px solid rgba(148, 163, 184, 0.16)",
                bgcolor: "rgba(255,255,255,0.9)",
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#64748b", fontWeight: 700 }} />
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      勤務日
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      勤務時間
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      休憩時間(直近)
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      摘要
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      作成日時
                    </TableCell>
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      更新日時
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleErrorAttendances.map((attendance, index) => {
                    const rowVariant = getRowVariant(attendance);
                    return (
                      <AttendanceRecordTableRow
                        key={`error-${index}`}
                        attendance={attendance}
                        rowVariant={rowVariant}
                        holidayCalendars={holidayCalendars}
                        companyHolidayCalendars={companyHolidayCalendars}
                        actionCell={
                          <AttendanceRecordActionCell
                            staff={staff}
                            attendance={attendance}
                            holidayCalendars={holidayCalendars}
                            companyHolidayCalendars={companyHolidayCalendars}
                            onEdit={() => handleEdit(attendance)}
                            spacing={0}
                          />
                        }
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
      <DesktopCalendarView buildNavigatePath={buildNavigatePath} />
    </div>
  );
}
