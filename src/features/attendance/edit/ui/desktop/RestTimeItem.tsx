import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { LunchRestTimeNotSetWarning } from "@features/attendance/edit/ui/LunchRestTimeNotSetWarning";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";

import NoRestTimeMessage from "./NoRestTimeMessage";
import {
  calcTotalRestTime,
  RestTimeInput,
} from "./RestTimeInput";

export default function RestTimeItem() {
  const { restFields, restAppend, changeRequests, watch, workDate, isOnBreak } =
    useContext(AttendanceEditContext);

  const [visibleRestWarning, setVisibleRestWarning] = useState(false);

  useEffect(() => {
    if (!watch) return;

    const subscription: unknown = watch((data) => {
      if (!data) return;

      const startTime = data.startTime;
      const endTime = data.endTime;

      if (!startTime || !endTime) {
        setVisibleRestWarning(false);
        return;
      }

      const totalWorkTime = dayjs(endTime).diff(dayjs(startTime), "hour", true);

      const totalRestTime =
        data.rests?.reduce((acc, rest) => {
          if (!rest) return acc;
          if (!rest.endTime) return acc;

          const diff = calcTotalRestTime(rest.startTime, rest.endTime);
          return acc + diff;
        }, 0) ?? 0;

      setVisibleRestWarning(totalWorkTime > 6 && totalRestTime === 0);
    });

    // react-hook-form's watch returns an unsubscribe function or an object with unsubscribe
    return () => {
      // subscription can be a function or an object with unsubscribe
      if (typeof subscription === "function") {
        try {
          (subscription as () => void)();
        } catch {
          /* ignore */
        }
        return;
      }

      if (
        subscription &&
        typeof (subscription as { unsubscribe?: unknown }).unsubscribe ===
          "function"
      ) {
        try {
          (subscription as { unsubscribe: () => void }).unsubscribe();
        } catch {
          /* ignore */
        }
      }
    };
  }, [watch]);

  if (!restAppend) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="w-full text-sm font-bold text-slate-900 md:w-[150px]">
        休憩時間
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <NoRestTimeMessage restFields={restFields} />
        {restFields.length === 0 && visibleRestWarning && (
          <div>
            <LunchRestTimeNotSetWarning
              targetWorkDate={workDate ? workDate.toISOString() : undefined}
            />
          </div>
        )}
        {restFields.map((rest, index) => (
          <RestTimeInput key={index} rest={rest} index={index} />
        ))}
        <div>
          <button
            type="button"
            aria-label="休憩時間を追加"
            data-testid="add-rest-time"
            disabled={changeRequests.length > 0 || isOnBreak}
            onClick={() =>
              restAppend({
                startTime: null,
                endTime: null,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-[14px] border border-emerald-500/30 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-500/45 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            <span>追加</span>
          </button>
        </div>
      </div>
    </div>
  );
}
