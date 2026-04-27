import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import PaidHolidayFlagInputCommon from "@features/attendance/edit/ui/PaidHolidayFlagInput";
import { useContext } from "react";

export function PaidHolidayFlagInput() {
  const context = useContext(AttendanceEditContext);
  const { control, setValue, restReplace, getValues } = context;

  if (!control) return null;

  return (
    <PaidHolidayFlagInputCommon
      label="有給休暇(1日)"
      control={control}
      setValue={setValue!}
      restReplace={restReplace}
      getValues={getValues}
      setPaidHolidayTimes={true}
    />
  );
}
