import { AttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import { Attendance } from "@shared/api/graphql/types";
import { TimeDisplayCell } from "@shared/ui/table";

export function EndTimeTableCell({
  row,
  attendances,
  targetWorkDate,
}: {
  row: AttendanceDaily;
  attendances?: Attendance[];
  targetWorkDate?: string;
}) {
  // attendances が提供されている場合は、そこから対象日のデータを取得
  let endTime: string | null | undefined = undefined;

  if (attendances && attendances.length > 0) {
    // 対象日に合致する記録を探す
    for (const attendance of attendances) {
      if (
        attendance?.endTime &&
        (!targetWorkDate || attendance.workDate === targetWorkDate)
      ) {
        endTime = attendance.endTime;
        break;
      }
    }
  }

  // attendances から見つからない場合は、row.attendance にフォールバック
  if (
    !endTime &&
    row.attendance?.endTime &&
    (!targetWorkDate || row.attendance.workDate === targetWorkDate)
  ) {
    endTime = row.attendance.endTime;
  }

  return (
    <TimeDisplayCell
      time={endTime}
      format="H:mm"
      emptyLabel=""
      sx={endTime ? { textAlign: "right" } : undefined}
    />
  );
}
