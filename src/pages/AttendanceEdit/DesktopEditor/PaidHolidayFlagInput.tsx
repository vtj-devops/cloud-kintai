import { Checkbox, Stack, styled, Typography } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceEditContext } from "../AttendanceEditProvider";

const Label = styled(Typography)(() => ({
  width: "150px",
  fontWeight: "bold",
}));

export default function PaidHolidayFlagInput() {
  const { control, changeRequests } = useContext(AttendanceEditContext);

  if (!control) {
    return null;
  }

  return (
    <Stack direction="row" alignItems={"center"}>
      <Label variant="body1">有給休暇</Label>
      <Controller
        name="paidHolidayFlag"
        control={control}
        disabled={changeRequests.length > 0}
        render={({ field }) => (
          <Checkbox {...field} checked={field.value || false} />
        )}
      />
    </Stack>
  );
}
