import { TimeInput } from "@shared/ui/TimeInput/TimeInput";
import type { ReactNode } from "react";

type TimeRangeInputProps = {
  startLabel?: string;
  endLabel?: string;
  startValue: string | null;
  endValue: string | null;
  baseDate: string;
  onStartChange: (value: string | null) => void;
  onEndChange: (value: string | null) => void;
  variant?: "desktop" | "mobile";
  size?: "small" | "medium";
  disabled?: boolean;
  startError?: boolean;
  endError?: boolean;
  startHelperText?: ReactNode;
  endHelperText?: ReactNode;
};

export function TimeRangeInput({
  startLabel,
  endLabel,
  startValue,
  endValue,
  baseDate,
  onStartChange,
  onEndChange,
  variant = "desktop",
  size,
  disabled,
  startError,
  endError,
  startHelperText,
  endHelperText,
}: TimeRangeInputProps) {
  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-1 gap-2">
        <TimeInput
          label={startLabel}
          value={startValue}
          onChange={onStartChange}
          baseDate={baseDate}
          size={size}
          disabled={disabled}
          error={startError}
          helperText={startHelperText}
        />
        <TimeInput
          label={endLabel}
          value={endValue}
          onChange={onEndChange}
          baseDate={baseDate}
          size={size}
          disabled={disabled}
          error={endError}
          helperText={endHelperText}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <TimeInput
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        baseDate={baseDate}
        size={size}
        disabled={disabled}
        error={startError}
        helperText={startHelperText}
      />
      <span className="text-sm text-slate-500">～</span>
      <TimeInput
        label={endLabel}
        value={endValue}
        onChange={onEndChange}
        baseDate={baseDate}
        size={size}
        disabled={disabled}
        error={endError}
        helperText={endHelperText}
      />
    </div>
  );
}
