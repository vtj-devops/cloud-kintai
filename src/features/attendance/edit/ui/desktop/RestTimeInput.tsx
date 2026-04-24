import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";
import { FieldArrayWithId, useWatch } from "react-hook-form";

import RestEndTimeInput from "./RestEndTimeInput";
import RestStartTimeInput from "./RestStartTimeInput";

export function calcTotalRestTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined
) {
  if (!startTime) return 0;

  const now = dayjs();
  const diff = dayjs(endTime || now).diff(dayjs(startTime), "hour", true);
  return diff;
}

export function RestTimeInput({
  rest,
  index,
}: {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
}) {
  const { restRemove, changeRequests, control } = useContext(
    AttendanceEditContext
  );
  
  // Watch the form data to compute total rest time
  const rests = useWatch({
    control,
    name: "rests",
  });

  // Derive total rest time from watched form data
  const totalRestTime = useMemo(() => {
    if (!rests || !rests[index]) return 0;
    const rest = rests[index];
    return calcTotalRestTime(rest.startTime, rest.endTime);
  }, [rests, index]);

  if (!restRemove) return null;

  return (
    <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
      <RestStartTimeInput rest={rest} index={index} testIdPrefix="desktop" />
      <div className="text-sm text-slate-500">～</div>
      <RestEndTimeInput rest={rest} index={index} testIdPrefix="desktop" />
      <button
        type="button"
        aria-label="休憩を削除"
        disabled={changeRequests.length > 0}
        onClick={() => restRemove(index)}
        data-testid={`rest-delete-button-${index}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ×
      </button>
      <div className="text-sm text-slate-700 md:ml-auto md:whitespace-nowrap md:text-right">
        {`${totalRestTime.toFixed(1)} 時間`}
      </div>
    </div>
  );
}
