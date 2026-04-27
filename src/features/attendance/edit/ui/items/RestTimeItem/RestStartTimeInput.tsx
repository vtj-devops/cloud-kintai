import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import { useContext } from "react";
import { FieldArrayWithId } from "react-hook-form";

import { CommonRestTimePicker } from "./CommonRestTimePicker";

export default function RestStartTimeInput({
  index,
  rest,
}: {
  index: number;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
}) {
  const { workDate, control, restUpdate } = useContext(AttendanceEditContext);
  const { getLunchRestStartTime } = useContext(AppConfigContext);

  if (!workDate || !control || !restUpdate) {
    return null;
  }

  const lunchRestStartTime = getLunchRestStartTime().format("HH:mm");

  return (
    <Stack spacing={1}>
      <CommonRestTimePicker
        name={`rests.${index}.startTime`}
        value={rest.startTime}
        workDate={workDate}
        control={control}
        rest={rest}
        index={index}
        restUpdate={restUpdate}
        chipLabel={lunchRestStartTime}
        onChipClick={() => {
          const startTime = dayjs(
            `${workDate.format("YYYY-MM-DD")} ${lunchRestStartTime}`
          )
            .second(0)
            .millisecond(0)
            .toISOString();
          restUpdate(index, { ...rest, startTime });
        }}
      />
    </Stack>
  );
}
