import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditPageHeader } from "@features/attendance/edit/ui/components/AttendanceEditPageHeader";
import { AttendanceErrorSummary } from "@features/attendance/edit/ui/components/AttendanceErrorSummary";
import { VacationTabs } from "@features/attendance/edit/ui/components/VacationTabs";
import { GoDirectlyFlagCheckbox } from "@features/attendance/edit/ui/GoDirectlyFlagCheckbox";
import HourlyPaidHolidayTimeItem, {
  calcTotalHourlyPaidHolidayTime,
} from "@features/attendance/edit/ui/items/HourlyPaidHolidayTimeItem";
import ProductionTimeItem from "@features/attendance/edit/ui/items/ProductionTimeItem";
import StaffNameItem from "@features/attendance/edit/ui/items/StaffNameItem";
import { SubstituteHolidayDateInput } from "@features/attendance/edit/ui/items/SubstituteHolidayDateInput";
import WorkTypeItem from "@features/attendance/edit/ui/items/WorkTypeItem";
import QuickInputButtons from "@features/attendance/edit/ui/QuickInputButtons";
import { AppButton, AppIconButton } from "@shared/ui/button";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useFormState } from "react-hook-form";

import ChangeRequestingAlert from "./ChangeRequestingMessage";
import NoDataAlert from "./NoDataAlert";
import PaidHolidayFlagInput from "./PaidHolidayFlagInput";
import RemarksInput from "./RemarksInput";
import { calcTotalRestTime } from "./RestTimeItem/RestTimeInput/RestTimeInput";
import RestTimeItem from "./RestTimeItem/RestTimeItem";
import ReturnDirectlyFlagInput from "./ReturnDirectlyFlagInput";
import StaffCommentInput from "./StaffCommentInput";
import WorkDateItem from "./WorkDateItem";
import {
  calcTotalWorkTime,
  WorkTimeInput,
} from "./WorkTimeInput/WorkTimeInput";

export default function DesktopEditor() {
  const ctx = useContext(AttendanceEditContext);
  const {
    attendance,
    staff,
    onSubmit,
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    changeRequests,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    restReplace,
    hourlyPaidHolidayTimeReplace,
    workDate,
    readOnly,
    errorMessages: contextErrorMessages,
  } = ctx;
  const { errors } = useFormState({ control });
  const { getStartTime } = useAppConfig();
  const { hourlyPaidHolidayEnabled } = useContext(AttendanceEditContext);
  const { getSpecialHolidayEnabled } = useContext(AppConfigContext);
  const [vacationTab, setVacationTab] = useState<number>(0);
  const [totalProductionTime, setTotalProductionTime] = useState<number>(0);
  const [totalHourlyPaidHolidayTime, setTotalHourlyPaidHolidayTime] =
    useState<number>(0);
  const [highlightStartTime, setHighlightStartTime] = useState(false);
  const [highlightEndTime, setHighlightEndTime] = useState(false);
  const errorMessages = useMemo(() => {
    if (contextErrorMessages && contextErrorMessages.length > 0) {
      return contextErrorMessages;
    }
    return collectAttendanceErrorMessages(errors || {});
  }, [contextErrorMessages, errors]);

  useEffect(() => {
    if (!watch) return;

    const unsubscribe = watch((data) => {
      if (!data.endTime) {
        setTotalProductionTime(0);
      } else {
        const totalWorkTime = calcTotalWorkTime(data.startTime, data.endTime);
        const totalRestTime =
          data.rests?.reduce((acc, rest) => {
            if (!rest) return acc;
            const diff = calcTotalRestTime(rest.startTime, rest.endTime);
            return acc + diff;
          }, 0) ?? 0;
        const totalTime = totalWorkTime - totalRestTime;
        setTotalProductionTime(totalTime);
      }
      // 合計時間単位休暇時間
      const totalHourly =
        data.hourlyPaidHolidayTimes?.reduce((acc, time) => {
          if (!time) return acc;
          if (!time.endTime) return acc;
          const diff = calcTotalHourlyPaidHolidayTime(
            time.startTime,
            time.endTime,
          );
          return acc + diff;
        }, 0) ?? 0;
      setTotalHourlyPaidHolidayTime(totalHourly);
    });
    return typeof unsubscribe === "function" ? unsubscribe : undefined;
  }, [watch]);

  if (!staff || !control || !setValue || !watch || !handleSubmit || !register) {
    return null;
  }

  return (
    <div className="w-full px-6 pb-10 pt-2">
      <div className="flex flex-col gap-3">
        <AttendanceEditPageHeader
          description="勤務時間、休憩、休暇、備考をひとつの画面で調整できます。必要な内容を入力して修正申請を行ってください。"
        />
        <div className="flex w-full flex-col gap-2">
          <AttendanceErrorSummary messages={errorMessages} />
          <div className="flex flex-col gap-2">
            <ChangeRequestingAlert changeRequests={changeRequests} />
          </div>
          <NoDataAlert />
          <GroupContainer hideAccent hideBorder className="w-full">
            {setValue && restReplace && hourlyPaidHolidayTimeReplace && (
              <QuickInputButtons
                setValue={setValue}
                restReplace={restReplace}
                hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
                workDate={workDate ?? null}
                visibleMode="staff"
                getValues={getValues}
              />
            )}
          </GroupContainer>
          <GroupContainer hideAccent hideBorder className="w-full">
            <WorkDateItem />
          </GroupContainer>
          <GroupContainer hideAccent hideBorder className="w-full">
            <div className="flex flex-col gap-2">
              <StaffNameItem />
              <WorkTypeItem />
            </div>
          </GroupContainer>
          <GroupContainer hideAccent hideBorder className="w-full">
            <WorkTimeInput
              highlightStartTime={highlightStartTime}
              highlightEndTime={highlightEndTime}
            />
            <GoDirectlyFlagCheckbox
              name="goDirectlyFlag"
              control={control}
              disabled={changeRequests.length > 0 || !!readOnly}
              onChangeExtra={(checked: boolean) => {
                if (checked && setValue) {
                  setValue(
                    "startTime",
                    resolveConfigTimeOnDate(
                      getStartTime(),
                      getValues?.("startTime") as string | null | undefined,
                      workDate ?? undefined,
                      attendance?.workDate,
                    ),
                  );
                  // トリガーハイライトアニメーション
                  setHighlightStartTime(true);
                  setTimeout(() => setHighlightStartTime(false), 2500);
                }
              }}
            />
            <ReturnDirectlyFlagInput onHighlightEndTime={setHighlightEndTime} />
            <RestTimeItem />
            <div className="h-px w-full bg-slate-200" />
            <ProductionTimeItem
              time={totalProductionTime}
              hourlyPaidHolidayHours={totalHourlyPaidHolidayTime}
            />
          </GroupContainer>
          <GroupContainer hideAccent hideBorder className="w-full">
            {(() => {
              const items: { label: string; content: JSX.Element }[] = [];
              items.push({
                label: "振替休日",
                content: <SubstituteHolidayDateInput />,
              });
              items.push({
                label: "有給(1日)",
                content: <PaidHolidayFlagInput />,
              });
              if (getSpecialHolidayEnabled && getSpecialHolidayEnabled()) {
                items.push({
                  label: "特別休暇",
                  content: (
                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                      <div className="w-full text-sm font-bold text-slate-900 md:w-[150px]">
                        特別休暇
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="text-sm leading-6 text-slate-500">
                          有給休暇ではない特別な休暇(忌引きなど)として扱われます。
                          <br />
                          使用する際は、事前に勤怠管理者へご相談ください。
                        </div>
                        <Controller
                          name="specialHolidayFlag"
                          control={control}
                          render={({ field }) => (
                            <label className="inline-flex items-center gap-3">
                              <input
                                ref={field.ref}
                                name={field.name}
                                checked={!!field.value}
                                onBlur={field.onBlur}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => field.onChange(e.target.checked)}
                                disabled={changeRequests.length > 0}
                                type="checkbox"
                                className="h-4 w-4 accent-emerald-600"
                              />
                              <span className="text-sm text-slate-600">
                                特別休暇として申請する
                              </span>
                            </label>
                          )}
                        />
                      </div>
                    </div>
                  ),
                });
              }

              if (hourlyPaidHolidayEnabled) {
                items.push({
                  label: `時間単位(${hourlyPaidHolidayTimeFields.length})`,
                  content: (
                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                      <div className="w-full text-sm font-bold text-slate-900 md:w-[150px]">
                        時間単位休暇
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        {hourlyPaidHolidayTimeFields.length === 0 && (
                          <div className="text-sm leading-6 text-slate-500">
                            時間単位休暇の時間帯を追加してください。
                          </div>
                        )}
                        {hourlyPaidHolidayTimeFields.map(
                          (hourlyPaidHolidayTime, index) => (
                            <HourlyPaidHolidayTimeItem
                              key={hourlyPaidHolidayTime.id}
                              time={hourlyPaidHolidayTime}
                              index={index}
                            />
                          ),
                        )}
                        <div>
                          <AppIconButton
                            aria-label="add-hourly-paid-holiday-time"
                            onClick={() =>
                              hourlyPaidHolidayTimeAppend({
                                startTime: null,
                                endTime: null,
                              })
                            }
                            disabled={changeRequests.length > 0}
                            tone="primary"
                          >
                            <span aria-hidden="true" className="text-2xl leading-none">
                              +
                            </span>
                          </AppIconButton>
                        </div>
                      </div>
                    </div>
                  ),
                });
              }

              return (
                <VacationTabs
                  value={vacationTab}
                  onChange={setVacationTab}
                  items={items}
                  panelPadding={2}
                  tabsProps={{
                    "aria-label": "vacation-tabs-desktop",
                  }}
                />
              );
            })()}
          </GroupContainer>
          <GroupContainer title="備考" hideAccent hideBorder className="w-full">
            <RemarksInput />
          </GroupContainer>
          <GroupContainer hideAccent hideBorder className="w-full">
            <StaffCommentInput register={register} setValue={setValue} />
          </GroupContainer>
          <div className="flex justify-center pb-2">
            <AppButton
              data-testid="attendance-submit-button"
              size="lg"
              loading={isSubmitting}
              onClick={async () => {
                try {
                  await handleSubmit(onSubmit)();
                } catch {
                  // onSubmit 側でエラーを通知する
                }
              }}
              disabled={
                !isDirty || !isValid || isSubmitting || changeRequests.length > 0
              }
            >
              申請
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
