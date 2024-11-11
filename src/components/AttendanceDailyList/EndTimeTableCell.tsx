import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { AttendanceDaily } from "../../hooks/useAttendanceDaily/useAttendanceDaily";

export function EndTimeTableCell({ row }: { row: AttendanceDaily }) {
  if (!row.attendance) return <TableCell />;

  const { endTime } = row.attendance;
  if (!endTime) return <TableCell />;

  const date = dayjs(endTime).format("H:mm");
  return <TableCell sx={{ textAlign: "right" }}>{date}</TableCell>;
}
