import { AuthContext } from "@app/providers/auth/AuthContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { useOvertimeRequest } from "@entities/attendance/hooks/useOvertimeRequest";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import { attendanceEditSchema } from "@entities/attendance/validation/attendanceEditSchema";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import {
  type OvertimeCheckContext,
  validateOvertimeCheck,
} from "@entities/attendance/validation/overtimeCheckValidator";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import AttendanceEditProvider from "@features/attendance/edit/model/AttendanceEditProvider";
import {
  AttendanceEditInputs,
  defaultValues,
  HourlyPaidHolidayTimeInputs,
  RestInputs,
} from "@features/attendance/edit/model/common";
import { AttendanceErrorSummary } from "@features/attendance/edit/ui/components/AttendanceErrorSummary";
import { SubstituteHolidayDateInput } from "@features/attendance/edit/ui/items/SubstituteHolidayDateInput";
import { zodResolver } from "@hookform/resolvers/zod";
import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import { Checkbox, LinearProgress } from "@mui/material";
import { HourlyPaidHolidayTimeInput } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { AttendanceEditMailSender } from "@shared/lib/mail/AttendanceEditMailSender";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import { useAttendanceRecord } from "../model/useAttendanceRecord";
import ChangeRequestDialog from "./ChangeRequestDialog/ChangeRequestDialog";
import { AttendanceEditFormSkeleton } from "./components/AttendanceEditFormSkeleton";
import { VacationTabs } from "./components/VacationTabs";
// eslint-disable-next-line import/no-cycle
import EditAttendanceHistoryList from "./EditAttendanceHistoryList/EditAttendanceHistoryList";
import IsDeemedHolidayFlagInput from "./IsDeemedHolidayFlagInput";
import HourlyPaidHolidayTimeItem, {
  calcTotalHourlyPaidHolidayTime,
} from "./items/HourlyPaidHolidayTimeItem";
// eslint-disable-next-line import/no-cycle
import RemarksItem from "./items/RemarksItem";
// eslint-disable-next-line import/no-cycle
import { calcTotalRestTime } from "./items/RestTimeItem/RestTimeItem";
import WorkDateItem from "./items/WorkDateItem";
import { calcTotalWorkTime } from "./items/WorkTimeItem/WorkTimeItem";
import MoveDateItem from "./MoveDateItem";
import PaidHolidayFlagInputCommon from "./PaidHolidayFlagInput";
import QuickInputButtons from "./QuickInputButtons";
import { SystemCommentList } from "./SystemCommentList";

function InlineAlert({
  tone,
  title,
  children,
}: {
  tone: "error" | "info";
  title?: string;
  children: React.ReactNode;
}) {
  const toneClassName =
    tone === "error"
      ? "border-rose-500/15 bg-rose-50/90 text-rose-900"
      : "border-sky-500/15 bg-sky-50/90 text-sky-900";
  return (
    <div className={`rounded-[18px] border px-4 py-3 ${toneClassName}`}>
      {title ? <div className="text-sm font-semibold">{title}</div> : null}
      <div className={title ? "mt-2 text-sm" : "text-sm"}>{children}</div>
    </div>
  );
}
function buildHourlyPaidHolidayTimes(
  data: HourlyPaidHolidayTimeInputs[] | undefined,
): HourlyPaidHolidayTimeInput[] {
  if (!data) {
    return [];
  }
  return data.reduce<HourlyPaidHolidayTimeInput[]>((acc, item) => {
    if (item.startTime && item.endTime) {
      acc.push({
        startTime: item.startTime,
        endTime: item.endTime,
      });
    }
    return acc;
  }, []);
}
const MONTH_QUERY_KEY = "month";
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
  const dispatch = useDispatch();
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
  const [overtimeError, setOvertimeError] = useState<string | null>(null);
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
    return `${basePath}?${new URLSearchParams({ [MONTH_QUERY_KEY]: month }).toString()}`;
  }, [searchParams, targetStaffId]);
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<AttendanceEditInputs>({
    mode: "onChange",
    defaultValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(attendanceEditSchema) as any,
  });
  const {
    fields: restFields,
    remove: restRemove,
    append: restAppend,
    replace: restReplace,
    update: restUpdate,
  } = useFieldArray({
    control,
    name: "rests",
  });
  const {
    fields: systemCommentFields,
    update: systemCommentUpdate,
    replace: systemCommentReplace,
  } = useFieldArray({
    control,
    name: "systemComments",
  });
  const {
    fields: hourlyPaidHolidayTimeFields,
    remove: hourlyPaidHolidayTimeRemove,
    append: hourlyPaidHolidayTimeAppend,
    update: hourlyPaidHolidayTimeUpdate,
    replace: hourlyPaidHolidayTimeReplace,
  } = useFieldArray({
    control,
    name: "hourlyPaidHolidayTimes",
  });
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
  const watchedEndTime = watch("endTime");
  const watchedStartTime = watch("startTime");
  const watchedRests = watch("rests");
  const watchedHourlyPaidHolidayTimes = watch("hourlyPaidHolidayTimes");
  const errorMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );
  useEffect(() => {
    if (!watchedEndTime || !appConfig) {
      setOvertimeError(null);
      return;
    }
    const workEndTimeStr = getEndTime().format("HH:mm");
    const context: OvertimeCheckContext = {
      workEndTime: workEndTimeStr,
      overTimeCheckEnabled: appConfig.overTimeCheckEnabled ?? false,
      overtimeRequestEndTime,
      hasOvertimeRequest,
    };
    const result = validateOvertimeCheck(watchedEndTime, context);
    if (!result.isValid && result.errorMessage) {
      setOvertimeError(result.errorMessage);
    } else {
      setOvertimeError(null);
    }
  }, [
    watchedEndTime,
    appConfig,
    overtimeRequestEndTime,
    hasOvertimeRequest,
    getEndTime,
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
  const onSubmit = useCallback(
    async (data: AttendanceEditInputs) => {
      if (overtimeError) {
        dispatch(
          pushNotification({
            tone: "error",
            message: overtimeError,
          }),
        );
        return;
      }
      if (attendance) {
        const payload = {
          id: attendance.id,
          staffId: attendance.staffId,
          workDate: data.workDate,
          startTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getStartTime(),
                data.workDate as string | null | undefined,
                attendance?.workDate,
                targetWorkDate,
              )
            : data.startTime,
          endTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getEndTime(),
                data.workDate as string | null | undefined,
                attendance?.workDate,
                targetWorkDate,
              )
            : data.endTime || null,
          absentFlag: data.absentFlag ?? false,
          isDeemedHoliday: data.isDeemedHoliday,
          goDirectlyFlag: data.goDirectlyFlag,
          returnDirectlyFlag: data.returnDirectlyFlag,
          remarks: data.remarks,
          revision: data.revision,
          paidHolidayFlag: data.paidHolidayFlag,
          specialHolidayFlag: data.specialHolidayFlag,
          substituteHolidayDate: data.substituteHolidayDate,
          rests: data.paidHolidayFlag
            ? [
                {
                  startTime: new AttendanceDateTime()
                    .setDateString(
                      (data.workDate as string) || attendance?.workDate || "",
                    )
                    .setRestStart()
                    .toISOString(),
                  endTime: new AttendanceDateTime()
                    .setDateString(
                      (data.workDate as string) || attendance?.workDate || "",
                    )
                    .setRestEnd()
                    .toISOString(),
                },
              ]
            : (data.rests || []).map((rest) => ({
                startTime: rest.startTime,
                endTime: rest.endTime,
              })),
          systemComments: (data.systemComments || []).map(
            ({ comment, confirmed, createdAt }) => ({
              comment,
              confirmed,
              createdAt,
            }),
          ),
          hourlyPaidHolidayTimes: data.paidHolidayFlag
            ? []
            : buildHourlyPaidHolidayTimes(data.hourlyPaidHolidayTimes),
          logContext: {
            action: "attendance.update",
          },
        };
        try {
          const res = await handleUpdateAttendance(payload);
          try {
            const isEditingOtherStaff =
              staff && currentUser && staff.cognitoUserId !== currentUser.id;
            if (isEditingOtherStaff && res && enabledSendMail) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            logger.error(`Failed to send edit mail: ${mailError}`);
          }
          dispatch(
            pushNotification({
              tone: "success",
              message: MESSAGE_CODE.S04001,
            }),
          );
          runWithoutGuard(() => navigate(attendanceListPath));
        } catch (error) {
          logger.error(`Update attendance error:`, error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error details: ${errorMessage}`);
          dispatch(
            pushNotification({
              tone: "error",
              message: MESSAGE_CODE.E04001,
            }),
          );
        }
        return;
      }
      if (!targetStaffId || !targetWorkDate) {
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E04001,
          }),
        );
        return;
      }
      try {
        const res = await handleCreateAttendance({
          staffId: targetStaffId,
          workDate: new AttendanceDateTime()
            .setDateString(targetWorkDate)
            .toDataFormat(),
          startTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getStartTime(),
                data.workDate as string | null | undefined,
                targetWorkDate,
              )
            : data.startTime,
          absentFlag: data.absentFlag ?? false,
          isDeemedHoliday: data.isDeemedHoliday,
          endTime: data.paidHolidayFlag
            ? resolveConfigTimeOnDate(
                getEndTime(),
                data.workDate as string | null | undefined,
                targetWorkDate,
              )
            : data.endTime,
          goDirectlyFlag: data.goDirectlyFlag,
          returnDirectlyFlag: data.returnDirectlyFlag,
          remarks: data.remarks,
          specialHolidayFlag: data.specialHolidayFlag,
          paidHolidayFlag: data.paidHolidayFlag,
          substituteHolidayDate: data.substituteHolidayDate,
          rests: data.paidHolidayFlag
            ? [
                {
                  startTime: new AttendanceDateTime()
                    .setDateString((targetWorkDate as string) || "")
                    .setRestStart()
                    .toISOString(),
                  endTime: new AttendanceDateTime()
                    .setDateString((targetWorkDate as string) || "")
                    .setRestEnd()
                    .toISOString(),
                },
              ]
            : (data.rests || []).map((rest) => ({
                startTime: rest.startTime,
                endTime: rest.endTime,
              })),
          systemComments: (data.systemComments || []).map(
            ({ comment, confirmed, createdAt }) => ({
              comment,
              confirmed,
              createdAt,
            }),
          ),
          hourlyPaidHolidayTimes: data.paidHolidayFlag
            ? []
            : buildHourlyPaidHolidayTimes(data.hourlyPaidHolidayTimes),
          logContext: {
            action: "attendance.create",
          },
        });
        if (!staff) {
          return;
        }
        if (enabledSendMail) {
          try {
            const isEditingOtherStaff =
              currentUser && staff.cognitoUserId !== currentUser.id;
            if (isEditingOtherStaff) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            logger.error(`Failed to send create mail: ${mailError}`);
          }
        }
        dispatch(
          pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S04001,
          }),
        );
        runWithoutGuard(() => navigate(attendanceListPath));
      } catch (error) {
        logger.error(`Create attendance error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Error details: ${errorMessage}`);
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E04001,
          }),
        );
      }
    },
    [
      attendance,
      staff,
      enabledSendMail,
      handleUpdateAttendance,
      handleCreateAttendance,
      targetStaffId,
      targetWorkDate,
      dispatch,
      getStartTime,
      getEndTime,
      navigate,
      attendanceListPath,
      overtimeError,
    ],
  );
  const handleAbsentFlagChange = useCallback(
    (checked: boolean) => {
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      const has = tags.includes("欠勤");
      if (checked && !has) {
        setValue("remarkTags", [...tags, "欠勤"]);
      }
      if (!checked && has) {
        setValue(
          "remarkTags",
          tags.filter((t) => t !== "欠勤"),
        );
      }
    },
    [getValues, setValue],
  );
  const handleSpecialHolidayFlagChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        const tags: string[] = (getValues("remarkTags") as string[]) || [];
        if (!tags.includes("特別休暇")) {
          setValue("remarkTags", [...tags, "特別休暇"]);
        }
        try {
          const desiredStart = resolveConfigTimeOnDate(
            getStartTime(),
            getValues("startTime") as string | null | undefined,
            targetWorkDate,
            attendance?.workDate,
            workDate,
          );
          const desiredEnd = resolveConfigTimeOnDate(
            getEndTime(),
            getValues("endTime") as string | null | undefined,
            targetWorkDate,
            attendance?.workDate,
            workDate,
          );
          if (getValues("startTime") !== desiredStart) {
            setValue("startTime", desiredStart);
          }
          if (getValues("endTime") !== desiredEnd) {
            setValue("endTime", desiredEnd);
          }
        } catch (error) {
          logger.debug(
            "Failed to set default times for special holiday",
            error,
          );
        }
        const dateStr =
          (getValues("workDate") as string) || attendance?.workDate || "";
        const lunchStartCfg = getLunchRestStartTime();
        const lunchEndCfg = getLunchRestEndTime();
        const baseDay = dateStr
          ? dayjs(dateStr)
          : workDate
            ? workDate
            : dayjs();
        const desiredRests: RestInputs[] = [
          {
            startTime: baseDay
              .hour(lunchStartCfg.hour())
              .minute(lunchStartCfg.minute())
              .second(0)
              .millisecond(0)
              .toISOString(),
            endTime: baseDay
              .hour(lunchEndCfg.hour())
              .minute(lunchEndCfg.minute())
              .second(0)
              .millisecond(0)
              .toISOString(),
          },
        ];
        try {
          const currentRests = getValues("rests") || [];
          if (JSON.stringify(currentRests) !== JSON.stringify(desiredRests)) {
            if (restReplace && typeof restReplace === "function") {
              restReplace(desiredRests);
            } else {
              setValue("rests", desiredRests);
            }
          }
        } catch (error) {
          logger.debug("Failed to sync rests for special holiday", error);
        }
        try {
          const currentHourly = getValues("hourlyPaidHolidayTimes") || [];
          if ((currentHourly as HourlyPaidHolidayTimeInputs[]).length > 0) {
            hourlyPaidHolidayTimeReplace([]);
          }
        } catch (error) {
          logger.debug(
            "Failed to clear hourly paid holiday times for special holiday",
            error,
          );
        }
        try {
          const currentPaid = getValues("paidHolidayFlag");
          if (currentPaid) {
            setValue("paidHolidayFlag", false);
          }
        } catch (error) {
          logger.debug(
            "Failed to unset paid holiday flag for special holiday",
            error,
          );
        }
      } else {
        const tags: string[] = (getValues("remarkTags") as string[]) || [];
        if (tags.includes("特別休暇")) {
          setValue(
            "remarkTags",
            tags.filter((t) => t !== "特別休暇"),
          );
        }
      }
    },
    [
      getValues,
      setValue,
      getStartTime,
      getEndTime,
      getLunchRestStartTime,
      getLunchRestEndTime,
      targetWorkDate,
      attendance,
      workDate,
      restReplace,
      hourlyPaidHolidayTimeReplace,
      logger,
    ],
  );
  const { dialog, runWithoutGuard } = usePageLeaveGuard({
    isDirty,
    isBusy: isSubmitting,
  });
  if (appConfigLoading || staffsLoading || !hasAttendanceFetched) {
    return <LinearProgress />;
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
      <div className="flex flex-col gap-2 pb-5">
        {isSubmitting && (
          <div className="mt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-1/3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-1 text-center text-sm text-slate-600">保存中...</p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <AppButton
            onClick={() => {
              navigate(attendanceListPath);
            }}
            variant="outline"
            tone="neutral"
            size="sm"
          >
            <span aria-hidden="true" className="text-base leading-none">
              ←
            </span>
            勤怠一覧に戻る
          </AppButton>
          {workDate && (
            <div className="inline-flex w-fit items-center rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-slate-600">
              {workDate.format(AttendanceDate.DisplayFormat)}
            </div>
          )}
        </div>
        <div>
          {readOnly && (
            <div className="mt-1">
              <InlineAlert tone="info">
                <div>この画面は表示専用です（編集はできません）</div>
                {sortedHistories[historyIndex] && (
                  <div className="mt-0.5 text-sm">
                    履歴作成日時:{" "}
                    {dayjs(sortedHistories[historyIndex].createdAt).format(
                      "YYYY/MM/DD HH:mm:ss",
                    )}
                  </div>
                )}
              </InlineAlert>
            </div>
          )}
          {readOnly && (
            <div className="mt-1">
              <AppButton
                onClick={() => {
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
                    navigate(
                      `${editPath}?${new URLSearchParams({ [MONTH_QUERY_KEY]: month }).toString()}`,
                    );
                  }
                }}
                variant="outline"
                tone="neutral"
                size="sm"
              >
                編集画面に戻る
              </AppButton>
            </div>
          )}
        </div>
        <div className={readOnly ? "mt-1 flex items-start gap-2" : undefined}>
          {readOnly && (
            <div className="pointer-events-auto z-[1500] max-h-[60vh] w-[260px] overflow-y-auto">
              {historiesLoading ? (
                <div className="p-2">
                  <LinearProgress />
                </div>
              ) : sortedHistories && sortedHistories.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {sortedHistories.map((h, idx) => (
                    <AppButton
                      key={idx}
                      onClick={() => {
                        setHistoryIndex(idx);
                        try {
                          applyHistory(idx);
                        } catch (error) {
                          logger.debug(
                            "Failed to apply attendance history",
                            error,
                          );
                        }
                      }}
                      variant={idx === historyIndex ? "solid" : "outline"}
                      tone={idx === historyIndex ? "primary" : "neutral"}
                      size="sm"
                      fullWidth
                      className="flex-col items-start"
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        {`履歴 #${sortedHistories.length - idx}`}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        {dayjs(h.createdAt).format("YYYY/MM/DD HH:mm:ss")}
                      </span>
                    </AppButton>
                  ))}
                </div>
              ) : (
                <div className="p-2">
                  <InlineAlert tone="info">履歴がありません。</InlineAlert>
                </div>
              )}
            </div>
          )}
          <div className="grow">
            <div className="flex flex-col gap-2 px-[120px]">
              {errorMessages.length > 0 && (
                <AttendanceErrorSummary messages={errorMessages} />
              )}

              {overtimeError && (
                <div>
                  <InlineAlert tone="error" title="残業チェック">
                    {overtimeError}
                  </InlineAlert>
                </div>
              )}

              {!attendance && (
                <div>
                  <InlineAlert tone="info">
                    指定された日付に勤怠情報の登録がありません。保存時に新規作成されます。
                  </InlineAlert>
                </div>
              )}

              <div className="flex gap-1">
                {!readOnly && <EditAttendanceHistoryList />}
                {!readOnly && <SystemCommentList />}
              </div>

              {!readOnly && (
                <GroupContainer hideAccent hideBorder>
                  <QuickInputButtons
                    setValue={setValue}
                    restReplace={restReplace}
                    hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
                    workDate={workDate}
                    visibleMode="admin"
                    getValues={getValues}
                    readOnly={readOnly}
                  />
                </GroupContainer>
              )}

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
                onGoDirectlyChange={(checked) => {
                  if (checked) {
                    setValue(
                      "startTime",
                      resolveConfigTimeOnDate(
                        getStartTime(),
                        getValues("startTime") as string | null | undefined,
                        workDate,
                        targetWorkDate,
                      ),
                    );
                    setHighlightStartTime(true);
                    setTimeout(() => setHighlightStartTime(false), 2500);
                  }
                }}
                vacationTabsContent={(() => {
                  const items: {
                    label: string;
                    content: JSX.Element;
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
                        workDate={workDate ? workDate.toISOString() : undefined}
                        setPaidHolidayTimes={true}
                        disabled={changeRequests.length > 0 || !!readOnly}
                        restReplace={restReplace}
                        getValues={getValues}
                      />
                    ),
                  });
                  if (getAbsentEnabled && getAbsentEnabled()) {
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
                                    disabled={
                                      changeRequests.length > 0 || !!readOnly
                                    }
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    });
                  }
                  if (getSpecialHolidayEnabled && getSpecialHolidayEnabled()) {
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
                                      handleSpecialHolidayFlagChange(
                                        e.target.checked,
                                      );
                                    }}
                                    disabled={
                                      changeRequests.length > 0 || !!readOnly
                                    }
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
                          disabled={
                            !(staff?.workType === "shift") || !!readOnly
                          }
                          helperText={
                            staff?.workType === "shift"
                              ? undefined
                              : "※シフト勤務のスタッフのみ設定できます"
                          }
                        />
                      </div>
                    ),
                  });
                  return (
                    <VacationTabs
                      value={vacationTab}
                      onChange={setVacationTab}
                      items={items}
                      panelPadding={2}
                      tabsProps={{
                        "aria-label": "vacation-tabs",
                        sx: { borderBottom: 1, borderColor: "divider" },
                      }}
                    />
                  );
                })()}
                remarksContent={<RemarksItem />}
                additionalBottomContent={
                  !readOnly ? (
                    <GroupContainer hideAccent hideBorder>
                      {attendance?.updatedAt && (
                        <div className="flex items-center">
                          <div className="w-[150px] font-bold">
                            最終更新日時
                          </div>
                          <div className="grow">
                            <div className="pl-1 text-base text-slate-500">
                              {dayjs(attendance.updatedAt).format(
                                "YYYY/MM/DD HH:mm:ss",
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center">
                          <div className="w-[150px] font-bold">メール設定</div>
                          <div className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={enabledSendMail}
                              onChange={() =>
                                setEnabledSendMail((prev) => !prev)
                              }
                              className="h-4 w-4 accent-emerald-600"
                            />
                            <span>スタッフに変更通知メールを送信する</span>
                          </div>
                        </div>
                      </div>
                    </GroupContainer>
                  ) : undefined
                }
              />

              <div className="flex items-center justify-center gap-3">
                <div>
                  {!readOnly && (
                    <AppButton
                      onClick={handleSubmit(onSubmit)}
                      disabled={
                        !isValid || !isDirty || isSubmitting || !!overtimeError
                      }
                      loading={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? "保存中..." : "保存"}
                    </AppButton>
                  )}
                </div>
              </div>
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
