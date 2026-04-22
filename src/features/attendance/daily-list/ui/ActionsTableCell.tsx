import { AttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { Badge, Box, Stack, TableCell, Tooltip, } from "@mui/material";
import { Attendance, CompanyHolidayCalendar, HolidayCalendar, Staff, } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

// attendances are provided by parent (AttendanceDailyList)
import { resolveAttendanceSummaryStatus } from "../lib/attendanceSummaryStatus";

function getBadgeContent(attendances: Attendance[]) {
    const changeRequestCount = attendances.filter((attendance) => attendance.changeRequests
        ? attendance.changeRequests
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .filter((item) => !item.completed).length > 0
        : false).length;
    return changeRequestCount;
}
function AttendanceTotalStatus({ attendances, companyHolidayCalendars, holidayCalendars, staff, targetWorkDate, }: {
    attendances: Attendance[];
    companyHolidayCalendars: CompanyHolidayCalendar[];
    holidayCalendars: HolidayCalendar[];
    staff: Staff;
    targetWorkDate?: string;
}) {
    const baseDate = targetWorkDate ? dayjs(targetWorkDate) : dayjs();
    const summaryStatus = resolveAttendanceSummaryStatus({
        attendances,
        staff,
        holidayCalendars,
        companyHolidayCalendars,
        baseDate: baseDate.isValid() ? baseDate : dayjs(),
    });
    if (summaryStatus === "requesting") {
        return (<Tooltip title="申請中です。承認されるまで反映されません">
        <HourglassTopIcon color="warning"/>
      </Tooltip>);
    }
    if (summaryStatus === "ok" || summaryStatus === "none") {
        return <CheckCircleIcon color="success"/>;
    }
    return (<Tooltip title="勤怠に不備があります">
      <ErrorIcon color="error"/>
    </Tooltip>);
}
export function ActionsTableCell({ row, attendances, attendanceLoading, attendanceError, holidayCalendars, companyHolidayCalendars, calendarLoading, targetWorkDate, }: {
    row: AttendanceDaily;
    attendances: Attendance[];
    attendanceLoading: boolean;
    attendanceError: Error | null;
    holidayCalendars: HolidayCalendar[];
    companyHolidayCalendars: CompanyHolidayCalendar[];
    calendarLoading: boolean;
    targetWorkDate?: string;
}) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
    const [staffLoading, setStaffLoading] = useState(true);
    useEffect(() => {
        // still fetch staff info here
        fetchStaff(row.sub)
            .then((res) => {
            setStaff(res);
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
        })
            .finally(() => {
            setStaffLoading(false);
        });
    }, [row, dispatch]);
    if (attendanceLoading || staffLoading || attendanceError || calendarLoading)
        return (<TableCell>
        <Box sx={{ width: 24, height: 24 }}/>
        <Box sx={{ width: 24, height: 24 }}/>
      </TableCell>);
    if (!staff) {
        return null;
    }
    return (<TableCell sx={{ width: 50, minWidth: 50 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <AttendanceTotalStatus attendances={attendances} companyHolidayCalendars={companyHolidayCalendars} holidayCalendars={holidayCalendars} staff={staff} targetWorkDate={targetWorkDate}/>
        <AppIconButton size="sm" aria-label="勤怠を確認" data-testid="attendance-open-button" onClick={() => {
            const { sub: staffId } = row;
            navigate(`/admin/staff/${staffId}/attendance`);
        }}>
          <Badge badgeContent={getBadgeContent(attendances)} color="primary">
            <CalendarMonthIcon fontSize="small"/>
          </Badge>
        </AppIconButton>
      </Stack>
    </TableCell>);
}
