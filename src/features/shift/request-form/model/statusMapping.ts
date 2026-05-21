import {
  normalizeStatus,
  type ShiftRequestDayStatus,
  shiftRequestStatusToStatus,
  statusToShiftRequestStatus,
} from "@entities/shift/lib/statusMapping";

export type SelectedDateMap = Record<string, { status: ShiftRequestDayStatus }>;

export type { ShiftRequestDayStatus };
export { normalizeStatus, shiftRequestStatusToStatus, statusToShiftRequestStatus };
