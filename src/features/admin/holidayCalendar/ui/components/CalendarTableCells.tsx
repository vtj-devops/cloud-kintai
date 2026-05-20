import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { TableCell } from "@mui/material";
import dayjs from "dayjs";

export function CalendarDateTableCell({ date }: { date: string }) {
  return <TableCell>{dayjs(date).format(AttendanceDate.DisplayFormat)}</TableCell>;
}

export function CalendarNameTableCell({ name }: { name: string }) {
  return <TableCell>{name}</TableCell>;
}
