import { Checkbox } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function GoDirectlyFlagInput() {
  const { control, setValue, workDate } = useContext(AttendanceEditContext);

  if (!workDate || !control || !setValue) {
    return null;
  }

  const startTime = new AttendanceDateTime()
    .setDate(workDate)
    .setWorkStart()
    .toISOString();

  return (
    <Controller
      name="goDirectlyFlag"
      control={control}
      render={({ field }) => (
        <Checkbox
          {...field}
          checked={field.value || false}
          onChange={() => {
            setValue("startTime", !field.value ? startTime : null);
            field.onChange(!field.value);
          }}
        />
      )}
    />
  );
}
