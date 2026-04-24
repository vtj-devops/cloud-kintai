import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  AttendanceEditContext,
  useAttendanceEditUi,
} from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import TimeInputField from "@features/attendance/edit/ui/shared/TimeInputField";
import { useContext, useRef, useState } from "react";
import { Controller, FieldArrayWithId } from "react-hook-form";

import {
  isCompleteTime,
  normalizeTimeDraft,
  toIsoDateTime,
  toTimeValue,
} from "./restTimeInputUtils";

type Props = {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
  testIdPrefix?: string;
};

export default function RestStartTimeInput({
  rest,
  index,
  testIdPrefix = "desktop",
}: Props) {
  const { workDate, control, changeRequests, restUpdate } = useContext(
    AttendanceEditContext,
  );
  const { getLunchRestStartTime } = useContext(AppConfigContext);
  const { readOnly } = useAttendanceEditUi();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputDraft, setInputDraft] = useState("");
  const blurTimeoutRef = useRef<number | null>(null);

  if (!workDate || !control || !restUpdate) return null;

  const disabled = changeRequests.length > 0;
  const lunchTime = getLunchRestStartTime().format("HH:mm");
  const selectableTimes = [{ time: lunchTime, enabled: true }];

  return (
    <div className="flex min-w-0 flex-row gap-1">
      <Controller
        name={`rests.${index}.startTime`}
        control={control}
        render={({ field }) => (
          <TimeInputField
            value={
              isEditing ? inputDraft : toTimeValue(field.value as string | null)
            }
            inputRef={field.ref}
            disabled={disabled}
            readOnly={!!readOnly}
            selectableTimes={selectableTimes}
            isOptionsOpen={isOptionsOpen}
            ariaLabel={`rest-start-time-${index}-options`}
            dataTestId={`rest-start-time-input-${testIdPrefix}-${index}`}
            onFocus={() => {
              setIsEditing(true);
              setInputDraft(toTimeValue(field.value as string | null));
              if (!readOnly && !disabled) {
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
                const formatted = toIsoDateTime(nextDraft, workDate);
                field.onChange(formatted);
                if (formatted)
                  restUpdate(index, { ...rest, startTime: formatted });
              } else {
                setInputDraft(toTimeValue(field.value as string | null));
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
              if (!isCompleteTime(nextDraft)) return;
              const formatted = toIsoDateTime(nextDraft, workDate);
              field.onChange(formatted);
              if (formatted)
                restUpdate(index, { ...rest, startTime: formatted });
            }}
            onSelectTime={(time) => {
              const formatted = toIsoDateTime(time, workDate);
              setInputDraft(time);
              setIsEditing(false);
              field.onChange(formatted);
              if (formatted)
                restUpdate(index, { ...rest, startTime: formatted });
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
              setInputDraft(toTimeValue(field.value as string | null));
              setIsOptionsOpen((prev) => !prev);
            }}
          />
        )}
      />
    </div>
  );
}
