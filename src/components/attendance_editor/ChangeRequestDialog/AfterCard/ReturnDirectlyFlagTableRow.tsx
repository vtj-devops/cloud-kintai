import { TableCell, TableRow } from "@mui/material";

import { AttendanceChangeRequest } from "../../../../API";

export default function ReturnDirectlyFlagTableRow({
  value,
}: {
  value: AttendanceChangeRequest["returnDirectlyFlag"];
}) {
  return (
    <TableRow>
      <TableCell>直帰</TableCell>
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
