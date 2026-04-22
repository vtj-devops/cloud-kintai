import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { useContext, useMemo } from "react";

import TimeInputBase from "./TimeInputBase";

export default function EndTimeInput({
  highlight = false,
}: { highlight?: boolean } = {}) {
  const { getQuickInputEndTimes } = useContext(AppConfigContext);
  const { workDate, control, setValue, isOnBreak } = useContext(
    AttendanceEditContext
  );

  // Derived state: compute quickInputEndTimes from getQuickInputEndTimes
  const quickInputEndTimes = useMemo(() => {
    const times = getQuickInputEndTimes(true);
    return times.map((entry) => ({
      time: entry.time,
      enabled: entry.enabled,
    }));
  }, [getQuickInputEndTimes]);

  if (!workDate || !control || !setValue) {
    return null;
  }

  return (
    <TimeInputBase<"endTime">
      name="endTime"
      control={control}
      setValue={setValue}
      workDate={workDate}
      quickInputTimes={quickInputEndTimes}
      disabled={isOnBreak}
      highlight={highlight}
    />
  );
}
