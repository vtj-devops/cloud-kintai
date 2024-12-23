import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { AttendanceDaily } from "../../hooks/useAttendanceDaily/useAttendanceDaily";

export function StartTimeTableCell({ row }: { row: AttendanceDaily }) {
  if (!row.attendance) return <TableCell />;

  const { startTime } = row.attendance;
  if (!startTime) return <TableCell />;

  const date = dayjs(startTime).format("H:mm");
  return <TableCell sx={{ textAlign: "right" }}>{date}</TableCell>;
}
