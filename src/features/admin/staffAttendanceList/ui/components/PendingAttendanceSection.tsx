import { AttendanceRecordTableRow } from "@entities/attendance/ui/adminStaffAttendance/AttendanceRecordTableRow";
import {
  AttendanceRowVariant,
} from "@entities/attendance/ui/rowVariant";
import { AttendanceRecordActionCell } from "@features/attendance/list/ui/AttendanceRecordActionCell";
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

import { ChangeRequestQuickViewButton } from "./ChangeRequestQuickViewButton";

const HIGHLIGHT_BORDER = designTokenVar(
  "color.feedback.warning.base",
  "#E8A447",
);
const HIGHLIGHT_BACKGROUND = designTokenVar(
  "color.feedback.warning.surface",
  "#FFF7EA",
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
    companyHolidayCalendars?: CompanyHolidayCalendar[],
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
                companyHolidayCalendars,
              );
              const rowKey = attendance.id || `${attendance.workDate}-${index}`;
              return (
                <AttendanceRecordTableRow
                  key={`pending-${rowKey}`}
                  attendance={attendance}
                  rowVariant={rowVariant}
                  holidayCalendars={holidayCalendars}
                  companyHolidayCalendars={companyHolidayCalendars}
                  rowTestId={
                    index === attendances.length - 1
                      ? "last-row-pending"
                      : undefined
                  }
                  applyCheckAlign="right"
                  selectionCell={
                    <Checkbox
                      color="primary"
                      checked={isAttendanceSelected(attendance.id)}
                      onChange={() => toggleAttendanceSelection(attendance.id)}
                      inputProps={{ "aria-label": "select change request" }}
                    />
                  }
                  actionCell={
                    <AttendanceRecordActionCell
                      staff={staff}
                      attendance={attendance}
                      holidayCalendars={holidayCalendars}
                      companyHolidayCalendars={companyHolidayCalendars}
                      onEdit={() => onEdit(attendance)}
                      editButtonTestId="edit-attendance"
                    />
                  }
                  applyCheckCell={
                    <ChangeRequestQuickViewButton
                      badgeContent={badgeContent}
                      onClick={() => onOpenQuickView(attendance)}
                    />
                  }
                />
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
