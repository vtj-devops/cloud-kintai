import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import EndTimeInput from "@features/attendance/edit/ui/items/WorkTimeItem/EndTimeInput";
import StartTimeInput from "@features/attendance/edit/ui/items/WorkTimeItem/StartTimeInput";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import { useContext } from "react";

import { GoDirectlyFlagInput } from "../GoDirectlyFlagInput";
import { ReturnDirectlyFlagInput } from "../ReturnDirectlyFlagInput";

export function WorkTimeInput() {
  const { workDate, control, setValue } = useContext(AttendanceEditContext);

  if (!workDate || !control || !setValue) {
    return null;
  }

  return (
    <>
      <Label>勤務時間</Label>
      <div className="overflow-visible rounded-lg border border-slate-200/80">
        <div className="grid grid-cols-[7.5rem_1fr] border-b border-slate-200/80">
          <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            開始時刻
          </div>
          <div className="space-y-2 px-3 py-2">
            <StartTimeInput dataTestId="mobile-start-time-input" />
            <GoDirectlyFlagInput />
          </div>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr]">
          <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            終了時刻
          </div>
          <div className="space-y-2 px-3 py-2">
            <EndTimeInput />
            <ReturnDirectlyFlagInput />
          </div>
        </div>
      </div>
    </>
  );
}
