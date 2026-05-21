import { ShiftRequestStatus } from "@shared/api/graphql/types";

export type ShiftState = "work" | "fixedOff" | "requestedOff" | "auto";
export type ShiftStateWithEmpty = ShiftState | "empty";
export type ShiftRequestDayStatus = ShiftState;

export const statusToShiftRequestStatus: Record<
  ShiftRequestDayStatus,
  ShiftRequestStatus
> = {
  work: ShiftRequestStatus.WORK,
  fixedOff: ShiftRequestStatus.FIXED_OFF,
  requestedOff: ShiftRequestStatus.REQUESTED_OFF,
  auto: ShiftRequestStatus.AUTO,
};

export const shiftRequestStatusToShiftState = (
  status?: ShiftRequestStatus | null,
): ShiftState => {
  switch (status) {
    case ShiftRequestStatus.WORK:
      return "work";
    case ShiftRequestStatus.FIXED_OFF:
      return "fixedOff";
    case ShiftRequestStatus.REQUESTED_OFF:
      return "requestedOff";
    case ShiftRequestStatus.AUTO:
    default:
      return "auto";
  }
};

export const shiftRequestStatusToShiftStateWithEmpty = (
  status?: ShiftRequestStatus | null,
): ShiftStateWithEmpty => {
  switch (status) {
    case ShiftRequestStatus.WORK:
      return "work";
    case ShiftRequestStatus.FIXED_OFF:
      return "fixedOff";
    case ShiftRequestStatus.REQUESTED_OFF:
      return "requestedOff";
    case ShiftRequestStatus.AUTO:
      return "auto";
    default:
      return "empty";
  }
};

export const shiftStateToShiftRequestStatus = (
  state: ShiftState,
): ShiftRequestStatus => statusToShiftRequestStatus[state];

export const shiftStateWithEmptyToShiftRequestStatus = (
  state: ShiftStateWithEmpty,
): ShiftRequestStatus | null => {
  if (state === "empty") {
    return null;
  }
  return statusToShiftRequestStatus[state];
};

export const shiftRequestStatusToStatus = (
  status?: ShiftRequestStatus | null,
): ShiftRequestDayStatus => shiftRequestStatusToShiftState(status);

export const normalizeStatus = (value?: string): ShiftRequestDayStatus => {
  if (
    value === "work" ||
    value === "fixedOff" ||
    value === "requestedOff" ||
    value === "auto"
  ) {
    return value;
  }
  if (value === "off") {
    return "fixedOff";
  }
  return "auto";
};
