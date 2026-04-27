import { AttendanceSetValue } from "@features/attendance/edit/model/types";

export type ReasonItem = {
  reason: string;
  enabled: boolean;
};

export function getEnabledReasons(
  reasons: { reason: string; enabled: boolean }[],
): ReasonItem[] {
  return reasons.filter((reason) => reason.enabled);
}

export function createSelectReasonHandler(setValue: AttendanceSetValue) {
  return (reason: string) => {
    setValue("staffComment", reason, {
      shouldDirty: true,
    });
  };
}
