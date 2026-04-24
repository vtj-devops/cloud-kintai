import { useAttendanceEditData } from "@features/attendance/edit/model/AttendanceEditProvider";
import { InlineAlert } from "@shared/ui/feedback/InlineAlert";

export default function NoDataAlert() {
  const { attendance } = useAttendanceEditData();

  if (attendance !== null) {
    return null;
  }

  return (
    <InlineAlert tone="info" title="お知らせ">
      指定された日付に勤怠情報の登録がありませんでした。保存時に新規作成されます。
    </InlineAlert>
  );
}
