import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, IconButton, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { AttendanceEditContext } from "../../AttendanceEditProvider";

export default function EndTimeInput() {
  const { workDate, attendance, control, setValue, changeRequests } =
    useContext(AttendanceEditContext);
  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  useEffect(() => {
    setEnableEndTime(!!attendance?.endTime);
  }, [attendance]);

  if (!workDate || !control || !setValue) return null;

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

  return (
    <Stack direction="row" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <TimePicker
              value={field.value ? dayjs(field.value) : null}
              ampm={false}
              disabled={changeRequests.length > 0}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              slotProps={{
                textField: { size: "small" },
              }}
              onChange={(value) => {
                if (!value) return null;
                if (!value.isValid()) return;

                const formattedEndTime = value
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
            label="18:00"
            color="success"
            variant="outlined"
            icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
            disabled={changeRequests.length > 0}
            onClick={() => {
              const endTime = new AttendanceDateTime()
                .setDate(workDate)
                .setWorkEnd()
                .toISOString();
              setValue("endTime", endTime, { shouldDirty: true });
            }}
          />
        </Box>
      </Stack>
      <Box>
        <IconButton
          disabled={changeRequests.length > 0}
          onClick={() => {
            setValue("endTime", null, { shouldDirty: true });
            setEnableEndTime(false);
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
