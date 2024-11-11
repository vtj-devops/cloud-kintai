import { Checkbox, Stack, styled, Typography } from "@mui/material";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceEditContext } from "../AttendanceEditProvider";

const Label = styled(Typography)(() => ({
  width: "150px",
  fontWeight: "bold",
}));

export default function ReturnDirectlyFlagInput() {
  const { control, changeRequests } = useContext(AttendanceEditContext);

  if (!control) {
    return null;
  }

  return (
    <Stack direction="row" alignItems={"center"}>
      <Label variant="body1" sx={{ fontWeight: "bold", width: "150px" }}>
        直帰
      </Label>
      <Controller
        name="returnDirectlyFlag"
        control={control}
        disabled={changeRequests.length > 0}
        render={({ field }) => (
          <Checkbox checked={field.value || false} {...field} />
        )}
      />
    </Stack>
  );
}
