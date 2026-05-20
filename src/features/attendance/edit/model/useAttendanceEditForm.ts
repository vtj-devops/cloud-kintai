import { attendanceEditSchema } from "@entities/attendance/validation/attendanceEditSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { AttendanceEditInputs, defaultValues } from "./common";

export function useAttendanceEditForm() {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isDirty, isValid, isSubmitting },
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
    fields: systemCommentFields,
    update: systemCommentUpdate,
    replace: systemCommentReplace,
  } = useFieldArray({
    control,
    name: "systemComments",
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

  const setSubmitError = useCallback(
    (message: string) => {
      setError("root.submit", {
        type: "submit",
        message,
      });
    },
    [setError],
  );

  const clearSubmitError = useCallback(() => {
    clearErrors("root.submit");
  }, [clearErrors]);

  const submitErrorMessage = useMemo(() => {
    const message = errors.root?.submit?.message;
    return typeof message === "string" ? message : null;
  }, [errors.root]);

  return {
    register,
    control,
    watch,
    setValue,
    getValues,
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
    systemCommentFields,
    systemCommentUpdate,
    systemCommentReplace,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace,
    submitErrorMessage,
    setSubmitError,
    clearSubmitError,
  };
}
