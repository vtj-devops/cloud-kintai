import { TableCell, TableRow } from "@mui/material";

import { AttendanceChangeRequest } from "../../../../API";

export default function GoDirectlyFlagTableRow({
  value,
}: {
  value: AttendanceChangeRequest["goDirectlyFlag"];
}) {
  return (
    <TableRow>
      <TableCell>直行</TableCell>
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
