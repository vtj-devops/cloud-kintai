import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function StartTimeInput() {
  const { workDate, control, setValue } = useContext(AttendanceEditContext);

  if (!workDate || !control || !setValue) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Controller
        name="startTime"
        control={control}
        render={({ field }) => (
          <TimePicker
            ampm={false}
            value={(() => (field.value ? dayjs(field.value) : null))()}
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
          label="09:00"
          color="success"
          variant="outlined"
          icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
          onClick={() => {
            const startTime = new AttendanceDateTime()
              .setDate(workDate)
              .setWorkStart()
              .toISOString();
            setValue("startTime", startTime);
          }}
        />
      </Box>
    </Stack>
  );
}
