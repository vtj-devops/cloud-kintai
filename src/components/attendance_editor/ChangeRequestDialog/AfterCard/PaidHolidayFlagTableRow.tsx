import { TableCell, TableRow } from "@mui/material";

import { AttendanceChangeRequest } from "../../../../API";

export default function PaidHolidayFlagTableRow({
  value,
}: {
  value: AttendanceChangeRequest["paidHolidayFlag"];
}) {
  return (
    <TableRow>
      <TableCell>有給休暇</TableCell>
      <TableCell>
        {(() => {
          if (value === null) {
            return "(変更なし)";
          }

          return value ? "あり" : "なし";
        })()}
      </TableCell>
    </TableRow>
  );
}
