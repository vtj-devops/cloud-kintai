import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { useContext, useMemo } from "react";

import TimeInputBase from "./TimeInputBase";

export default function StartTimeInput({
  highlight = false,
}: { highlight?: boolean } = {}) {
  const { workDate, control, setValue } = useContext(AttendanceEditContext);
  const { getQuickInputStartTimes } = useContext(AppConfigContext);

  // Derived state: compute quickInputStartTimes from getQuickInputStartTimes
  const quickInputStartTimes = useMemo(() => {
    const times = getQuickInputStartTimes(true);
    return times.map((entry) => ({
      time: entry.time,
      enabled: entry.enabled,
    }));
  }, [getQuickInputStartTimes]);

  if (!workDate || !control || !setValue) {
    return null;
  }

  return (
    <TimeInputBase<"startTime">
      name="startTime"
      control={control}
      setValue={setValue}
      workDate={workDate}
      quickInputTimes={quickInputStartTimes}
      highlight={highlight}
    />
  );
}
