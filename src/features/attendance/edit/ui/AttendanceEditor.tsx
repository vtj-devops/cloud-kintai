import { AuthContext } from "@app/providers/auth/AuthContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { useOvertimeRequest } from "@entities/attendance/hooks/useOvertimeRequest";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import {
  type OvertimeCheckContext,
  validateOvertimeCheck,
} from "@entities/attendance/validation/overtimeCheckValidator";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import AttendanceEditProvider from "@features/attendance/edit/model/AttendanceEditProvider";
import { useAttendanceEditForm } from "@features/attendance/edit/model/useAttendanceEditForm";
import { useAttendanceGoDirectlyHandler } from "@features/attendance/edit/model/useAttendanceGoDirectlyHandler";
import { useAttendanceHolidayHandlers } from "@features/attendance/edit/model/useAttendanceHolidayHandlers";
import { useAttendanceSubmit } from "@features/attendance/edit/model/useAttendanceSubmit";
import { AttendanceVacationTabs } from "@features/attendance/edit/ui/components/AttendanceVacationTabs";
import { Logger } from "@shared/lib/logger";
import { createMonthSearchParams,MONTH_QUERY_KEY } from "@shared/lib/monthQuery";
import { ProgressBar } from "@shared/ui/feedback";
import { InlineAlert } from "@shared/ui/feedback/InlineAlert";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAttendanceRecord } from "../model/useAttendanceRecord";
import ChangeRequestDialog from "./ChangeRequestDialog/ChangeRequestDialog";
import { AttendanceEditFormSkeleton } from "./components/AttendanceEditFormSkeleton";
import { AttendanceEditorAdditionalBottomContent } from "./components/AttendanceEditorAdditionalBottomContent";
import { AttendanceEditorAlerts } from "./components/AttendanceEditorAlerts";
import { AttendanceEditorEditActions } from "./components/AttendanceEditorEditActions";
import { AttendanceEditorHeader } from "./components/AttendanceEditorHeader";
import { AttendanceEditorHistorySidebar } from "./components/AttendanceEditorHistorySidebar";
import { AttendanceEditorSaveAction } from "./components/AttendanceEditorSaveAction";
import { calcTotalHourlyPaidHolidayTime } from "./items/HourlyPaidHolidayTimeItem";
// eslint-disable-next-line import/no-cycle
import RemarksItem from "./items/RemarksItem";
// eslint-disable-next-line import/no-cycle
import { calcTotalRestTime } from "./items/RestTimeItem/RestTimeItem";
import WorkDateItem from "./items/WorkDateItem";
import { calcTotalWorkTime } from "./items/WorkTimeItem/WorkTimeItem";
import MoveDateItem from "./MoveDateItem";

export default function AttendanceEditor({ readOnly }: { readOnly?: boolean }) {
  const {
    derived,
    loading: appConfigLoading,
    config: appConfig,
  } = useAppConfig();
  const {
    lunchRestStartTime,
    lunchRestEndTime,
    hourlyPaidHolidayEnabled,
    specialHolidayEnabled,
    startTime: configStartTime,
    endTime: configEndTime,
    absentEnabled,
  } = derived;
  const getLunchRestStartTime = () => lunchRestStartTime;
  const getLunchRestEndTime = () => lunchRestEndTime;
  const getHourlyPaidHolidayEnabled = () => hourlyPaidHolidayEnabled;
  const getSpecialHolidayEnabled = () => specialHolidayEnabled;
  const getStartTime = () => configStartTime;
  const getEndTime = () => configEndTime;
  const getAbsentEnabled = () => absentEnabled;
  const { targetWorkDate, staffId: targetStaffId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authStatus, cognitoUser: currentUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { loading: staffsLoading, error: staffSError } = useStaffs({
    isAuthenticated,
  });
  const [createAttendanceMutation] = useCreateAttendanceMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();
  const handleUpdateAttendance = useCallback(
    (input: Parameters<typeof updateAttendanceMutation>[0]) =>
      updateAttendanceMutation(input).unwrap(),
    [updateAttendanceMutation],
  );
  const handleCreateAttendance = useCallback(
    (input: Parameters<typeof createAttendanceMutation>[0]) =>
      createAttendanceMutation(input).unwrap(),
    [createAttendanceMutation],
  );
  const [enabledSendMail, setEnabledSendMail] = useState<boolean>(true);
  const [vacationTab, setVacationTab] = useState<number>(0);
  const [highlightStartTime, setHighlightStartTime] = useState(false);
  const [highlightEndTime, setHighlightEndTime] = useState(false);
  const logger = useMemo(
    () =>
      new Logger("AttendanceEditor", import.meta.env.DEV ? "DEBUG" : "ERROR"),
    [],
  );
  const attendanceListPath = useMemo(() => {
    const month = searchParams.get(MONTH_QUERY_KEY);
    const basePath = targetStaffId
      ? `/admin/staff/${targetStaffId}/attendance`
      : "/admin/attendances";
    if (!month) {
      return basePath;
    }
    return `${basePath}?${createMonthSearchParams(month).toString()}`;
  }, [searchParams, targetStaffId]);
  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
    errors,
    isDirty,
    isValid,
    isSubmitting,
    restFields,
    restRemove,
    restAppend,
    restReplace,
    restUpdate,
    systemCommentFields,
    systemCommentUpdate,
    systemCommentReplace,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeRemove,
    hourlyPaidHolidayTimeAppend,
    hourlyPaidHolidayTimeUpdate,
    hourlyPaidHolidayTimeReplace,
    submitErrorMessage,
    setSubmitError,
    clearSubmitError,
  } = useAttendanceEditForm();
  const {
    attendance,
    staff,
    workDate,
    historiesLoading,
    sortedHistories,
    historyIndex,
    setHistoryIndex,
    applyHistory,
    hasAttendanceFetched,
  } = useAttendanceRecord({
    targetStaffId,
    targetWorkDate,
    readOnly,
    setValue,
    reset,
    restReplace,
    hourlyPaidHolidayTimeReplace,
    systemCommentReplace,
    getValues,
    logger,
  });
  const { overtimeRequestEndTime, hasOvertimeRequest } = useOvertimeRequest({
    staffId: staff?.id ?? targetStaffId ?? null,
    workDate: workDate ? workDate.format("YYYY-MM-DD") : null,
    isAuthenticated,
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is not a React hook
  const watchedEndTime = watch("endTime");
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is not a React hook
  const watchedStartTime = watch("startTime");
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is not a React hook
  const watchedRests = watch("rests");
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() is not a React hook
  const watchedHourlyPaidHolidayTimes = watch("hourlyPaidHolidayTimes");
  const errorMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );
  const overtimeError = useMemo(() => {
    if (!watchedEndTime || !appConfig) {
      return null;
    }

    const context: OvertimeCheckContext = {
      workEndTime: configEndTime.format("HH:mm"),
      overTimeCheckEnabled: appConfig.overTimeCheckEnabled ?? false,
      overtimeRequestEndTime,
      hasOvertimeRequest,
    };
    const result = validateOvertimeCheck(watchedEndTime, context);

    if (!result.isValid && result.errorMessage) {
      return result.errorMessage;
    }

    return null;
  }, [
    watchedEndTime,
    appConfig,
    overtimeRequestEndTime,
    hasOvertimeRequest,
    configEndTime,
  ]);
  const totalWorkTime = useMemo(() => {
    if (!watchedEndTime) return 0;
    return calcTotalWorkTime(watchedStartTime, watchedEndTime);
  }, [watchedStartTime, watchedEndTime]);
  const totalRestTime = useMemo(
    () =>
      watchedRests?.reduce((acc, rest) => {
        if (!rest) return acc;
        if (!rest.endTime) return acc;
        const diff = calcTotalRestTime(rest.startTime, rest.endTime);
        return acc + diff;
      }, 0) ?? 0,
    [watchedRests],
  );
  const totalProductionTime = useMemo(
    () => totalWorkTime - totalRestTime,
    [totalWorkTime, totalRestTime],
  );
  const totalHourlyPaidHolidayTime = useMemo(
    () =>
      watchedHourlyPaidHolidayTimes?.reduce((acc, time) => {
        if (!time) return acc;
        if (!time.endTime) return acc;
        const diff = calcTotalHourlyPaidHolidayTime(
          time.startTime,
          time.endTime,
        );
        return acc + diff;
      }, 0) ?? 0,
    [watchedHourlyPaidHolidayTimes],
  );
  const isOnBreak = useMemo(
    () =>
      !!(
        watchedStartTime &&
        watchedRests &&
        watchedRests.length > 0 &&
        watchedRests[0]?.startTime &&
        !watchedRests[0]?.endTime
      ),
    [watchedStartTime, watchedRests],
  );
  const { onSubmit } = useAttendanceSubmit({
    attendance,
    staff,
    currentUserId: currentUser?.id,
    enabledSendMail,
    handleUpdateAttendance,
    handleCreateAttendance,
    targetStaffId,
    targetWorkDate,
    getStartTime,
    getEndTime,
    attendanceListPath,
    overtimeError,
    logger,
    navigateToAttendanceList: () =>
      runWithoutGuard(() => navigate(attendanceListPath)),
    setSubmitError,
    clearSubmitError,
  });
  const { handleAbsentFlagChange, handleSpecialHolidayFlagChange } =
    useAttendanceHolidayHandlers({
      getValues,
      setValue,
      getStartTime,
      getEndTime,
      getLunchRestStartTime,
      getLunchRestEndTime,
      targetWorkDate,
      attendanceWorkDate: attendance?.workDate,
      workDate,
      restReplace,
      hourlyPaidHolidayTimeReplace,
      logger,
    });
  const { handleGoDirectlyChange } = useAttendanceGoDirectlyHandler({
    setValue,
    getValues,
    getStartTime,
    workDate,
    targetWorkDate,
    setHighlightStartTime,
  });
  const { dialog, runWithoutGuard } = usePageLeaveGuard({
    isDirty,
    isBusy: isSubmitting,
  });
  if (appConfigLoading || staffsLoading || !hasAttendanceFetched) {
    return <ProgressBar />;
  }
  if (staffSError) {
    return (
      <InlineAlert tone="error" title="エラー">
        {staffSError.message}
      </InlineAlert>
    );
  }
  if (!targetStaffId) {
    return (
      <InlineAlert tone="error" title="エラー">
        スタッフが指定されていません。
      </InlineAlert>
    );
  }
  const changeRequests = attendance?.changeRequests
    ? attendance.changeRequests
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter((item) => !item.completed)
    : [];
  return (
    <AttendanceEditProvider
      value={{
        staff,
        workDate,
        attendance,
        onSubmit,
        getValues,
        setValue,
        watch,
        isDirty,
        isValid,
        isSubmitting,
        submitErrorMessage,
        restFields,
        changeRequests,
        restAppend,
        restRemove,
        restUpdate,
        restReplace,
        register,
        control,
        systemCommentFields,
        systemCommentUpdate,
        systemCommentReplace,
        hourlyPaidHolidayTimeFields,
        hourlyPaidHolidayTimeAppend,
        hourlyPaidHolidayTimeRemove,
        hourlyPaidHolidayTimeUpdate,
        hourlyPaidHolidayTimeReplace,
        hourlyPaidHolidayEnabled: getHourlyPaidHolidayEnabled(),
        errorMessages,
        readOnly,
        isOnBreak,
      }}
    >
      {dialog}
      <div
        className="flex flex-col gap-2 pb-5"
        data-testid="admin-attendance-editor-root"
      >
        {isSubmitting && (
          <div className="mt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-1/3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-1 text-center text-sm text-slate-600">保存中...</p>
          </div>
        )}
        <AttendanceEditorHeader
          workDate={workDate}
          onBackToAttendanceList={() => {
            navigate(attendanceListPath);
          }}
          readOnly={readOnly}
          currentHistoryCreatedAt={sortedHistories[historyIndex]?.createdAt}
          onBackToEdit={
            readOnly
              ? () => {
                  const date = workDate
                    ? workDate.format(AttendanceDate.DataFormat)
                    : targetWorkDate;
                  const sid = targetStaffId;
                  if (date && sid) {
                    const month = searchParams.get(MONTH_QUERY_KEY);
                    const editPath = `/admin/attendances/edit/${date}/${sid}`;
                    if (!month) {
                      navigate(editPath);
                      return;
                    }
                    navigate(`${editPath}?${createMonthSearchParams(month).toString()}`);
                  }
                }
              : undefined
          }
        />
        <div className={readOnly ? "mt-1 flex items-start gap-2" : undefined}>
          {readOnly && (
            <AttendanceEditorHistorySidebar
              historiesLoading={historiesLoading}
              sortedHistories={sortedHistories}
              historyIndex={historyIndex}
              onSelectHistory={(idx) => {
                setHistoryIndex(idx);
                try {
                  applyHistory(idx);
                } catch (error) {
                  logger.debug("Failed to apply attendance history", error);
                }
              }}
            />
          )}
          <div className="grow">
            <div className="flex flex-col gap-2 px-[120px]">
              <AttendanceEditorAlerts
                errorMessages={errorMessages}
                submitErrorMessage={submitErrorMessage}
                overtimeError={overtimeError}
                showNoDataAlert={!attendance}
              />

              <AttendanceEditorEditActions
                readOnly={readOnly}
                setValue={setValue}
                restReplace={restReplace}
                hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
                workDate={workDate}
                getValues={getValues}
              />

              <GroupContainer hideAccent hideBorder>
                <div>
                  <WorkDateItem
                    staffId={targetStaffId}
                    workDate={workDate}
                    MoveDateItemComponent={MoveDateItem}
                  />
                </div>
              </GroupContainer>

              <AttendanceEditFormSkeleton
                control={control}
                highlightStartTime={highlightStartTime}
                highlightEndTime={highlightEndTime}
                onHighlightEndTime={setHighlightEndTime}
                totalProductionTime={totalProductionTime}
                totalHourlyPaidHolidayTime={totalHourlyPaidHolidayTime}
                readOnly={readOnly}
                changeRequests={changeRequests}
                onGoDirectlyChange={handleGoDirectlyChange}
                vacationTabsContent={
                  <AttendanceVacationTabs
                    value={vacationTab}
                    onChange={setVacationTab}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    restReplace={restReplace}
                    workDateIso={workDate ? workDate.toISOString() : undefined}
                    readOnly={readOnly}
                    changeRequestsLength={changeRequests.length}
                    getAbsentEnabled={getAbsentEnabled}
                    getSpecialHolidayEnabled={getSpecialHolidayEnabled}
                    getHourlyPaidHolidayEnabled={getHourlyPaidHolidayEnabled}
                    handleAbsentFlagChange={handleAbsentFlagChange}
                    handleSpecialHolidayFlagChange={
                      handleSpecialHolidayFlagChange
                    }
                    hourlyPaidHolidayTimeFields={hourlyPaidHolidayTimeFields}
                    hourlyPaidHolidayTimeAppend={hourlyPaidHolidayTimeAppend}
                    staffWorkType={staff?.workType}
                  />
                }
                remarksContent={<RemarksItem />}
                additionalBottomContent={
                  !readOnly ? (
                    <AttendanceEditorAdditionalBottomContent
                      updatedAt={attendance?.updatedAt}
                      enabledSendMail={enabledSendMail}
                      onToggleSendMail={() =>
                        setEnabledSendMail((prev) => !prev)
                      }
                    />
                  ) : undefined
                }
              />

              <AttendanceEditorSaveAction
                readOnly={readOnly}
                onSave={handleSubmit(onSubmit)}
                disabled={
                  !isValid || !isDirty || isSubmitting || !!overtimeError
                }
                loading={isSubmitting}
              />
            </div>
          </div>
        </div>
        <ChangeRequestDialog
          attendance={attendance}
          updateAttendance={handleUpdateAttendance}
          staff={staff}
        />
      </div>
    </AttendanceEditProvider>
  );
}
