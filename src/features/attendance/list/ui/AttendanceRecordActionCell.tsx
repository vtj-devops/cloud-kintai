import { Stack } from "@mui/material";
import type {
  Attendance,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import { AppEditIconButton } from "@shared/ui/button/AppActionIconButton";

import { AttendanceStatusTooltip } from "./AttendanceStatusTooltip";

type AttendanceRecordActionCellProps = {
  staff: Staff | null | undefined;
  attendance: Attendance;
  holidayCalendars: HolidayCalendar[];
  companyHolidayCalendars: CompanyHolidayCalendar[];
  onEdit: () => void;
  spacing?: number;
  editButtonTestId?: string;
};

export function AttendanceRecordActionCell({
  staff,
  attendance,
  holidayCalendars,
  companyHolidayCalendars,
  onEdit,
  spacing = 1,
  editButtonTestId,
}: AttendanceRecordActionCellProps) {
  return (
    <Stack direction="row" spacing={spacing} alignItems="center">
      <AttendanceStatusTooltip
        staff={staff}
        attendance={attendance}
        holidayCalendars={holidayCalendars}
        companyHolidayCalendars={companyHolidayCalendars}
      />
      <AppEditIconButton
        size="sm"
        onClick={onEdit}
        aria-label="編集"
        data-testid={editButtonTestId}
      />
    </Stack>
  );
}
