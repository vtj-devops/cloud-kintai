import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { AttendanceEditContext } from "../../AttendanceEditProvider";

export default function StartTimeInput() {
  const { workDate, control, setValue, changeRequests } = useContext(
    AttendanceEditContext
  );

  if (!workDate || !control || !setValue) return null;

  return (
    <Stack spacing={1}>
      <Controller
        name="startTime"
        control={control}
        render={({ field }) => (
          <TimePicker
            ampm={false}
            value={field.value ? dayjs(field.value) : null}
            disabled={changeRequests.length > 0}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
            }}
            slotProps={{
              textField: { size: "small" },
            }}
            onChange={(value) => {
              if (!value || !value.isValid()) {
                return;
              }

              const formattedStartTime = value
                .year(workDate.year())
                .month(workDate.month())
                .date(workDate.date())
                .second(0)
                .millisecond(0)
                .toISOString();
              field.onChange(formattedStartTime);
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
          disabled={changeRequests.length > 0}
          onClick={() => {
            const startTime = new AttendanceDateTime()
              .setDate(workDate)
              .setWorkStart()
              .toISOString();
            setValue("startTime", startTime, { shouldDirty: true });
          }}
        />
      </Box>
    </Stack>
  );
}
