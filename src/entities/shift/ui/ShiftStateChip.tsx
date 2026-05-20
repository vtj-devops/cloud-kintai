import type { ShiftState } from "@entities/shift/lib/statusMapping";
import StatusChip from "@shared/ui/chips/StatusChip";

type FeedbackKey = "success" | "warning" | "danger" | "info";

const SHIFT_STATE_LABEL_MAP: Record<ShiftState, string> = {
  work: "出勤",
  fixedOff: "固定休",
  requestedOff: "希望休",
  auto: "自動調整枠",
};

const SHIFT_STATE_COLOR_MAP: Partial<Record<ShiftState, FeedbackKey>> = {
  work: "success",
  fixedOff: "danger",
  requestedOff: "warning",
  auto: "info",
};

interface ShiftStateChipProps {
  state: ShiftState;
}

export default function ShiftStateChip({ state }: ShiftStateChipProps) {
  return (
    <StatusChip
      status={state}
      labelMap={SHIFT_STATE_LABEL_MAP}
      colorMap={SHIFT_STATE_COLOR_MAP}
    />
  );
}
