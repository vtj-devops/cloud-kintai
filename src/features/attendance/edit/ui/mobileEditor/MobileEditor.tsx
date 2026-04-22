import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import { getWorkTypeLabel } from "@entities/staff/lib/workTypeOptions";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditPageHeader } from "@features/attendance/edit/ui/components/AttendanceEditPageHeader";
import { AttendanceErrorSummary } from "@features/attendance/edit/ui/components/AttendanceErrorSummary";
import QuickInputButtonsMobile from "@features/attendance/edit/ui/QuickInputButtonsMobile";
import GroupContainerMobile from "@shared/ui/group-container/GroupContainerMobile";
import { useContext, useMemo } from "react";
import { useFormState } from "react-hook-form";

import ChangeRequestingAlert from "../desktopEditor/ChangeRequestingMessage";
import NoDataAlert from "../desktopEditor/NoDataAlert";
import { MobilePaidHolidaySection } from "./MobilePaidHolidaySection";
import RemarksInput from "./RemarksInput";
import { RequestButtonItem } from "./RequestButtonItem";
import { RestTimeInput } from "./RestTimeInput/RestTimeInput";
import StaffCommentInput from "./StaffCommentInput";
import { WorkDateItem } from "./WorkDateItem";
import { WorkTimeInput } from "./WorkTimeInput/WorkTimeInput";

export function MobileEditor() {
  const ctx = useContext(AttendanceEditContext);
  const {
    staff,
    onSubmit,
    control,
    setValue,
    getValues,
    watch,
    register,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    restFields,
    restAppend,
    restRemove,
    restUpdate,
    changeRequests,
    hourlyPaidHolidayEnabled,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeReplace,
    restReplace,
    workDate,
  } = ctx;
  const { getSpecialHolidayEnabled } = useContext(AppConfigContext);
  const { errors } = useFormState({ control });
  const contextErrorMessages = ctx.errorMessages;
  const derivedMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );
  const errorMessages = contextErrorMessages?.length
    ? contextErrorMessages
    : derivedMessages;
  const workTypeValue = (staff as unknown as Record<string, unknown>)
    .workType as string | null | undefined;
  const workTypeLabel = getWorkTypeLabel(workTypeValue);

  if (changeRequests.length > 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <AttendanceEditPageHeader variant="mobile" />
        <AttendanceErrorSummary messages={errorMessages} variant="mobile" />
        <ChangeRequestingAlert changeRequests={changeRequests} />
      </div>
    );
  }

  if (
    !staff ||
    !control ||
    !setValue ||
    !watch ||
    !getValues ||
    !handleSubmit ||
    !register ||
    !restAppend ||
    !restRemove ||
    !restUpdate
  ) {
    return null;
  }

  return (
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
          <WorkDateItem />
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
            <WorkTimeInput />
            <RestTimeInput
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
          <RemarksInput />
        </GroupContainerMobile>
        <GroupContainerMobile title="修正理由" hideAccent hideBorder>
          <StaffCommentInput />
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
  );
}
