import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, IconButton, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Controller, FieldArrayWithId } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";
import { AttendanceEditInputs } from "@/pages/AttendanceEdit/common";

export default function RestEndTimeInput({
  index,
  rest,
}: {
  index: number;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
}) {
  const { workDate, control, watch, getValues, restUpdate } = useContext(
    AttendanceEditContext
  );
  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  useEffect(() => {
    if (!watch || !getValues) {
      return;
    }

    const rest = getValues(`rests.${index}`);
    if (!rest) return;
    setEnableEndTime(!!rest.endTime);

    watch((data) => {
      if (!data.rests) return;

      const dataRest = data.rests[index];
      if (!dataRest) return;
      setEnableEndTime(!!dataRest.endTime);
    });
  }, [watch]);

  if (!enableEndTime) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setEnableEndTime(true);
          }}
        >
          終了時間を追加
        </Button>
      </Box>
    );
  }

  if (!workDate || !control || !restUpdate) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name={`rests.${index}.endTime`}
          control={control}
          render={({ field }) => (
            <TimePicker
              value={rest.endTime ? dayjs(rest.endTime) : null}
              ampm={false}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              slotProps={{
                textField: { size: "small" },
              }}
              onChange={(newEndTime) => {
                if (!newEndTime) return field.onChange(null);
                if (!newEndTime.isValid()) return;

                const formattedEndTime = newEndTime
                  .year(workDate.year())
                  .month(workDate.month())
                  .date(workDate.date())
                  .second(0)
                  .millisecond(0)
                  .toISOString();
                field.onChange(formattedEndTime);
              }}
            />
          )}
        />
        <Box>
          <Chip
            label="13:00"
            variant="outlined"
            color="success"
            icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
            onClick={() => {
              const endTime = new AttendanceDateTime()
                .setDate(workDate)
                .setRestEnd()
                .toISOString();
              restUpdate(index, { ...rest, endTime });
            }}
          />
        </Box>
      </Stack>
      <Box>
        <IconButton
          onClick={() => {
            restUpdate(index, { ...rest, endTime: null });
            setEnableEndTime(false);
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
