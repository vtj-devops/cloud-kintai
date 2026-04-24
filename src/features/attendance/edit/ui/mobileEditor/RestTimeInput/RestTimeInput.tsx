import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import {
  AttendanceEditInputs,
  RestInputs,
} from "@features/attendance/edit/model/common";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import { useContext } from "react";
import {
  FieldArrayMethodProps,
  FieldArrayWithId,
  UseFieldArrayRemove,
} from "react-hook-form";

import RestEndTimeInput from "../../desktopEditor/RestTimeItem/RestTimeInput/RestEndTimeInput";
import RestStartTimeInput from "../../desktopEditor/RestTimeItem/RestTimeInput/RestStartTimeInput";

type RestTimeInputProps = {
  restFields: FieldArrayWithId<AttendanceEditInputs, "rests", "id">[];
  restAppend: (
    value: RestInputs | RestInputs[],
    options?: FieldArrayMethodProps | undefined,
  ) => void;
  restRemove: UseFieldArrayRemove;
};

const restRowGridClassName = "grid w-full grid-cols-[6.5rem_minmax(0,1fr)_2.75rem]";

export function RestTimeInput({
  restFields,
  restAppend,
  restRemove,
}: RestTimeInputProps) {
  const { workDate, isOnBreak } = useContext(AttendanceEditContext);

  if (!workDate) return null;

  return (
    <>
      <Label>休憩時間</Label>
      {restFields.map((rest, index) => (
        <div
          key={index}
          className="overflow-visible rounded-lg border border-slate-200/80"
        >
          <div className={`${restRowGridClassName} border-b border-slate-200/80`}>
            <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              開始時刻
            </div>
            <div className="min-w-0 space-y-2 px-3 py-2">
              <RestStartTimeInput
                rest={rest}
                index={index}
                testIdPrefix="mobile"
              />
            </div>
            <div className="flex items-center justify-center border-l border-slate-200/80 bg-slate-50/50">
              <button
                type="button"
                aria-label="休憩を削除"
                onClick={() => restRemove(index)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                ×
              </button>
            </div>
          </div>
          <div className={restRowGridClassName}>
            <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              終了時刻
            </div>
            <div className="min-w-0 space-y-2 px-3 py-2">
              <RestEndTimeInput
                rest={rest}
                index={index}
                testIdPrefix="mobile"
              />
            </div>
            <div className="border-l border-slate-200/80 bg-slate-50/50" />
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={isOnBreak}
        onClick={() =>
          restAppend({
            startTime: null,
            endTime: null,
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-500/25 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500/40 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-base leading-none">+</span>
        休憩時間を追加
      </button>
    </>
  );
}
