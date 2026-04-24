import { useAttendanceEditData } from "@features/attendance/edit/model/AttendanceEditProvider";
import { Label } from "@features/attendance/edit/ui/mobile/Label";

export function StaffNameItem() {
  const { staff } = useAttendanceEditData();

  if (!staff) {
    return null;
  }

  return (
    <>
      <Label>■ スタッフ</Label>
      <div className="text-base text-slate-900">{`${staff.familyName} ${staff.givenName}`}</div>
    </>
  );
}
