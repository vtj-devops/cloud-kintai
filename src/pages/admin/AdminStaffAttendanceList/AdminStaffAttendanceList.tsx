import "./styles.scss";

import EditIcon from "@mui/icons-material/Edit";
import {
  Badge,
  Box,
  Breadcrumbs,
  Container,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@/API";
import { AttendanceStatusTooltip } from "@/components/AttendanceList/AttendanceStatusTooltip";
import fetchStaff from "@/hooks/useStaff/fetchStaff";
import { AttendanceDate } from "@/lib/AttendanceDate";
import { ChangeRequest } from "@/lib/ChangeRequest";
import { CompanyHoliday } from "@/lib/CompanyHoliday";
import { DayOfWeek, DayOfWeekString } from "@/lib/DayOfWeek";
import { Holiday } from "@/lib/Holiday";
import { calcTotalRestTime } from "@/pages/AttendanceEdit/DesktopEditor/RestTimeItem/RestTimeInput/RestTimeInput";
import { calcTotalWorkTime } from "@/pages/AttendanceEdit/DesktopEditor/WorkTimeInput/WorkTimeInput";

import { useAppDispatchV2 } from "../../../app/hooks";
import * as MESSAGE_CODE from "../../../errors";
import useAttendances from "../../../hooks/useAttendances/useAttendances";
import useCompanyHolidayCalendars from "../../../hooks/useCompanyHolidayCalendars/useCompanyHolidayCalendars";
import useHolidayCalendars from "../../../hooks/useHolidayCalendars/useHolidayCalendars";
import { setSnackbarError } from "../../../lib/reducers/snackbarReducer";
import { ApprovalPendingMessage } from "./ApprovalPendingMessage";
import { AttendanceGraph } from "./AttendanceGraph";
import { CreatedAtTableCell } from "./CreatedAtTableCell";
import { RestTimeTableCell } from "./RestTimeTableCell";
import { SummaryTableCell } from "./SummaryTableCell";
import { UpdatedAtTableCell } from "./UpdatedAtTableCell";
import { WorkDateTableCell } from "./WorkDateTableCell";
import { WorkTimeTableCell } from "./WorkTimeTableCell";

export function getTableRowClassName(
  attendance: Attendance,
  holidayCalendars: HolidayCalendar[],
  companyHolidayCalendars: CompanyHolidayCalendar[]
) {
  const { workDate } = attendance;
  const today = dayjs().format(AttendanceDate.DataFormat);
  if (workDate === today) {
    return "table-row--today";
  }

  const isHoliday = new Holiday(holidayCalendars, workDate).isHoliday();
  const isCompanyHoliday = new CompanyHoliday(
    companyHolidayCalendars,
    workDate
  ).isHoliday();

  if (isHoliday || isCompanyHoliday) {
    return "table-row--sunday";
  }

  const dayOfWeek = new DayOfWeek(holidayCalendars).getLabel(workDate);
  switch (dayOfWeek) {
    case DayOfWeekString.Sat:
      return "table-row--saturday";
    case DayOfWeekString.Sun:
    case DayOfWeekString.Holiday:
      return "table-row--sunday";
    default:
      return "table-row--default";
  }
}

export default function AdminStaffAttendanceList() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatchV2();

  const [staff, setStaff] = useState<Staff | undefined | null>(undefined);
  const [totalTime, setTotalTime] = useState<number>(0);

  const { attendances, getAttendances } = useAttendances();
  const {
    companyHolidayCalendars,
    loading: companyHolidayCalendarLoading,
    error: companyHolidayCalendarError,
  } = useCompanyHolidayCalendars();

  useEffect(() => {
    if (!staffId) return;
    getAttendances(staffId).catch(() =>
      dispatch(setSnackbarError(MESSAGE_CODE.E02001))
    );

    fetchStaff(staffId)
      .then(setStaff)
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      });
  }, [staffId]);

  useEffect(() => {
    const totalWorkTime = attendances.reduce((acc, attendance) => {
      if (!attendance.startTime || !attendance.endTime) return acc;

      const workTime = calcTotalWorkTime(
        attendance.startTime,
        attendance.endTime
      );
      return acc + workTime;
    }, 0);

    const totalRestTime = attendances.reduce((acc, attendance) => {
      if (!attendance.rests) return acc;

      const restTime = attendance.rests
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((acc, rest) => {
          if (!rest.startTime || !rest.endTime) return acc;

          return acc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);

      return acc + restTime;
    }, 0);

    setTotalTime(totalWorkTime - totalRestTime);
  }, [attendances]);

  const {
    holidayCalendars,
    loading: holidayCalendarLoading,
    error: holidayCalendarError,
  } = useHolidayCalendars();

  if (holidayCalendarLoading || companyHolidayCalendarLoading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (holidayCalendarError || companyHolidayCalendarError) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <Typography>データ取得中に何らかの問題が発生しました</Typography>
      </Container>
    );
  }

  if (staff === null || !staffId) {
    return (
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <Typography>データ取得中に何らかの問題が発生しました</Typography>
      </Container>
    );
  }

  const handleEdit = (workDate: string) => {
    navigate(`/admin/attendances/edit/${workDate}/${staffId}`);
  };

  const getBadgeContent = (attendance: Attendance) => {
    return new ChangeRequest(attendance.changeRequests).getUnapprovedCount();
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={1} sx={{ pt: 1 }}>
        <Box>
          <Breadcrumbs>
            <Link to="/" color="inherit">
              TOP
            </Link>
            <Link to="/admin/attendances" color="inherit">
              勤怠管理
            </Link>
            <Typography color="text.primary">勤怠一覧</Typography>
          </Breadcrumbs>
        </Box>
        <Typography variant="h4">
          {`${staff?.familyName || "(不明)"} さんの勤怠(${totalTime.toFixed(
            1
          )}h)`}
        </Typography>
        <ApprovalPendingMessage attendances={attendances} />
        <Box>
          <DatePicker
            value={dayjs()}
            format={AttendanceDate.DisplayFormat}
            label="日付を指定して移動"
            slotProps={{
              textField: { size: "small" },
            }}
            onChange={(date) => {
              if (date) {
                navigate(
                  `/admin/attendances/edit/${date.format(
                    AttendanceDate.QueryParamFormat
                  )}/${staffId}`
                );
              }
            }}
          />
        </Box>
        <Box>
          <AttendanceGraph attendances={attendances} />
        </Box>
        <Box sx={{ pb: 5 }}>
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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttendanceStatusTooltip
                          staff={staff}
                          attendance={attendance}
                          holidayCalendars={holidayCalendars}
                          companyHolidayCalendars={companyHolidayCalendars}
                        />
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleEdit(
                              dayjs(attendance.workDate).format(
                                AttendanceDate.QueryParamFormat
                              )
                            )
                          }
                        >
                          <Badge
                            badgeContent={getBadgeContent(attendance)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </Badge>
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
        </Box>
      </Stack>
    </Container>
  );
}
