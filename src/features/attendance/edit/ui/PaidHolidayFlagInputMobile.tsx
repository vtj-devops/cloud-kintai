import useAppConfig from "@entities/app-config/model/useAppConfig";
import { buildPaidHolidayToggleValues } from "@features/attendance/edit/lib/paidHolidayToggle";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import { Controller, UseFieldArrayReplace } from "react-hook-form";

import {
  AttendanceControl,
  AttendanceControllerField,
  AttendanceGetValues,
  AttendanceSetValue,
} from "../model/types";

type PaidHolidayFlagField = AttendanceControllerField<"paidHolidayFlag">;

interface PaidHolidayFlagInputProps {
  label?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  control: AttendanceControl;
  setValue: AttendanceSetValue;
  workDate?: string;
  setPaidHolidayTimes?: boolean;
  restReplace?: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  getValues?: AttendanceGetValues;
}

export default function PaidHolidayFlagInputMobile({
  label = "有給休暇",
  disabled = false,
  hideLabel = false,
  control,
  setValue,
  workDate,
  setPaidHolidayTimes = false,
  restReplace,
  getValues,
}: PaidHolidayFlagInputProps) {
  const {
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useAppConfig();

  if (!control || !setValue) return null;

  const handleChange = (
    checked: boolean,
    field: PaidHolidayFlagField
  ) => {
    setValue("paidHolidayFlag", checked);
    field.onChange(checked);

    const toggleValues = buildPaidHolidayToggleValues({
      checked,
      setPaidHolidayTimes,
      workDate,
      remarkTags: getRemarkTags(getValues),
      specialHolidayFlag: getSpecialHolidayFlag(getValues),
      timeConfig: {
        startTime: getStartTime(),
        endTime: getEndTime(),
        restStartTime: getLunchRestStartTime(),
        restEndTime: getLunchRestEndTime(),
      },
    });

    if (toggleValues.timeValues) {
      setValue("startTime", toggleValues.timeValues.startTime);
      setValue("endTime", toggleValues.timeValues.endTime);
      if (restReplace && typeof restReplace === "function") {
        restReplace(toggleValues.timeValues.rests);
      } else {
        setValue("rests", toggleValues.timeValues.rests);
      }
    }

    if (toggleValues.nextRemarkTags) {
      setValue("remarkTags", toggleValues.nextRemarkTags);
    }

    if (toggleValues.shouldClearSpecialHolidayFlag) {
      setValue("specialHolidayFlag", false);
    }
  };

  return (
    <>
      {!hideLabel ? <Label variant="body1">{label}</Label> : null}
      <div className="flex flex-col items-start gap-3">
        <div className="text-sm leading-6 text-slate-500">
          1日有給を取得する場合はチェックを入れてください。既定の勤務開始／終了時刻と休憩がセットされます。
        </div>
        <Controller
          name="paidHolidayFlag"
          control={control}
          disabled={disabled}
          render={({ field }) => (
            <label className="inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={field.value || false}
                onChange={(e) => handleChange(e.target.checked, field)}
                disabled={disabled}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              <span className="text-sm text-slate-600">有効にする</span>
            </label>
          )}
        />
      </div>
    </>
  );
}

function getRemarkTags(getValues: AttendanceGetValues | undefined): string[] {
  try {
    return ((getValues?.("remarkTags") as string[]) || []).filter(Boolean);
  } catch {
    return [];
  }
}

function getSpecialHolidayFlag(
  getValues: AttendanceGetValues | undefined
): boolean {
  try {
    return Boolean(getValues?.("specialHolidayFlag"));
  } catch {
    return false;
  }
}
