import { Checkbox } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function ReturnDirectlyFlagInput() {
  const { workDate, control, setValue } = useContext(AttendanceEditContext);

  if (!workDate || !control || !setValue) {
    return null;
  }

  const endTime = new AttendanceDateTime()
    .setDate(workDate)
    .setWorkEnd()
    .toISOString();

  return (
    <Controller
      name="returnDirectlyFlag"
      control={control}
      render={({ field }) => (
        <Checkbox
          {...field}
          checked={field.value || false}
          onChange={() => {
            setValue("endTime", !field.value ? endTime : null);
            field.onChange(!field.value);
          }}
        />
      )}
    />
  );
}
