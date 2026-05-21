import { AttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import { Attendance } from "@shared/api/graphql/types";
import { TimeDisplayCell } from "@shared/ui/table";

export function StartTimeTableCell({
  row,
  attendances,
  targetWorkDate,
}: {
  row: AttendanceDaily;
  attendances?: Attendance[];
  targetWorkDate?: string;
}) {
  // attendances が提供されている場合は、そこから対象日のデータを取得
  let startTime: string | null | undefined = undefined;

  if (attendances && attendances.length > 0) {
    // 対象日に合致する記録を探す
    for (const attendance of attendances) {
      if (
        attendance?.startTime &&
        (!targetWorkDate || attendance.workDate === targetWorkDate)
      ) {
        startTime = attendance.startTime;
        break;
      }
    }
  }

  // attendances から見つからない場合は、row.attendance にフォールバック
  if (
    !startTime &&
    row.attendance?.startTime &&
    (!targetWorkDate || row.attendance.workDate === targetWorkDate)
  ) {
    startTime = row.attendance.startTime;
  }

  return (
    <TimeDisplayCell
      time={startTime}
      format="H:mm"
      emptyLabel=""
      sx={startTime ? { textAlign: "right" } : undefined}
    />
  );
}
