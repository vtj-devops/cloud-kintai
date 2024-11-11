import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import { Label } from "./Label";

export function SubstituteHolidayDateInput() {
  const { control, setValue, restReplace } = useContext(AttendanceEditContext);

  if (!control || !setValue || !restReplace) {
    return null;
  }

  return (
    <>
      <Label variant="body1">振替休暇</Label>
      <Controller
        name="substituteHolidayDate"
        control={control}
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
    </>
  );
}
