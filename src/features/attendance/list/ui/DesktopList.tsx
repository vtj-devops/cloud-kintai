import { TableHead } from "@aws-amplify/ui-react";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { CreatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/CreatedAtTableCell";
import { RestTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/RestTimeTableCell";
import { SummaryTableCell } from "@entities/attendance/ui/adminStaffAttendance/SummaryTableCell";
import { UpdatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/UpdatedAtTableCell";
import { WorkDateTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkDateTableCell";
import { WorkTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkTimeTableCell";
import {
  AttendanceRowVariant,
  attendanceRowVariantStyles,
  getAttendanceRowVariant,
} from "@entities/attendance/ui/rowVariant";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  AlertTitle,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";

import { useAttendanceListContext } from "./AttendanceListContext";
import { MONTH_QUERY_KEY } from "./attendanceListUtils";
import { AttendanceStatusTooltip } from "./AttendanceStatusTooltip";
import DesktopCalendarView from "./DesktopCalendarView";
import { useErrorAttendances } from "./useErrorAttendances";

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
    const monthQuery = new URLSearchParams({
      [MONTH_QUERY_KEY]: currentMonth.startOf("month").format("YYYY-MM"),
    }).toString();
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
                  {errorAttendances.map((attendance, index) => {
                    const rowVariant = getRowVariant(attendance);
                    return (
                      <TableRow
                        key={`error-${index}`}
                        sx={attendanceRowVariantStyles[rowVariant]}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0}
                            alignItems="center"
                          >
                            <AttendanceStatusTooltip
                              staff={staff}
                              attendance={attendance}
                              holidayCalendars={holidayCalendars}
                              companyHolidayCalendars={companyHolidayCalendars}
                            />
                            <AppIconButton onClick={() => handleEdit(attendance)} aria-label="編集" size="sm">
                              <EditIcon fontSize="small" />
                            </AppIconButton>
                          </Stack>
                        </TableCell>

                        {/* 勤務日 */}
                        <WorkDateTableCell
                          workDate={attendance.workDate}
                          holidayCalendars={holidayCalendars}
                          companyHolidayCalendars={companyHolidayCalendars}
                        />

                        {/* 勤務時間 */}
                        <WorkTimeTableCell attendance={attendance} />

                        {/* 休憩時間(最近) */}
                        <RestTimeTableCell attendance={attendance} />

                        {/* 摘要 */}
                        <SummaryTableCell
                          substituteHolidayDate={
                            attendance.substituteHolidayDate
                          }
                          specialHolidayFlag={attendance.specialHolidayFlag}
                          paidHolidayFlag={attendance.paidHolidayFlag}
                          absentFlag={attendance.absentFlag}
                        />

                        {/* 作成日時 */}
                        <CreatedAtTableCell createdAt={attendance.createdAt} />

                        {/* 更新日時 */}
                        <UpdatedAtTableCell updatedAt={attendance.updatedAt} />

                        <TableCell sx={{ width: 1 }} />
                      </TableRow>
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
