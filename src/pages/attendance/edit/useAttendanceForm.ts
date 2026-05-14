import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { useAttendanceEditForm } from "@features/attendance/edit/model/useAttendanceEditForm";
import { Attendance } from "@shared/api/graphql/types";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { useContext } from "react";

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
    errors,
    isDirty,
    isValid,
    isSubmitting,
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
    submitErrorMessage,
    setSubmitError,
    clearSubmitError,
  } = useAttendanceEditForm();

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
    submitErrorMessage,
    setSubmitError,
    clearSubmitError,
  };
}
