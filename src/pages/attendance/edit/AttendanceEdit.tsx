import "./styles.scss";

import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import type { AttendanceEditContextProps } from "@features/attendance/edit/model/AttendanceEditProvider";
import AttendanceEditProvider from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import DesktopEditor from "@features/attendance/edit/ui/desktopEditor/DesktopEditor";
import { MobileEditor } from "@features/attendance/edit/ui/mobileEditor/MobileEditor";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { PageContent } from "@shared/ui/layout";
import dayjs from "dayjs";
import { useMemo } from "react";
import { UseFormHandleSubmit } from "react-hook-form";

import * as MESSAGE_CODE from "@/errors";

import { AttendanceEditErrorAlert } from "./AttendanceEditErrorAlert";
import { useAttendanceEditData } from "./useAttendanceEditData";
import { useAttendanceForm } from "./useAttendanceForm";
import { useSubmitAttendanceEdit } from "./useSubmitAttendanceEdit";

export default function AttendanceEdit() {
  const { notify } = useAppNotification();

  const {
    cognitoUser,
    targetWorkDate,
    targetWorkDateISO,
    staff,
    staffs,
    staffsLoading,
    staffSError,
    attendance,
    attendanceLoading,
    attendanceListPath,
  } = useAttendanceEditData();

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    errors,
    restFields,
    restAppend,
    restRemove,
    restUpdate,
    restReplace,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace,
    hourlyPaidHolidayEnabled,
    isOnBreak,
    dialog,
    runWithoutGuard,
  } = useAttendanceForm({
    attendance,
    targetWorkDate,
    targetWorkDateISO,
    staffId: staff?.cognitoUserId ?? null,
  });

  const { onSubmit } = useSubmitAttendanceEdit({
    cognitoUser,
    attendance,
    staff,
    staffs,
    targetWorkDate,
    attendanceListPath,
    runWithoutGuard,
  });

  const changeRequests = attendance?.changeRequests
    ? attendance.changeRequests
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter((item) => !item.completed)
    : [];

  const errorMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );

  if (!targetWorkDate) {
    return null;
  }

  if (staffsLoading || attendanceLoading) {
    return (
      <div
        className="attendance-edit__loading"
        data-testid="attendance-loading"
      >
        <div className="attendance-edit__loading-track">
          <div className="attendance-edit__loading-bar" />
        </div>
      </div>
    );
  }

  if (staffSError) {
    notify({
      title: "エラー",
      description: MESSAGE_CODE.E00001,
      tone: "error",
      dedupeKey: "staff-fetch-error",
    });
    return null;
  }

  const attendanceEditContextValue: AttendanceEditContextProps = {
    workDate: dayjs(targetWorkDate),
    attendance,
    staff,
    onSubmit,
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit:
      handleSubmit as unknown as UseFormHandleSubmit<AttendanceEditInputs>,
    isDirty,
    isValid,
    isSubmitting,
    restFields,
    restAppend,
    restRemove,
    restUpdate,
    restReplace,
    changeRequests,
    systemCommentFields: [],
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace,
    hourlyPaidHolidayEnabled,
    isOnBreak,
  };

  return (
    <AttendanceEditProvider value={attendanceEditContextValue}>
      <PageContent
        width="content"
        data-testid="attendance-edit-root"
        className="attendance-edit-root"
      >
        {dialog}
        <AttendanceEditErrorAlert messages={errorMessages} />
        <div className="block md:hidden" data-testid="attendance-mobile-editor">
          <MobileEditor />
        </div>
        <div
          className="hidden md:block"
          data-testid="attendance-desktop-editor"
        >
          <DesktopEditor />
        </div>
      </PageContent>
    </AttendanceEditProvider>
  );
}
