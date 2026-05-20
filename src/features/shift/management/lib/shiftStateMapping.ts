import {
  shiftRequestStatusToShiftState,
  type ShiftState,
  shiftStateToShiftRequestStatus,
} from "@entities/shift/lib/statusMapping";

export { shiftRequestStatusToShiftState, shiftStateToShiftRequestStatus };

export type ShiftStateVisual = { label: string; color: string };

export const SHIFT_MANUAL_CHANGE_REASON = "shift-management/manual-edit";

export const statusVisualMap: Record<ShiftState, ShiftStateVisual> = {
  work: { label: "○", color: "success.main" },
  fixedOff: { label: "固", color: "error.main" },
  requestedOff: { label: "希", color: "warning.main" },
  auto: { label: "△", color: "info.main" },
};

export const defaultStatusVisual: ShiftStateVisual = {
  label: "-",
  color: "text.secondary",
};

export const shiftStateOptions: Array<{ value: ShiftState; label: string }> = [
  { value: "work", label: "出勤" },
  { value: "fixedOff", label: "固定休" },
  { value: "requestedOff", label: "希望休" },
  { value: "auto", label: "自動調整枠" },
];
