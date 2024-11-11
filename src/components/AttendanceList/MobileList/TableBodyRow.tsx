import EditIcon from "@mui/icons-material/Edit";
import {
  IconButton,
  Stack,
  TableCell as MuiTableCell,
  TableCell,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@/API";
import { AttendanceDate } from "@/lib/AttendanceDate";
import { getTableRowClassName } from "@/pages/admin/AdminStaffAttendanceList/AdminStaffAttendanceList";
import { CreatedAtTableCell } from "@/pages/admin/AdminStaffAttendanceList/CreatedAtTableCell";
import { RestTimeTableCell } from "@/pages/admin/AdminStaffAttendanceList/RestTimeTableCell";
import { SummaryTableCell } from "@/pages/admin/AdminStaffAttendanceList/SummaryTableCell";
import { UpdatedAtTableCell } from "@/pages/admin/AdminStaffAttendanceList/UpdatedAtTableCell";
import { WorkDateTableCell } from "@/pages/admin/AdminStaffAttendanceList/WorkDateTableCell";
import { WorkTimeTableCell } from "@/pages/admin/AdminStaffAttendanceList/WorkTimeTableCell";

import { AttendanceStatusTooltip } from "../AttendanceStatusTooltip";

export default function TableBodyRow({
  attendance,
  holidayCalendars,
  companyHolidayCalendars,
  staff,
}: {
  attendance: Attendance;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  staff: Staff | null | undefined;
}) {
  const navigate = useNavigate();

  const handleEdit = () => {
    const { workDate } = attendance;
    const formattedWorkDate = dayjs(workDate).format(
      AttendanceDate.QueryParamFormat
    );
    navigate(`/attendance/${formattedWorkDate}/edit`);
  };

  return (
    <TableRow
      className={getTableRowClassName(
        attendance,
        holidayCalendars,
        companyHolidayCalendars
      )}
    >
      <MuiTableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <AttendanceStatusTooltip
            staff={staff}
            attendance={attendance}
            holidayCalendars={holidayCalendars}
            companyHolidayCalendars={companyHolidayCalendars}
          />
          <IconButton onClick={handleEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
      </MuiTableCell>
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
  );
}
