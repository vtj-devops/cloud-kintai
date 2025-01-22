import "./styles.scss";

import {
  Box,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "../../../API";
import TableBodyRow from "./TableBodyRow";

const MobileBox = styled(Box)(({ theme }) => ({
  padding: "0px 0px 40px 0px",
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}));

export default function MobileList({
  attendances,
  holidayCalendars,
  companyHolidayCalendars,
  staff,
}: {
  attendances: Attendance[];
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  staff: Staff | null | undefined;
}) {
  return (
    <MobileBox>
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
              <TableBodyRow
                key={index}
                attendance={attendance}
                holidayCalendars={holidayCalendars}
                companyHolidayCalendars={companyHolidayCalendars}
                staff={staff}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MobileBox>
  );
}
