import QuickInputButtonsMobile from "@features/attendance/edit/ui/QuickInputButtonsMobile";
import { Alert, AlertTitle, Box, Stack, Typography } from "@mui/material";
import GroupContainerMobile from "@shared/ui/group-container/GroupContainerMobile";
import Title from "@shared/ui/typography/Title";
import { useContext, useMemo, useState } from "react";
import { useFormState } from "react-hook-form";

import { AppConfigContext } from "@/context/AppConfigContext";
import { collectAttendanceErrorMessages } from "@/entities/attendance/validation/collectErrorMessages";
import { AttendanceEditContext } from "@/features/attendance/edit/model/AttendanceEditProvider";

import AttendanceEditBreadcrumb from "../AttendanceEditBreadcrumb";
import ChangeRequestingAlert from "../desktopEditor/ChangeRequestingMessage";
import NoDataAlert from "../desktopEditor/NoDataAlert";
import RemarksInput from "./RemarksInput";
import { RequestButtonItem } from "./RequestButtonItem";
import { RestTimeInput } from "./RestTimeInput/RestTimeInput";
import StaffCommentInput from "./StaffCommentInput";
import { StaffNameItem } from "./StaffNameItem";
import { TabbedPaidHolidayMobile } from "./TabbedPaidHolidayMobile";
import { WorkDateItem } from "./WorkDateItem";
import { WorkTimeInput } from "./WorkTimeInput/WorkTimeInput";
import WorkTypeItemMobile from "./WorkTypeItemMobile";

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
  const [holidayTab, setHolidayTab] = useState<number>(0);

  // memoize the component reference to avoid recreating it on each render
  const TabbedPaidHolidayComponent = useMemo(() => TabbedPaidHolidayMobile, []);

  if (changeRequests.length > 0) {
    return (
      <Stack direction="column" spacing={1} sx={{ p: 1 }}>
        <AttendanceEditBreadcrumb />
        <Title>勤怠編集</Title>
        {errorMessages.length > 0 && (
          <Box mb={1}>
            <Alert severity="error">
              <AlertTitle>入力内容に誤りがあります。</AlertTitle>
              <Stack spacing={0.5}>
                {errorMessages.map((message) => (
                  <Typography key={message} variant="body2">
                    {message}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          </Box>
        )}
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
    <Stack
      direction="column"
      spacing={1}
      sx={{
        p: 1,
        pb: 10,
        "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: "divider",
        },
        "& .MuiOutlinedInput-root.Mui-error:hover .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "divider",
          },
        "& .MuiOutlinedInput-root.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "divider",
          },
      }}
    >
      <AttendanceEditBreadcrumb />
      <Title>勤怠編集</Title>
      {errorMessages.length > 0 && (
        <Box mb={1}>
          <Alert severity="error">
            <AlertTitle>入力内容に誤りがあります。</AlertTitle>
            <Stack spacing={0.5}>
              {errorMessages.map((message) => (
                <Typography key={message} variant="body2">
                  {message}
                </Typography>
              ))}
            </Stack>
          </Alert>
        </Box>
      )}
      <Stack direction="column" spacing={2} sx={{ p: 1 }}>
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
          {/* 勤務日 */}
          <WorkDateItem />
        </GroupContainerMobile>
        <GroupContainerMobile hideAccent hideBorder>
          {/* スタッフ・勤務形態 */}
          <StaffNameItem />
          <WorkTypeItemMobile />
        </GroupContainerMobile>
        <GroupContainerMobile hideAccent hideBorder>
          <Stack spacing={1}>
            {/* 勤務時間・休憩時間 */}
            <WorkTimeInput />
            <RestTimeInput
              restFields={restFields}
              restAppend={restAppend}
              restRemove={restRemove}
              restUpdate={restUpdate}
            />
          </Stack>
        </GroupContainerMobile>
        <GroupContainerMobile hideAccent hideBorder>
          {/* 休暇タブ */}
          <TabbedPaidHolidayComponent
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
            holidayTab={holidayTab}
            setHolidayTab={setHolidayTab}
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
      </Stack>
    </Stack>
  );
}
