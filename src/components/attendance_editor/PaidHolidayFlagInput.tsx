import { Box, Checkbox, Stack } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function PaidHolidayFlagInput() {
  const { workDate, control, setValue } = useContext(AttendanceEditContext);

  if (!workDate || !setValue || !control) {
    return null;
  }

  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>有給休暇</Box>
      <Box>
        <Controller
          name="paidHolidayFlag"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              checked={field.value || false}
              onChange={(e) => {
                setValue("paidHolidayFlag", e.target.checked);
                field.onChange(e);

                if (!e.target.checked) return;

                setValue(
                  "startTime",
                  new AttendanceDateTime()
                    .setDate(workDate)
                    .setWorkStart()
                    .toISOString()
                );
                setValue(
                  "endTime",
                  new AttendanceDateTime()
                    .setDate(workDate)
                    .setWorkEnd()
                    .toISOString()
                );
                setValue("rests", [
                  {
                    startTime: new AttendanceDateTime()
                      .setDate(workDate)
                      .setRestStart()
                      .toISOString(),
                    endTime: new AttendanceDateTime()
                      .setDate(workDate)
                      .setRestEnd()
                      .toISOString(),
                  },
                ]);
              }}
            />
          )}
        />
      </Box>
    </Stack>
  );
}
