import { Switch } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import { Label } from "./Label";

export function GoDirectlyFlagInput() {
  const { control } = useContext(AttendanceEditContext);

  if (!control) {
    return null;
  }

  return (
    <>
      <Label variant="body1">直行</Label>
      <Controller
        name="goDirectlyFlag"
        control={control}
        render={({ field }) => (
          <Switch checked={field.value || false} {...field} />
        )}
      />
    </>
  );
}
