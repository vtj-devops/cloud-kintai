import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import { useContext } from "react";
import { FieldArrayWithId } from "react-hook-form";

import { CommonRestTimePicker } from "./CommonRestTimePicker";

type Props = {
  type: "start" | "end";
  index: number;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
};

export default function RestTimeFieldInput({ type, index, rest }: Props) {
  const { workDate, control, restUpdate } = useContext(AttendanceEditContext);
  const { getLunchRestStartTime, getLunchRestEndTime } =
    useContext(AppConfigContext);

  if (!workDate || !control || !restUpdate) return null;

  const isStart = type === "start";

  const chipLabel = isStart
    ? getLunchRestStartTime().format("HH:mm")
    : getLunchRestEndTime().format("H:mm");

  const handleChipClick = () => {
    if (isStart) {
      const startTime = dayjs(`${workDate.format("YYYY-MM-DD")} ${chipLabel}`)
        .second(0)
        .millisecond(0)
        .toISOString();
      restUpdate(index, { ...rest, startTime });
    } else {
      const endTime = new AttendanceDateTime()
        .setDate(workDate)
        .setRestEnd()
        .toISOString();
      restUpdate(index, { ...rest, endTime });
    }
  };

  return (
    <Stack spacing={1}>
      <CommonRestTimePicker
        name={isStart ? `rests.${index}.startTime` : `rests.${index}.endTime`}
        value={isStart ? rest.startTime : rest.endTime}
        workDate={workDate}
        control={control}
        rest={rest}
        index={index}
        restUpdate={restUpdate}
        chipLabel={chipLabel}
        onChipClick={handleChipClick}
      />
    </Stack>
  );
}
