import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, IconButton, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function EndTimeInput() {
  const { workDate, control, setValue, getValues, watch } = useContext(
    AttendanceEditContext
  );
  if (!workDate) return null;

  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  useEffect(() => {
    if (!watch || !getValues) return;

    const endTime = getValues("endTime");
    setEnableEndTime(!!endTime);

    watch((data) => {
      setEnableEndTime(!!data.endTime);
    });
  }, [watch]);

  if (!enableEndTime) {
    return (
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => {
          setEnableEndTime(true);
        }}
      >
        終了時間を追加
      </Button>
    );
  }

  if (!control || !setValue) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <TimePicker
              value={(() => (field.value ? dayjs(field.value) : null))()}
              ampm={false}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              slotProps={{
                textField: { size: "small" },
              }}
              onChange={(value) => {
                field.onChange(
                  value && value.isValid()
                    ? value
                        .year(workDate.year())
                        .month(workDate.month())
                        .date(workDate.date())
                        .second(0)
                        .millisecond(0)
                        .toISOString()
                    : null
                );
              }}
            />
          )}
        />
        <Box>
          <Chip
            label="18:00"
            color="success"
            variant="outlined"
            icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
            onClick={() => {
              const endTime = new AttendanceDateTime()
                .setDate(workDate)
                .setWorkEnd()
                .toISOString();
              setValue("endTime", endTime);
            }}
          />
        </Box>
      </Stack>
      <Box>
        <IconButton
          sx={{ my: 1 }}
          onClick={() => {
            setValue("endTime", null);
            setEnableEndTime(false);
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
