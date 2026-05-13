import { CreatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/CreatedAtTableCell";
import { RestTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/RestTimeTableCell";
import { SummaryTableCell } from "@entities/attendance/ui/adminStaffAttendance/SummaryTableCell";
import { UpdatedAtTableCell } from "@entities/attendance/ui/adminStaffAttendance/UpdatedAtTableCell";
import { WorkDateTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkDateTableCell";
import { WorkTimeTableCell } from "@entities/attendance/ui/adminStaffAttendance/WorkTimeTableCell";
import {
  AttendanceRowVariant,
  attendanceRowVariantStyles,
} from "@entities/attendance/ui/rowVariant";
import { AttendanceStatusTooltip } from "@features/attendance/list/ui/AttendanceStatusTooltip";
import {
  Button,
  Stack,
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
} from "@shared/api/graphql/types";
import { AppEditIconButton } from "@shared/ui/button/AppActionIconButton";

import type { PendingAttendanceControls } from "./PendingAttendanceSection";

export type AttendanceTableSectionProps = {
  attendances: Attendance[];
  staff: Staff | null | undefined;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  onEdit: (attendance: Attendance) => void;
  getBadgeContent: (attendance: Attendance) => number;
  changeRequestControls: Pick<PendingAttendanceControls, "onOpenQuickView">;
  getRowVariant: (
    attendance: Attendance,
    holidayCalendars?: HolidayCalendar[],
    companyHolidayCalendars?: CompanyHolidayCalendar[],
  ) => AttendanceRowVariant;
};

export function AttendanceTableSection({
  attendances,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
  onEdit,
  getBadgeContent,
  changeRequestControls,
  getRowVariant,
}: AttendanceTableSectionProps) {
  const { onOpenQuickView } = changeRequestControls;
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell sx={{ whiteSpace: "nowrap" }}>勤務日</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>勤務時間</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>休憩時間(直近)</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>摘要</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>作成日時</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>更新日時</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {attendances.map((attendance, index) => {
            const badgeContent = getBadgeContent(attendance);
            const rowVariant = getRowVariant(
              attendance,
              holidayCalendars,
              companyHolidayCalendars,
            );
            const rowKey = attendance.id || `${attendance.workDate}-${index}`;
            return (
              <TableRow
                key={rowKey}
                sx={attendanceRowVariantStyles[rowVariant]}
                data-testid={
                  index === attendances.length - 1 ? "last-row" : undefined
                }
              >
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttendanceStatusTooltip
                      staff={staff}
                      attendance={attendance}
                      holidayCalendars={holidayCalendars}
                      companyHolidayCalendars={companyHolidayCalendars}
                    />
                    <AppEditIconButton
                      size="sm"
                      onClick={() => onEdit(attendance)}
                      aria-label="編集"
                      data-testid="edit-attendance-button"
                    />
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
                  substituteHolidayDate={attendance.substituteHolidayDate}
                  specialHolidayFlag={attendance.specialHolidayFlag}
                  paidHolidayFlag={attendance.paidHolidayFlag}
                  absentFlag={attendance.absentFlag}
                />

                {/* 作成日時 */}
                <CreatedAtTableCell createdAt={attendance.createdAt} />

                {/* 更新日時 */}
                <UpdatedAtTableCell updatedAt={attendance.updatedAt} />

                <TableCell sx={{ width: 1 }} align="right">
                  {badgeContent > 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      sx={{ fontWeight: "bold" }}
                      onClick={() => onOpenQuickView(attendance)}
                      data-testid="quick-view-change-request"
                    >
                      申請確認
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
