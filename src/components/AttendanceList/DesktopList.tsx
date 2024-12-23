import { TableHead } from "@aws-amplify/ui-react";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  IconButton,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import { NavigateFunction } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { getTableRowClassName } from "@/pages/admin/AdminStaffAttendanceList/AdminStaffAttendanceList";
import { AttendanceGraph } from "@/pages/admin/AdminStaffAttendanceList/AttendanceGraph";
import { CreatedAtTableCell } from "@/pages/admin/AdminStaffAttendanceList/CreatedAtTableCell";
import { RestTimeTableCell } from "@/pages/admin/AdminStaffAttendanceList/RestTimeTableCell";
import { SummaryTableCell } from "@/pages/admin/AdminStaffAttendanceList/SummaryTableCell";
import { UpdatedAtTableCell } from "@/pages/admin/AdminStaffAttendanceList/UpdatedAtTableCell";
import { WorkDateTableCell } from "@/pages/admin/AdminStaffAttendanceList/WorkDateTableCell";
import { WorkTimeTableCell } from "@/pages/admin/AdminStaffAttendanceList/WorkTimeTableCell";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "../../API";
import { AttendanceStatusTooltip } from "./AttendanceStatusTooltip";

const DesktopBox = styled(Box)(({ theme }) => ({
  padding: "0px 40px 40px 40px",
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
}: {
  attendances: Attendance[];
  staff: Staff | null | undefined;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  navigate: NavigateFunction;
}) {
  const handleEdit = (attendance: Attendance) => {
    const { workDate } = attendance;
    const formattedWorkDate = dayjs(workDate).format(
      AttendanceDate.QueryParamFormat
    );
    navigate(`/attendance/${formattedWorkDate}/edit`);
  };
  return (
    <DesktopBox>
      <AttendanceGraph attendances={attendances} />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell sx={{ whiteSpace: "nowrap" }}>勤務日</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>勤務時間</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                休憩時間(直近)
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>摘要</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>作成日時</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>更新日時</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {attendances.map((attendance, index) => (
              <TableRow
                key={index}
                className={getTableRowClassName(
                  attendance,
                  holidayCalendars,
                  companyHolidayCalendars
                )}
              >
                <TableCell>
                  <Stack direction="row" spacing={0} alignItems="center">
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
                  paidHolidayFlag={attendance.paidHolidayFlag}
                  substituteHolidayDate={attendance.substituteHolidayDate}
                  remarks={attendance.remarks}
                />

                {/* 作成日時 */}
                <CreatedAtTableCell createdAt={attendance.createdAt} />

                {/* 更新日時 */}
                <UpdatedAtTableCell updatedAt={attendance.updatedAt} />

                <TableCell sx={{ width: 1 }} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DesktopBox>
  );
}
