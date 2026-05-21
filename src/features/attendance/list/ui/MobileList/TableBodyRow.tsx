import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceRecordTableRow } from "@entities/attendance/ui/adminStaffAttendance/AttendanceRecordTableRow";
import {
  AttendanceRowVariant,
  getAttendanceRowVariant,
} from "@entities/attendance/ui/rowVariant";
import { AttendanceRecordActionCell } from "@features/attendance/list/ui/AttendanceRecordActionCell";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { createMonthSearchParamsFromDate } from "@shared/lib/monthQuery";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

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
    const monthQuery = createMonthSearchParamsFromDate(dayjs(workDate)).toString();
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
    <AttendanceRecordTableRow
      key={attendance.id}
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
          onEdit={handleEdit}
        />
      }
    />
  );
}
