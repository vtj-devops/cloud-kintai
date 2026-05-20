import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { DateDisplayCell } from "@shared/ui/table";

export default function CreatedAtTableCell({
  holidayCalendar: calendar,
}: {
  holidayCalendar: { createdAt?: string | null };
}) {
  return (
    <DateDisplayCell
      date={calendar.createdAt}
      format={AttendanceDate.DisplayFormat}
      emptyLabel=""
    />
  );
}
