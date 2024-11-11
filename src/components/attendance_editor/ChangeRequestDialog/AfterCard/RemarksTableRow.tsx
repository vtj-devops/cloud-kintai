import { TableCell, TableRow } from "@mui/material";

import { AttendanceChangeRequest } from "../../../../API";

export default function RemarksTableRow({
  value,
}: {
  value: AttendanceChangeRequest["remarks"];
}) {
  return (
    <TableRow>
      <TableCell>備考</TableCell>
      <TableCell>{value && value !== "" ? value : "(変更なし)"}</TableCell>
    </TableRow>
  );
}
