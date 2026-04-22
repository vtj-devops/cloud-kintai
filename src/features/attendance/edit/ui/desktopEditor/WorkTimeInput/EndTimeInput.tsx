import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import TimeInputBase from "@features/attendance/edit/ui/items/WorkTimeItem/TimeInputBase";
import { useContext, useMemo } from "react";

export default function EndTimeInput({
  highlight = false,
}: { highlight?: boolean } = {}) {
  const { getQuickInputEndTimes } = useContext(AppConfigContext);
  const { workDate, control, setValue, changeRequests, readOnly, isOnBreak } =
    useContext(AttendanceEditContext);

  const quickInputEndTimes = useMemo(() => {
    const times = getQuickInputEndTimes(true);
    return times.map((entry) => ({
      time: entry.time,
      enabled: entry.enabled,
    }));
  }, [getQuickInputEndTimes]);

  if (!workDate || !control || !setValue) return null;

  return (
    <TimeInputBase<"endTime">
      name="endTime"
      control={control}
      setValue={setValue}
      workDate={workDate}
      quickInputTimes={quickInputEndTimes}
      disabled={changeRequests.length > 0 || !!readOnly || isOnBreak}
      highlight={highlight}
    />
  );
}
