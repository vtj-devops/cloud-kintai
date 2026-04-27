import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  AttendanceEditInputs,
  RestInputs,
} from "@features/attendance/edit/model/common";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import dayjs from "dayjs";
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

    if (!checked) {
      try {
        if (getValues) {
          const tags: string[] = (getValues("remarkTags") as string[]) || [];
          if (tags.includes("有給休暇")) {
            setValue("remarkTags", tags.filter((t) => t !== "有給休暇"));
          }
        }
      } catch {
        // noop
      }
      return;
    }

    if (!setPaidHolidayTimes || !workDate) return;

    const workDayjs = dayjs(workDate);
    const cfgStart = getStartTime();
    const cfgEnd = getEndTime();
    const cfgRestStart = getLunchRestStartTime();
    const cfgRestEnd = getLunchRestEndTime();

    const startDt = workDayjs
      .hour(cfgStart.hour())
      .minute(cfgStart.minute())
      .second(0)
      .millisecond(0);
    const endDt = workDayjs
      .hour(cfgEnd.hour())
      .minute(cfgEnd.minute())
      .second(0)
      .millisecond(0);
    const restStartDt = workDayjs
      .hour(cfgRestStart.hour())
      .minute(cfgRestStart.minute())
      .second(0)
      .millisecond(0);
    const restEndDt = workDayjs
      .hour(cfgRestEnd.hour())
      .minute(cfgRestEnd.minute())
      .second(0)
      .millisecond(0);

    setValue("startTime", startDt.toISOString());
    setValue("endTime", endDt.toISOString());
    const rests: RestInputs[] = [
      {
        startTime: restStartDt.toISOString(),
        endTime: restEndDt.toISOString(),
      },
    ];

    if (restReplace && typeof restReplace === "function") {
      restReplace(rests);
    } else {
      setValue("rests", rests);
    }

    try {
      if (getValues) {
        const tags: string[] = (getValues("remarkTags") as string[]) || [];
        if (!tags.includes("有給休暇")) {
          setValue("remarkTags", [...tags, "有給休暇"]);
        }
      }
    } catch {
      // noop
    }

    // 有給ON時は特別休暇フラグを解除して相互排他にする
    try {
      if (getValues && getValues("specialHolidayFlag")) {
        setValue("specialHolidayFlag", false);
      }
    } catch {
      // noop
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
