import { TableCell, TableRow } from "@mui/material";
import dayjs from "dayjs";

import { AttendanceTime } from "@/lib/AttendanceTime";

export default function WorkTimeTableRow({
  startTime,
  endTime,
}: {
  startTime: dayjs.Dayjs | null;
  endTime: dayjs.Dayjs | null;
}) {
  return (
    <TableRow>
      <TableCell>勤務時間</TableCell>
      <TableCell>
        {(() => {
          if (!startTime && !endTime) {
            return "変更なし";
          }

          return `${startTime?.format("HH:mm") ?? AttendanceTime.None} 〜 ${
            endTime?.format("HH:mm") ?? AttendanceTime.None
          }`;
        })()}
      </TableCell>
    </TableRow>
  );
}
