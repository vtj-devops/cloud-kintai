import { useAttendanceEditData } from "@features/attendance/edit/model/AttendanceEditProvider";

import MoveDateItem from "../MoveDateItem";

export function WorkDateItem() {
  const { workDate } = useAttendanceEditData();

  if (!workDate) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80">
      <div className="grid grid-cols-[7.5rem_1fr]">
        <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
          勤務日
        </div>
        <div className="px-3 py-2">
          <MoveDateItem workDate={workDate} />
        </div>
      </div>
    </div>
  );
}
