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
  Stack,
  TableCell as MuiTableCell,
  TableCell,
  TableRow,
} from "@mui/material";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { AttendanceStatusTooltip } from "../AttendanceStatusTooltip";

const MONTH_QUERY_KEY = "month";

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
      AttendanceDate.QueryParamFormat,
    );
    const monthQuery = new URLSearchParams({
      [MONTH_QUERY_KEY]: dayjs(workDate).startOf("month").format("YYYY-MM"),
    }).toString();
    navigate(`/attendance/${formattedWorkDate}/edit?${monthQuery}`);
  };

  const rowVariant: AttendanceRowVariant = (() => {
    if (staff?.workType === "shift" && attendance.isDeemedHoliday) {
      return "sunday";
    }
    if (staff?.workType === "shift") {
      return "default";
    }
    return getAttendanceRowVariant(
      attendance,
      holidayCalendars,
      companyHolidayCalendars,
    );
  })();

  return (
    <TableRow sx={attendanceRowVariantStyles[rowVariant]}>
      <MuiTableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <AttendanceStatusTooltip
            staff={staff}
            attendance={attendance}
            holidayCalendars={holidayCalendars}
            companyHolidayCalendars={companyHolidayCalendars}
          />
          <AppIconButton onClick={handleEdit} aria-label="編集" size="sm">
            <EditIcon fontSize="small" />
          </AppIconButton>
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
        substituteHolidayDate={attendance.substituteHolidayDate}
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
}
