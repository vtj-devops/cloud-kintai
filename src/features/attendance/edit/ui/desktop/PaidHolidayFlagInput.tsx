import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import PaidHolidayFlagInputCommon from "@features/attendance/edit/ui/PaidHolidayFlagInput";
import { useContext } from "react";

export default function PaidHolidayFlagInput() {
  const {
    control,
    changeRequests,
    setValue,
    restReplace,
    getValues,
    workDate,
  } = useContext(AttendanceEditContext);
  if (!control || !setValue) return null;
  return (
    <PaidHolidayFlagInputCommon
      label="有給休暇(1日)"
      control={control}
      setValue={setValue}
      workDate={workDate ? workDate.format("YYYY-MM-DD") : undefined}
      restReplace={restReplace}
      getValues={getValues}
      setPaidHolidayTimes={true}
      disabled={changeRequests.length > 0}
    />
  );
}
