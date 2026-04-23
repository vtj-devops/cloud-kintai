import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import {
  AttendanceControl,
  AttendanceGetValues,
  AttendanceSetValue,
} from "@features/attendance/edit/model/types";
import HourlyPaidHolidayTimeItemMobile from "@features/attendance/edit/ui/items/HourlyPaidHolidayTimeItemMobile";
import { Label } from "@features/attendance/edit/ui/mobile/Label";
import PaidHolidayFlagInputMobile from "@features/attendance/edit/ui/PaidHolidayFlagInputMobile";
import dayjs from "dayjs";
import { ReactNode } from "react";
import {
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayReplace,
} from "react-hook-form";

import { SubstituteHolidayDateInput } from "./SubstituteHolidayDateInput";

interface MobilePaidHolidaySectionProps {
  control: AttendanceControl;
  setValue: AttendanceSetValue;
  workDate: dayjs.Dayjs | null | undefined;
  restReplace: UseFieldArrayReplace<AttendanceEditInputs, "rests"> | undefined;
  getValues: AttendanceGetValues | undefined;
  getSpecialHolidayEnabled: (() => boolean) | undefined;
  changeRequestsLength: number;
  hourlyPaidHolidayEnabled: boolean;
  hourlyPaidHolidayTimeFields: FieldArrayWithId<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes",
    "id"
  >[];
  hourlyPaidHolidayTimeAppend:
    | UseFieldArrayAppend<AttendanceEditInputs, "hourlyPaidHolidayTimes">
    | undefined;
}

type HolidayTableRowProps = {
  label: string;
  withBottomBorder?: boolean;
  children: ReactNode;
};

function HolidayTableRow({
  label,
  withBottomBorder = false,
  children,
}: HolidayTableRowProps) {
  return (
    <div
      className={[
        "grid grid-cols-[7.5rem_1fr]",
        withBottomBorder ? "border-b border-slate-200/80" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
        {label}
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

type HourlyPaidHolidayListProps = {
  enabled: boolean;
  fields: FieldArrayWithId<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes",
    "id"
  >[];
  append:
    | UseFieldArrayAppend<AttendanceEditInputs, "hourlyPaidHolidayTimes">
    | undefined;
};

function HourlyPaidHolidayList({
  enabled,
  fields,
  append,
}: HourlyPaidHolidayListProps) {
  if (!enabled) {
    return (
      <p className="m-0 text-sm leading-relaxed text-slate-500">
        時間単位休暇は無効です。
      </p>
    );
  }

  return (
    <>
      {fields.length === 0 && (
        <p className="m-0 text-sm leading-relaxed text-slate-500">
          時間帯を追加してください。
        </p>
      )}
      {fields.map((time, index) => (
        <HourlyPaidHolidayTimeItemMobile
          key={time.id}
          time={time}
          index={index}
        />
      ))}
      <button
        type="button"
        disabled={!append}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-500/25 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-[background-color,border-color,color,opacity] duration-150 ease-in-out hover:border-emerald-500/40 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          if (append) {
            append({
              startTime: null,
              endTime: null,
            });
          }
        }}
      >
        <span className="text-base leading-none">+</span>
        時間休暇を追加
      </button>
    </>
  );
}

export function MobilePaidHolidaySection({
  control,
  setValue,
  workDate,
  restReplace,
  getValues,
  getSpecialHolidayEnabled,
  changeRequestsLength,
  hourlyPaidHolidayEnabled,
  hourlyPaidHolidayTimeFields,
  hourlyPaidHolidayTimeAppend,
}: MobilePaidHolidaySectionProps) {
  const specialHolidayEnabled = getSpecialHolidayEnabled?.() ?? false;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-slate-200/80">
        <HolidayTableRow label="有給休暇" withBottomBorder>
          <PaidHolidayFlagInputMobile
            control={control}
            setValue={setValue}
            workDate={workDate ? workDate.format("YYYY-MM-DD") : undefined}
            setPaidHolidayTimes={true}
            restReplace={restReplace}
            getValues={getValues}
            hideLabel
          />
        </HolidayTableRow>

        {specialHolidayEnabled ? (
          <HolidayTableRow label="特別休暇" withBottomBorder>
            <div className="flex flex-col items-start gap-2">
              <p className="m-0 text-sm leading-relaxed text-slate-500">
                有給休暇ではない特別な休暇(忌引きなど)です。利用時は管理者へご相談ください。
              </p>
              <Controller
                name="specialHolidayFlag"
                control={control}
                render={({ field }) => (
                  <label className="inline-flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={changeRequestsLength > 0}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                    />
                    <span className="text-sm text-slate-600">有効にする</span>
                  </label>
                )}
              />
            </div>
          </HolidayTableRow>
        ) : null}

        <HolidayTableRow label="振替休暇">
          <SubstituteHolidayDateInput hideLabel />
        </HolidayTableRow>
      </div>

      <Label>時間休暇</Label>
      <HourlyPaidHolidayList
        enabled={hourlyPaidHolidayEnabled}
        fields={hourlyPaidHolidayTimeFields}
        append={hourlyPaidHolidayTimeAppend}
      />
    </div>
  );
}
