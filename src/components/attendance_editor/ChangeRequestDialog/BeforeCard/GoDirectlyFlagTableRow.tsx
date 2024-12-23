import { TableCell, TableRow } from "@mui/material";

import { Attendance } from "../../../../API";

export default function GoDirectlyFlagTableRow({
  value,
}: {
  value: Attendance["goDirectlyFlag"];
}) {
  return (
    <TableRow>
      <TableCell>直行</TableCell>
      <TableCell>{value ? "あり" : "なし"}</TableCell>
    </TableRow>
  );
}
