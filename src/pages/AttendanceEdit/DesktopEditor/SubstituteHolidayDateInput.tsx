import { Stack, styled, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { AttendanceEditContext } from "../AttendanceEditProvider";

const Label = styled(Typography)(() => ({
  width: "150px",
  fontWeight: "bold",
}));

export function SubstituteHolidayDateInput() {
  const { control, setValue, restReplace, changeRequests } = useContext(
    AttendanceEditContext
  );

  if (!control || !setValue || !restReplace) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0} alignItems={"center"}>
      <Label variant="body1">振替休日</Label>
      <Controller
        name="substituteHolidayDate"
        control={control}
        disabled={changeRequests.length > 0}
        render={({ field }) => (
          <DatePicker
            {...field}
            label="勤務した日"
            format={AttendanceDate.DisplayFormat}
            value={field.value ? dayjs(field.value) : null}
            slotProps={{
              textField: { size: "small" },
            }}
            onChange={(date) => {
              field.onChange(date);

              if (date) {
                setValue("paidHolidayFlag", false);
                setValue("goDirectlyFlag", false);
                setValue("returnDirectlyFlag", false);
                setValue("startTime", null);
                setValue("endTime", null);
                restReplace([]);
              }
            }}
          />
        )}
      />
    </Stack>
  );
}
