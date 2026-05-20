import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { useContext, useMemo } from "react";

import TimeInputBase from "./TimeInputBase";

interface WorkTimeFieldInputProps {
  type: "start" | "end";
  highlight?: boolean;
  dataTestId?: string;
}

export default function WorkTimeFieldInput({
  type,
  highlight = false,
  dataTestId,
}: WorkTimeFieldInputProps) {
  const { workDate, control, setValue, changeRequests, readOnly, isOnBreak } =
    useContext(AttendanceEditContext);
  const { getQuickInputStartTimes, getQuickInputEndTimes } =
    useContext(AppConfigContext);

  const quickInputTimes = useMemo(() => {
    const times =
      type === "start" ? getQuickInputStartTimes(true) : getQuickInputEndTimes(true);
    return times.map((entry) => ({ time: entry.time, enabled: entry.enabled }));
  }, [type, getQuickInputStartTimes, getQuickInputEndTimes]);

  if (!workDate || !control || !setValue) return null;

  const isDisabled =
    changeRequests.length > 0 ||
    !!readOnly ||
    (type === "end" && !!isOnBreak);

  if (type === "start") {
    return (
      <TimeInputBase<"startTime">
        name="startTime"
        control={control}
        setValue={setValue}
        workDate={workDate}
        quickInputTimes={quickInputTimes}
        disabled={isDisabled}
        highlight={highlight}
        dataTestId={dataTestId}
      />
    );
  }

  return (
    <TimeInputBase<"endTime">
      name="endTime"
      control={control}
      setValue={setValue}
      workDate={workDate}
      quickInputTimes={quickInputTimes}
      disabled={isDisabled}
      highlight={highlight}
      dataTestId={dataTestId}
    />
  );
}
