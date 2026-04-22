import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { attendanceEditSchema } from "@entities/attendance/validation/attendanceEditSchema";
import { AttendanceEditInputs, defaultValues } from "@features/attendance/edit/model/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { Attendance } from "@shared/api/graphql/types";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { useContext } from "react";
import { useFieldArray,useForm } from "react-hook-form";

import { useAttendanceEditFormSync } from "./useAttendanceEditFormSync";

type UseAttendanceFormParams = {
  attendance: Attendance | null;
  targetWorkDate: string | undefined;
  targetWorkDateISO: string | null;
  staffId: string | null;
};

export function useAttendanceForm({
  attendance,
  targetWorkDate,
  targetWorkDateISO,
  staffId,
}: UseAttendanceFormParams) {
  const {
    getHourlyPaidHolidayEnabled,
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);

  const hourlyPaidHolidayEnabled = getHourlyPaidHolidayEnabled();

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, isSubmitting, errors },
  } = useForm<AttendanceEditInputs>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(attendanceEditSchema),
  });

  const {
    fields: restFields,
    append: restAppend,
    remove: restRemove,
    update: restUpdate,
    replace: restReplace,
  } = useFieldArray({
    control,
    name: "rests",
  });

  const {
    fields: hourlyPaidHolidayTimeFields,
    append: hourlyPaidHolidayTimeAppend,
    remove: hourlyPaidHolidayTimeRemove,
    update: hourlyPaidHolidayTimeUpdate,
    replace: hourlyPaidHolidayTimeReplace,
  } = useFieldArray({
    control,
    name: "hourlyPaidHolidayTimes",
  });

  const { dialog, runWithoutGuard } = usePageLeaveGuard({
    isDirty,
    isBusy: isSubmitting,
  });

  const { isOnBreak } = useAttendanceEditFormSync({
    control,
    setValue,
    getValues,
    reset,
    restReplace,
    hourlyPaidHolidayTimeReplace,
    attendance,
    targetWorkDate,
    targetWorkDateISO,
    staffId,
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  });

  return {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    errors,
    restFields,
    restAppend,
    restRemove,
    restUpdate,
    restReplace,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace,
    hourlyPaidHolidayEnabled,
    isOnBreak,
    dialog,
    runWithoutGuard,
  };
}
