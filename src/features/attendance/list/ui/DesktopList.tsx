import { TableHead } from "@aws-amplify/ui-react";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
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
import {
  AttendanceState,
  AttendanceStatus,
} from "@/entities/attendance/lib/AttendanceState";
import { AttendanceGraph } from "@/entities/attendance/ui/adminStaffAttendance/AttendanceGraph";
import { CreatedAtTableCell } from "@/entities/attendance/ui/adminStaffAttendance/CreatedAtTableCell";
import { RestTimeTableCell } from "@/entities/attendance/ui/adminStaffAttendance/RestTimeTableCell";
import { SummaryTableCell } from "@/entities/attendance/ui/adminStaffAttendance/SummaryTableCell";
import { UpdatedAtTableCell } from "@/entities/attendance/ui/adminStaffAttendance/UpdatedAtTableCell";
import { WorkDateTableCell } from "@/entities/attendance/ui/adminStaffAttendance/WorkDateTableCell";
import { WorkTimeTableCell } from "@/entities/attendance/ui/adminStaffAttendance/WorkTimeTableCell";
import {
  AttendanceRowVariant,
  attendanceRowVariantStyles,
  getAttendanceRowVariant,
} from "@/entities/attendance/ui/rowVariant";

import { AttendanceStatusTooltip } from "./AttendanceStatusTooltip";
import DesktopCalendarView from "./DesktopCalendarView";

const DesktopBox = styled(Box)(({ theme }) => ({
  padding: "0px 40px 40px 40px",
  [theme.breakpoints.down("lg")]: {
    padding: "0px 24px 32px 24px",
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export default function DesktopList({
  attendances,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
  navigate,
  closeDates,
  closeDatesLoading,
  closeDatesError,
  currentMonth: externalCurrentMonth,
  onMonthChange,
}: {
  attendances: Attendance[];
  staff: Staff | null | undefined;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  navigate: NavigateFunction;
  closeDates?: CloseDate[];
  closeDatesLoading?: boolean;
  closeDatesError?: Error | null;
  currentMonth?: Dayjs;
  onMonthChange?: (nextMonth: Dayjs) => void;
}) {
  const [internalMonth, setInternalMonth] = useState(() =>
    dayjs().startOf("month"),
  );
  const currentMonth = externalCurrentMonth ?? internalMonth;

  const handleMonthChange = (updater: (prev: Dayjs) => Dayjs) => {
    const nextMonth = updater(currentMonth);
    if (onMonthChange) {
      onMonthChange(nextMonth);
      return;
    }
    setInternalMonth(nextMonth);
  };

  const monthlyAttendances = useMemo(() => {
    return attendances
      .filter((attendance) =>
        attendance.workDate
          ? dayjs(attendance.workDate).isSame(currentMonth, "month")
          : false,
      )
      .toSorted((a, b) => {
        const aValue = a.workDate ? dayjs(a.workDate).valueOf() : 0;
        const bValue = b.workDate ? dayjs(b.workDate).valueOf() : 0;
        return aValue - bValue;
      });
  }, [attendances, currentMonth]);

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
    navigate(`/attendance/${formattedWorkDate}/edit`);
  };

  const errorAttendances = (() => {
    if (!staff) return [] as Attendance[];
    return attendances.filter((a) => {
      const hasSystemComment =
        Array.isArray(a.systemComments) && a.systemComments.length > 0;
      if (hasSystemComment) return true;
      const status = new AttendanceState(
        staff,
        a,
        holidayCalendars,
        companyHolidayCalendars,
      ).get();
      return (
        status === AttendanceStatus.Error || status === AttendanceStatus.Late
      );
    });
  })();
  return (
    <DesktopBox>
      {errorAttendances.length > 0 && (
        <Box sx={{ pb: 2, pt: 2 }}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              backgroundColor: "background.paper",
            }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>
              打刻エラー一覧 ({errorAttendances.length})
            </Typography>
            <Alert severity="warning">
              <AlertTitle sx={{ fontWeight: "bold" }}>
                確認してください
              </AlertTitle>
              打刻エラーがあります
            </Alert>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ whiteSpace: "nowrap" }}>勤務日</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      勤務時間
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      休憩時間(直近)
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>摘要</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      作成日時
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
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
                            <IconButton onClick={() => handleEdit(attendance)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
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
      <DesktopCalendarView
        attendances={attendances}
        staff={staff}
        holidayCalendars={holidayCalendars}
        companyHolidayCalendars={companyHolidayCalendars}
        navigate={navigate}
        closeDates={closeDates}
        closeDatesLoading={closeDatesLoading}
        closeDatesError={closeDatesError}
        currentMonth={currentMonth}
        onMonthChange={(nextMonth) => handleMonthChange(() => nextMonth)}
      />
      <Box sx={{ mt: 3 }}>
        <AttendanceGraph
          attendances={monthlyAttendances}
          month={currentMonth}
        />
      </Box>
    </DesktopBox>
  );
}
