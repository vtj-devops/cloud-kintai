import { useAttendanceEditUi } from "@features/attendance/edit/model/AttendanceEditProvider";
import TimeInputField from "@features/attendance/edit/ui/shared/TimeInputField";
import {
  formatISOToTimeOrEmpty,
  isCompleteTime,
  normalizeTimeDraft,
  parseTimeToISOOrNull,
} from "@shared/lib/time";
import { type Dayjs } from "dayjs";
import { useRef, useState } from "react";
import { Controller } from "react-hook-form";

import {
  AttendanceControl,
  AttendanceFieldValue,
  AttendanceSetValue,
  AttendanceTimeFieldName,
} from "../../../model/types";

interface TimeInputBaseProps<TFieldName extends AttendanceTimeFieldName> {
  name: TFieldName;
  control: AttendanceControl;
  setValue: AttendanceSetValue;
  workDate: Dayjs;
  quickInputTimes: { time: string; enabled: boolean }[];
  disabled?: boolean;
  highlight?: boolean;
  dataTestId?: string;
}

export default function TimeInputBase<
  TFieldName extends AttendanceTimeFieldName,
>({
  name,
  control,
  setValue,
  workDate,
  quickInputTimes,
  disabled = false,
  highlight = false,
  dataTestId,
}: TimeInputBaseProps<TFieldName>) {
  const { readOnly } = useAttendanceEditUi();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputDraft, setInputDraft] = useState("");
  const blurTimeoutRef = useRef<number | null>(null);

  if (!workDate || !control || !setValue) return null;

  return (
    <div className="flex w-full min-w-0 flex-row gap-1">
      <Controller
        key={highlight ? "highlight-on" : "highlight-off"}
        name={name}
        control={control}
        render={({ field }) => (
          <TimeInputField
            value={isEditing ? inputDraft : toTimeValue(field.value)}
            inputRef={field.ref}
            disabled={disabled}
            readOnly={!!readOnly}
            highlight={highlight}
            selectableTimes={quickInputTimes}
            isOptionsOpen={isOptionsOpen}
            ariaLabel={`${name}-time-options`}
            dataTestId={dataTestId}
            onFocus={() => {
              setIsEditing(true);
              setInputDraft(formatISOToTimeOrEmpty(field.value));
              if (!readOnly && !disabled && quickInputTimes.some((t) => t.enabled)) {
                if (blurTimeoutRef.current) {
                  window.clearTimeout(blurTimeoutRef.current);
                  blurTimeoutRef.current = null;
                }
                setIsOptionsOpen(true);
              }
            }}
            onBlur={() => {
              field.onBlur();
              const nextDraft = normalizeTimeDraft(inputDraft);
              if (isCompleteTime(nextDraft)) {
                const formatted = toIsoDateTime(
                  nextDraft,
                  workDate,
                ) as AttendanceFieldValue<TFieldName>;
                field.onChange(formatted);
                setValue(
                  name as AttendanceTimeFieldName,
                  formatted as AttendanceFieldValue<AttendanceTimeFieldName>,
                );
              } else {
                setInputDraft(formatISOToTimeOrEmpty(field.value));
              }
              setIsEditing(false);
              blurTimeoutRef.current = window.setTimeout(() => {
                setIsOptionsOpen(false);
                blurTimeoutRef.current = null;
              }, 120);
            }}
            onChange={(draft) => {
              const nextDraft = normalizeTimeDraft(draft);
              setInputDraft(nextDraft);
              if (!isCompleteTime(nextDraft)) {
                return;
              }
              const formatted = toIsoDateTime(
                nextDraft,
                workDate,
              ) as AttendanceFieldValue<TFieldName>;
              field.onChange(formatted);
              setValue(
                name as AttendanceTimeFieldName,
                formatted as AttendanceFieldValue<AttendanceTimeFieldName>,
              );
            }}
            onSelectTime={(time) => {
              const formatted = toIsoDateTime(
                time,
                workDate,
              ) as AttendanceFieldValue<TFieldName>;
              setInputDraft(time);
              setIsEditing(false);
              field.onChange(formatted);
              setValue(
                name as AttendanceTimeFieldName,
                formatted as AttendanceFieldValue<AttendanceTimeFieldName>,
                { shouldDirty: true },
              );
              if (blurTimeoutRef.current) {
                window.clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              setIsOptionsOpen(false);
            }}
            onDropdownToggle={() => {
              if (readOnly || disabled) return;
              if (blurTimeoutRef.current) {
                window.clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              setIsEditing(false);
              setInputDraft(formatISOToTimeOrEmpty(field.value));
              setIsOptionsOpen((prev) => !prev);
            }}
          />
        )}
      />
    </div>
  );
}

function toTimeValue(value: string | null | undefined) {
  return formatISOToTimeOrEmpty(value);
}

function toIsoDateTime(value: string, workDate: Dayjs): string | null {
  return parseTimeToISOOrNull(value, workDate);
}
