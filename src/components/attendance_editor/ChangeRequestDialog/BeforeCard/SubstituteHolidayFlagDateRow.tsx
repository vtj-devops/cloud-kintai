import { TableCell, TableRow } from "@mui/material";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { Attendance } from "../../../../API";

export default function SubstituteHolidayDateTableRow({
  value,
}: {
  value: Attendance["substituteHolidayDate"];
}) {
  return (
    <TableRow>
      <TableCell>振替休暇</TableCell>
      <TableCell>
        {value
          ? new AttendanceDateTime().setDateString(value).toDisplayDateFormat()
          : "なし"}
      </TableCell>
    </TableRow>
  );
}
