import { getWorkTypeLabel } from "@entities/staff/lib/workTypeOptions";
import { useAttendanceEditData } from "@features/attendance/edit/model/AttendanceEditProvider";
import { Label } from "@features/attendance/edit/ui/mobile/Label";

export default function WorkTypeItemMobile() {
  const { staff } = useAttendanceEditData();

  const workTypeValue = (staff as unknown as Record<string, unknown>)
    .workType as string | null | undefined;

  const label = getWorkTypeLabel(workTypeValue);

  if (!label) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <Label>■ 勤務形態</Label>
      <div className="text-base text-slate-900">{label}</div>
    </div>
  );
}
