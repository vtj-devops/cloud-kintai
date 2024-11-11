import { Switch } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import { Label } from "./Label";

export function PaidHolidayFlagInput() {
  const { control } = useContext(AttendanceEditContext);

  if (!control) {
    return null;
  }

  return (
    <>
      <Label variant="body1">有給休暇</Label>
      <Controller
        name="paidHolidayFlag"
        control={control}
        render={({ field }) => (
          <Switch
            {...field}
            checked={field.value || false}
            onChange={field.onChange}
          />
        )}
      />
    </>
  );
}
