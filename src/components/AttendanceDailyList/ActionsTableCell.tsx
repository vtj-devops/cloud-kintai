import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import {
  Badge,
  Box,
  IconButton,
  Stack,
  TableCell,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@/API";
import { useAppDispatchV2 } from "@/app/hooks";
import useCompanyHolidayCalendars from "@/hooks/useCompanyHolidayCalendars/useCompanyHolidayCalendars";
import useHolidayCalendar from "@/hooks/useHolidayCalendars/useHolidayCalendars";
import fetchStaff from "@/hooks/useStaff/fetchStaff";
import { AttendanceState, AttendanceStatus } from "@/lib/AttendanceState";
import { setSnackbarError } from "@/lib/reducers/snackbarReducer";

import * as MESSAGE_CODE from "../../errors";
import { AttendanceDaily } from "../../hooks/useAttendanceDaily/useAttendanceDaily";
import useAttendances from "../../hooks/useAttendances/useAttendances";

function getBadgeContent(attendances: Attendance[]) {
  const changeRequestCount = attendances.filter((attendance) =>
    attendance.changeRequests
      ? attendance.changeRequests
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .filter((item) => !item.completed).length > 0
      : false
  ).length;

  return changeRequestCount;
}

function AttendanceTotalStatus({
  attendances,
  holidayCalendars,
  companyHolidayCalendars,
  staff,
}: {
  attendances: Attendance[];
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  staff: Staff;
}) {
  const judgedStatus = attendances.map((attendance) =>
    new AttendanceState(
      staff,
      attendance,
      holidayCalendars,
      companyHolidayCalendars
    ).get()
  );

  const validDataCount = judgedStatus.filter(
    (status) => status !== AttendanceStatus.None
  ).length;

  const statusOkCount = judgedStatus.filter((status) =>
    [AttendanceStatus.Ok, AttendanceStatus.Working].includes(status)
  ).length;
  if (statusOkCount === validDataCount) {
    return <CheckCircleIcon color="success" />;
  }

  if (judgedStatus.includes(AttendanceStatus.Requesting)) {
    return (
      <Tooltip title="申請中です。承認されるまで反映されません">
        <HourglassTopIcon color="warning" />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="勤怠に不備があります">
      <ErrorIcon color="error" />
    </Tooltip>
  );
}

export function ActionsTableCell({ row }: { row: AttendanceDaily }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatchV2();

  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [staffLoading, setStaffLoading] = useState(true);

  const {
    attendances,
    getAttendances,
    loading: attendanceLoading,
    error: attendanceError,
  } = useAttendances();

  const {
    holidayCalendars,
    loading: holidayCalendarLoading,
    error: holidayCalendarError,
  } = useHolidayCalendar();

  const {
    companyHolidayCalendars,
    loading: companyHolidayCalendarLoading,
    error: companyHolidayCalendarError,
  } = useCompanyHolidayCalendars();

  useEffect(() => {
    getAttendances(row.sub);

    fetchStaff(row.sub)
      .then((res) => {
        setStaff(res);
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      })
      .finally(() => {
        setStaffLoading(false);
      });
  }, [row]);

  if (
    attendanceLoading ||
    holidayCalendarLoading ||
    companyHolidayCalendarLoading ||
    staffLoading ||
    attendanceError ||
    holidayCalendarError ||
    companyHolidayCalendarError
  )
    return (
      <TableCell>
        <Box sx={{ width: 24, height: 24 }} />
        <Box sx={{ width: 24, height: 24 }} />
      </TableCell>
    );

  if (!staff) {
    return null;
  }

  return (
    <TableCell sx={{ width: 50, minWidth: 50 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <AttendanceTotalStatus
          attendances={attendances}
          holidayCalendars={holidayCalendars}
          companyHolidayCalendars={companyHolidayCalendars}
          staff={staff}
        />
        <IconButton
          size="small"
          onClick={() => {
            const { sub: staffId } = row;
            navigate(`/admin/staff/${staffId}/attendance`);
          }}
        >
          <Badge badgeContent={getBadgeContent(attendances)} color="primary">
            <CalendarMonthIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Stack>
    </TableCell>
  );
}
