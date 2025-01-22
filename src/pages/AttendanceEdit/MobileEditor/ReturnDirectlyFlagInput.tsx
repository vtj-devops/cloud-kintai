import { Switch } from "@mui/material";
import { Control, Controller } from "react-hook-form";

import { AttendanceEditInputs } from "../common";
import { Label } from "./Label";

export function ReturnDirectlyFlagInput({
  control,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AttendanceEditInputs, any>;
}) {
  return (
    <>
      <Label variant="body1">直帰</Label>
      <Controller
        name="returnDirectlyFlag"
        control={control}
        render={({ field }) => (
          <Switch checked={field.value || false} {...field} />
        )}
      />
    </>
  );
}
