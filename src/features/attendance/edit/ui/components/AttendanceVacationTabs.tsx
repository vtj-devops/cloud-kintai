import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import { Checkbox } from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
import { type ReactNode } from "react";
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayReplace,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";

import type {
  AttendanceEditInputs,
} from "../../model/common";
import IsDeemedHolidayFlagInput from "../IsDeemedHolidayFlagInput";
import HourlyPaidHolidayTimeItem from "../items/HourlyPaidHolidayTimeItem";
import { SubstituteHolidayDateInput } from "../items/SubstituteHolidayDateInput";
import PaidHolidayFlagInputCommon from "../PaidHolidayFlagInput";
import { VacationTabs } from "./VacationTabs";

type AttendanceVacationTabsProps = {
  value: number;
  onChange: (index: number) => void;
  control: Control<AttendanceEditInputs>;
  setValue: UseFormSetValue<AttendanceEditInputs>;
  getValues: UseFormGetValues<AttendanceEditInputs>;
  restReplace: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  workDateIso?: string;
  readOnly?: boolean;
  changeRequestsLength: number;
  getAbsentEnabled: () => boolean;
  getSpecialHolidayEnabled: () => boolean;
  getHourlyPaidHolidayEnabled: () => boolean;
  handleAbsentFlagChange: (checked: boolean) => void;
  handleSpecialHolidayFlagChange: (checked: boolean) => void;
  hourlyPaidHolidayTimeFields: FieldArrayWithId<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes",
    "id"
  >[];
  hourlyPaidHolidayTimeAppend: UseFieldArrayAppend<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
  staffWorkType?: string | null;
};

export function AttendanceVacationTabs({
  value,
  onChange,
  control,
  setValue,
  getValues,
  restReplace,
  workDateIso,
  readOnly,
  changeRequestsLength,
  getAbsentEnabled,
  getSpecialHolidayEnabled,
  getHourlyPaidHolidayEnabled,
  handleAbsentFlagChange,
  handleSpecialHolidayFlagChange,
  hourlyPaidHolidayTimeFields,
  hourlyPaidHolidayTimeAppend,
  staffWorkType,
}: AttendanceVacationTabsProps) {
  const items: {
    label: string;
    content: ReactNode;
  }[] = [];

  items.push({
    label: "振替休日",
    content: <SubstituteHolidayDateInput />,
  });

  items.push({
    label: "有給(1日)",
    content: (
      <PaidHolidayFlagInputCommon
        label="有給休暇(1日)"
        control={control}
        setValue={setValue}
        workDate={workDateIso}
        setPaidHolidayTimes={true}
        disabled={changeRequestsLength > 0 || !!readOnly}
        restReplace={restReplace}
        getValues={getValues}
      />
    ),
  });

  if (getAbsentEnabled()) {
    items.push({
      label: "欠勤",
      content: (
        <div className="mt-1">
          <div className="flex items-center">
            <div className="w-[150px] font-bold">欠勤</div>
            <div>
              <Controller
                name="absentFlag"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAbsentFlagChange(e.target.checked);
                    }}
                    disabled={changeRequestsLength > 0 || !!readOnly}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ),
    });
  }

  if (getSpecialHolidayEnabled()) {
    items.push({
      label: "特別休暇",
      content: (
        <div className="mt-1">
          <div className="flex items-center">
            <div className="w-[150px] font-bold">特別休暇</div>
            <div>
              <Controller
                name="specialHolidayFlag"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => {
                      field.onChange(e);
                      handleSpecialHolidayFlagChange(e.target.checked);
                    }}
                    disabled={changeRequestsLength > 0 || !!readOnly}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ),
    });
  }

  if (getHourlyPaidHolidayEnabled()) {
    items.push({
      label: `時間単位(${hourlyPaidHolidayTimeFields.length}件)`,
      content: (
        <div className="flex flex-col gap-1">
          <div className="flex">
            <div className="w-[150px] font-bold">{`時間単位休暇(${hourlyPaidHolidayTimeFields.length}件)`}</div>
            <div className="flex grow flex-col gap-1">
              {hourlyPaidHolidayTimeFields.length === 0 && (
                <div className="text-sm text-slate-500">
                  時間単位休暇の時間帯を追加してください。
                </div>
              )}
              {hourlyPaidHolidayTimeFields.map((hourlyPaidHolidayTime, index) => (
                <HourlyPaidHolidayTimeItem
                  key={hourlyPaidHolidayTime.id}
                  time={hourlyPaidHolidayTime}
                  index={index}
                />
              ))}
              <div>
                <AppIconButton
                  aria-label="add-hourly-paid-holiday-time"
                  onClick={() =>
                    hourlyPaidHolidayTimeAppend({
                      startTime: null,
                      endTime: null,
                    })
                  }
                  disabled={!!readOnly}
                  tone="primary"
                >
                  <AddAlarmIcon />
                </AppIconButton>
              </div>
            </div>
          </div>
        </div>
      ),
    });
  }

  items.push({
    label: "指定休日",
    content: (
      <div className="mt-1">
        <IsDeemedHolidayFlagInput
          control={control}
          name="isDeemedHoliday"
          disabled={!(staffWorkType === "shift") || !!readOnly}
          helperText={
            staffWorkType === "shift"
              ? undefined
              : "※シフト勤務のスタッフのみ設定できます"
          }
        />
      </div>
    ),
  });

  return (
    <VacationTabs
      value={value}
      onChange={onChange}
      items={items}
      panelPadding={2}
      tabsProps={{
        "aria-label": "vacation-tabs",
        sx: { borderBottom: 1, borderColor: "divider" },
      }}
    />
  );
}