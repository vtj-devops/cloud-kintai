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
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { designTokenVar } from "@shared/designSystem";
import { AppIconButton } from "@shared/ui/button";

const HIGHLIGHT_BORDER = designTokenVar(
  "color.feedback.warning.base",
  "#E8A447"
);
const HIGHLIGHT_BACKGROUND = designTokenVar(
  "color.feedback.warning.surface",
  "#FFF7EA"
);
const STACK_SPACING = designTokenVar("spacing.md", "12px");

export type PendingAttendanceSectionProps = {
  attendances: Attendance[];
  staff: Staff | null | undefined;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  changeRequestControls: PendingAttendanceControls;
  onEdit: (attendance: Attendance) => void;
  getBadgeContent: (attendance: Attendance) => number;
  getRowVariant: (
    attendance: Attendance,
    holidayCalendars?: HolidayCalendar[],
    companyHolidayCalendars?: CompanyHolidayCalendar[]
  ) => AttendanceRowVariant;
};

export type PendingAttendanceControls = {
  selectedAttendanceIds: string[];
  isAttendanceSelected: (attendanceId: string) => boolean;
  toggleAttendanceSelection: (attendanceId: string) => void;
  toggleSelectAll: () => void;
  bulkApproving: boolean;
  canBulkApprove: boolean;
  onBulkApprove: () => Promise<void> | void;
  onOpenQuickView: (attendance: Attendance) => void;
};

export function PendingAttendanceSection({
  attendances,
  staff,
  holidayCalendars,
  companyHolidayCalendars,
  changeRequestControls,
  onEdit,
  getBadgeContent,
  getRowVariant,
}: PendingAttendanceSectionProps) {
  const {
    selectedAttendanceIds,
    isAttendanceSelected,
    toggleAttendanceSelection,
    toggleSelectAll,
    bulkApproving,
    canBulkApprove,
    onBulkApprove,
    onOpenQuickView,
  } = changeRequestControls;
  if (attendances.length === 0) {
    return null;
  }

  return (
    <Stack spacing={STACK_SPACING}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={designTokenVar("spacing.sm", "8px")}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Typography variant="h6">
          承認待ち一覧 ({attendances.length})
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            選択中: {selectedAttendanceIds.length} 件
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={
              bulkApproving ||
              selectedAttendanceIds.length === 0 ||
              !canBulkApprove
            }
            onClick={onBulkApprove}
            data-testid="bulk-approve-button"
          >
            {bulkApproving ? "承認処理中..." : "選択を一括承認"}
          </Button>
        </Stack>
      </Stack>
      <Alert severity="warning">
        <AlertTitle sx={{ fontWeight: "bold" }}>確認してください</AlertTitle>
        未承認の変更リクエストがあります
      </Alert>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    selectedAttendanceIds.length > 0 &&
                    selectedAttendanceIds.length < attendances.length
                  }
                  checked={
                    attendances.length > 0 &&
                    selectedAttendanceIds.length === attendances.length
                  }
                  onChange={toggleSelectAll}
                  inputProps={{
                    "aria-label": "select all pending change requests",
                  }}
                />
              </TableCell>
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
            {attendances.map((attendance, index) => {
              const badgeContent = getBadgeContent(attendance);
              const rowVariant = getRowVariant(
                attendance,
                holidayCalendars,
                companyHolidayCalendars
              );
              const rowKey = attendance.id || `${attendance.workDate}-${index}`;
              return (
                <TableRow
                  key={`pending-${rowKey}`}
                  sx={attendanceRowVariantStyles[rowVariant]}
                  data-testid={
                    index === attendances.length - 1
                      ? "last-row-pending"
                      : undefined
                  }
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isAttendanceSelected(attendance.id)}
                      onChange={() => toggleAttendanceSelection(attendance.id)}
                      inputProps={{ "aria-label": "select change request" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttendanceStatusTooltip
                        staff={staff}
                        attendance={attendance}
                        holidayCalendars={holidayCalendars}
                        companyHolidayCalendars={companyHolidayCalendars}
                      />
                      <AppIconButton
                        size="sm"
                        onClick={() => onEdit(attendance)}
                        aria-label="編集"
                        data-testid="edit-attendance"
                      >
                        <EditIcon fontSize="small" />
                      </AppIconButton>
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
    </Stack>
  );
}

export const pendingAttendanceContainerSx = {
  border: "1px solid",
  borderColor: HIGHLIGHT_BORDER,
  borderRadius: designTokenVar("radius.lg", "12px"),
  p: designTokenVar("spacing.lg", "16px"),
  backgroundColor: HIGHLIGHT_BACKGROUND,
};
