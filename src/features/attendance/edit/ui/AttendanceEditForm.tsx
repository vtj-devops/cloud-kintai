import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import { getWorkTypeLabel } from "@entities/staff/lib/workTypeOptions";
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
import QuickInputButtonsMobile from "@features/attendance/edit/ui/QuickInputButtonsMobile";
import { AppButton, AppIconButton } from "@shared/ui/button";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import GroupContainerMobile from "@shared/ui/group-container/GroupContainerMobile";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useFormState } from "react-hook-form";

import ChangeRequestingAlert from "./ChangeRequestingMessage";
import PaidHolidayFlagInputDesktop from "./desktop/PaidHolidayFlagInput";
import RemarksInputDesktop from "./desktop/RemarksInput";
import { calcTotalRestTime } from "./desktop/RestTimeInput";
import RestTimeItem from "./desktop/RestTimeItem";
import ReturnDirectlyFlagInputDesktop from "./desktop/ReturnDirectlyFlagInput";
import StaffCommentInputDesktop from "./desktop/StaffCommentInput";
import WorkDateItemDesktop from "./desktop/WorkDateItem";
import { calcTotalWorkTime, WorkTimeInput } from "./desktop/WorkTimeInput";
import { MobilePaidHolidaySection } from "./mobile/MobilePaidHolidaySection";
import RemarksInputMobile from "./mobile/RemarksInput";
import { RequestButtonItem } from "./mobile/RequestButtonItem";
import { RestTimeInput as RestTimeInputMobile } from "./mobile/RestTimeInput";
import StaffCommentInputMobile from "./mobile/StaffCommentInput";
import { WorkDateItem as WorkDateItemMobile } from "./mobile/WorkDateItem";
import { WorkTimeInput as WorkTimeInputMobile } from "./mobile/WorkTimeInput";
import NoDataAlert from "./NoDataAlert";

export function AttendanceEditForm() {
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
    hourlyPaidHolidayEnabled,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeReplace,
    restFields,
    restAppend,
    restRemove,
    restUpdate,
    restReplace,
    workDate,
    readOnly,
    errorMessages: contextErrorMessages,
  } = ctx;
  const { errors } = useFormState({ control });
  const { getStartTime } = useAppConfig();
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

  const workTypeValue = (staff as unknown as Record<string, unknown>)
    ?.workType as string | null | undefined;
  const workTypeLabel = getWorkTypeLabel(workTypeValue);

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
        setTotalProductionTime(totalWorkTime - totalRestTime);
      }
      const totalHourly =
        data.hourlyPaidHolidayTimes?.reduce((acc, time) => {
          if (!time) return acc;
          if (!time.endTime) return acc;
          return (
            acc + calcTotalHourlyPaidHolidayTime(time.startTime, time.endTime)
          );
        }, 0) ?? 0;
      setTotalHourlyPaidHolidayTime(totalHourly);
    });
    return typeof unsubscribe === "function" ? unsubscribe : undefined;
  }, [watch]);

  if (!staff || !control || !setValue || !watch || !handleSubmit || !register) {
    return null;
  }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden" data-testid="attendance-mobile-editor">
        {changeRequests.length > 0 ? (
          <div className="flex flex-col gap-2 p-2">
            <AttendanceEditPageHeader variant="mobile" />
            <AttendanceErrorSummary messages={errorMessages} variant="mobile" />
            <ChangeRequestingAlert changeRequests={changeRequests} />
          </div>
        ) : !restAppend || !restRemove || !restUpdate ? null : (
          <div className="flex flex-col gap-2 p-2 pb-10">
            <AttendanceEditPageHeader
              description="勤務時間や休憩、休暇、備考を確認しながら、そのまま修正申請できます。"
              variant="mobile"
            />
            <AttendanceErrorSummary messages={errorMessages} variant="mobile" />
            <div className="flex flex-col gap-2">
              <NoDataAlert />
              {setValue && restReplace && hourlyPaidHolidayTimeReplace && (
                <QuickInputButtonsMobile
                  setValue={setValue}
                  restReplace={restReplace}
                  hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
                  workDate={workDate ?? null}
                  visibleMode="staff"
                />
              )}
              <GroupContainerMobile hideAccent hideBorder>
                <WorkDateItemMobile />
              </GroupContainerMobile>
              <GroupContainerMobile hideAccent hideBorder>
                <div className="overflow-hidden rounded-lg border border-slate-200/80">
                  <div className="grid grid-cols-[7.5rem_1fr] border-b border-slate-200/80">
                    <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      スタッフ
                    </div>
                    <div className="px-3 py-2 text-base text-slate-900">
                      {`${staff.familyName} ${staff.givenName}`}
                    </div>
                  </div>
                  {workTypeLabel ? (
                    <div className="grid grid-cols-[7.5rem_1fr]">
                      <div className="bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                        勤務形態
                      </div>
                      <div className="px-3 py-2 text-base text-slate-900">
                        {workTypeLabel}
                      </div>
                    </div>
                  ) : null}
                </div>
              </GroupContainerMobile>
              <GroupContainerMobile hideAccent hideBorder>
                <div className="flex flex-col gap-2">
                  <WorkTimeInputMobile />
                  <RestTimeInputMobile
                    restFields={restFields}
                    restAppend={restAppend}
                    restRemove={restRemove}
                  />
                </div>
              </GroupContainerMobile>
              <GroupContainerMobile hideAccent hideBorder>
                <MobilePaidHolidaySection
                  control={control}
                  setValue={setValue}
                  workDate={workDate}
                  restReplace={restReplace}
                  getValues={getValues}
                  getSpecialHolidayEnabled={getSpecialHolidayEnabled}
                  changeRequestsLength={changeRequests.length}
                  hourlyPaidHolidayEnabled={hourlyPaidHolidayEnabled}
                  hourlyPaidHolidayTimeFields={hourlyPaidHolidayTimeFields}
                  hourlyPaidHolidayTimeAppend={hourlyPaidHolidayTimeAppend}
                />
              </GroupContainerMobile>
              <GroupContainerMobile title="備考" hideAccent hideBorder>
                <RemarksInputMobile />
              </GroupContainerMobile>
              <GroupContainerMobile title="修正理由" hideAccent hideBorder>
                <StaffCommentInputMobile />
              </GroupContainerMobile>
              <RequestButtonItem
                handleSubmit={handleSubmit}
                onSubmit={onSubmit}
                isDirty={isDirty}
                isValid={isValid}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block" data-testid="attendance-desktop-editor">
        <div className="w-full px-6 pb-10 pt-2">
          <div className="flex flex-col gap-3">
            <AttendanceEditPageHeader description="勤務時間、休憩、休暇、備考をひとつの画面で調整できます。必要な内容を入力して修正申請を行ってください。" />
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
                <WorkDateItemDesktop />
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
                      setHighlightStartTime(true);
                      setTimeout(() => setHighlightStartTime(false), 2500);
                    }
                  }}
                />
                <ReturnDirectlyFlagInputDesktop
                  onHighlightEndTime={setHighlightEndTime}
                />
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
                    content: <PaidHolidayFlagInputDesktop />,
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
                                <span
                                  aria-hidden="true"
                                  className="text-2xl leading-none"
                                >
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
                <RemarksInputDesktop />
              </GroupContainer>
              <GroupContainer hideAccent hideBorder className="w-full">
                <StaffCommentInputDesktop register={register} setValue={setValue} />
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
                    !isDirty ||
                    !isValid ||
                    isSubmitting ||
                    changeRequests.length > 0
                  }
                >
                  申請
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
