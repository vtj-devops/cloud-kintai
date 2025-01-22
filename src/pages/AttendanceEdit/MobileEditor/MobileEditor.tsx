import { Stack } from "@mui/material";
import { useContext } from "react";

import Title from "../../../components/Title/Title";
import AttendanceEditBreadcrumb from "../AttendanceEditBreadcrumb";
import { AttendanceEditContext } from "../AttendanceEditProvider";
import ChangeRequestingAlert from "../DesktopEditor/ChangeRequestingMessage";
import NoDataAlert from "../DesktopEditor/NoDataAlert";
import { GoDirectlyFlagInput } from "./GoDirectlyFlagInput";
import { Label } from "./Label";
import { PaidHolidayFlagInput } from "./PaidHolidayFlagInput";
import RemarksInput from "./RemarksInput";
import { RequestButtonItem } from "./RequestButtonItem";
import { RestTimeInput } from "./RestTimeInput/RestTimeInput";
import { ReturnDirectlyFlagInput } from "./ReturnDirectlyFlagInput";
import StaffCommentInput from "./StaffCommentInput";
import { StaffNameItem } from "./StaffNameItem";
import { SubstituteHolidayDateInput } from "./SubstituteHolidayDateInput";
import { WorkDateItem } from "./WorkDateItem";
import { WorkTimeInput } from "./WorkTimeInput/WorkTimeInput";

export function MobileEditor() {
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
  } = useContext(AttendanceEditContext);

  if (changeRequests.length > 0) {
    return (
      <Stack direction="column" spacing={1} sx={{ p: 1 }}>
        <AttendanceEditBreadcrumb />
        <Title>勤怠編集</Title>
        <ChangeRequestingAlert changeRequests={changeRequests} />
      </Stack>
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
    <Stack direction="column" spacing={1} sx={{ p: 1 }}>
      <AttendanceEditBreadcrumb />
      <Title>勤怠編集</Title>
      <Stack direction="column" spacing={2} sx={{ p: 1 }}>
        <NoDataAlert />

        {/* 勤務日 */}
        <WorkDateItem />

        {/* スタッフ */}
        <StaffNameItem />

        {/* 有給休暇 */}
        <PaidHolidayFlagInput />

        {/* 振替休暇 */}
        <SubstituteHolidayDateInput />

        {/* 直行 */}
        <GoDirectlyFlagInput />

        {/* 直帰 */}
        <ReturnDirectlyFlagInput control={control} />

        {/* 勤務時間 */}
        <WorkTimeInput />

        {/* 休憩時間 */}
        <RestTimeInput
          restFields={restFields}
          control={control}
          restAppend={restAppend}
          restRemove={restRemove}
          restUpdate={restUpdate}
        />

        {/* 備考 */}
        <Label>備考</Label>
        <RemarksInput register={register} />

        {/* 修正コメント */}
        <Label>修正理由</Label>
        <StaffCommentInput />

        {/* 申請ボタン */}
        <RequestButtonItem
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isValid={isValid}
          isSubmitting={isSubmitting}
        />
      </Stack>
    </Stack>
  );
}
