import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { useOvertimeRequest } from "@entities/attendance/hooks/useOvertimeRequest";
import { attendanceEditSchema } from "@entities/attendance/validation/attendanceEditSchema";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import {
  type OvertimeCheckContext,
  validateOvertimeCheck,
} from "@entities/attendance/validation/overtimeCheckValidator";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { zodResolver } from "@hookform/resolvers/zod";
import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import {
  Alert,
  AlertTitle,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  styled,
  Switch,
  Typography,
} from "@mui/material";
import {
  CreateAttendanceInput,
  HourlyPaidHolidayTimeInput,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import Title from "@shared/ui/typography/Title";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceDateTime } from "@/entities/attendance/lib/AttendanceDateTime";
import { resolveConfigTimeOnDate } from "@/entities/attendance/lib/resolveConfigTimeOnDate";
import * as MESSAGE_CODE from "@/errors";
import AttendanceEditProvider from "@/features/attendance/edit/model/AttendanceEditProvider";
import {
  AttendanceEditInputs,
  defaultValues,
  HourlyPaidHolidayTimeInputs,
  RestInputs,
} from "@/features/attendance/edit/model/common";
import { SubstituteHolidayDateInput } from "@/features/attendance/edit/ui/items/SubstituteHolidayDateInput";
import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { Logger } from "@/shared/lib/logger";
import { AttendanceEditMailSender } from "@/shared/lib/mail/AttendanceEditMailSender";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

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

const SaveButton = styled(Button)(({ theme }) => ({
  width: 150,
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  border: `3px solid ${theme.palette.primary.main}`,
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.contrastText,
    border: `3px solid ${theme.palette.primary.light}`,
  },
  "&:disabled": {
    backgroundColor: "#E0E0E0",
    border: "3px solid #E0E0E0",
  },
}));

// ヘルパー関数：時間単位休暇データを安全に変換
function buildHourlyPaidHolidayTimes(
  data: HourlyPaidHolidayTimeInputs[] | undefined,
): HourlyPaidHolidayTimeInput[] {
  if (!data) {
    return [];
  }

  return data.reduce<HourlyPaidHolidayTimeInput[]>((acc, item) => {
    // 必須フィールドが両方揃っている場合のみ追加
    if (item.startTime && item.endTime) {
      acc.push({
        startTime: item.startTime,
        endTime: item.endTime,
      });
    }
    return acc;
  }, []);
}

export default function AttendanceEditor({ readOnly }: { readOnly?: boolean }) {
  const {
    getLunchRestStartTime,
    getLunchRestEndTime,
    getHourlyPaidHolidayEnabled,
    getSpecialHolidayEnabled,
    getStartTime,
    getEndTime,
    getAbsentEnabled,
    loading: appConfigLoading,
    config: appConfig,
  } = useAppConfig();
  const dispatch = useDispatch();
  const { authenticatedUser } = useAuthenticatedUser();

  const { targetWorkDate, staffId: targetStaffId } = useParams();
  const navigate = useNavigate();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { loading: staffsLoading, error: staffSError } = useStaffs({
    isAuthenticated,
  });
  const [createAttendanceMutation] = useCreateAttendanceMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();

  const handleUpdateAttendance = useCallback(
    (input: UpdateAttendanceInput) => updateAttendanceMutation(input).unwrap(),
    [updateAttendanceMutation],
  );

  const handleCreateAttendance = useCallback(
    (input: CreateAttendanceInput) => createAttendanceMutation(input).unwrap(),
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
    refetchAttendance,
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

  // 残業申請情報を取得
  const { overtimeRequestEndTime, hasOvertimeRequest } = useOvertimeRequest({
    staffId: staff?.id ?? targetStaffId ?? null,
    workDate: workDate ? workDate.format("YYYY-MM-DD") : null,
    isAuthenticated,
  });

  const lunchRestStartTime = useMemo(
    () => getLunchRestStartTime().format("HH:mm"),
    [getLunchRestStartTime],
  );
  const lunchRestEndTime = useMemo(
    () => getLunchRestEndTime().format("HH:mm"),
    [getLunchRestEndTime],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const watchedData = watch();
  const errorMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );

  // 残業チェック：業務終了時間を超過した場合の検証
  useEffect(() => {
    if (!watchedData.endTime || !appConfig) {
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

    const result = validateOvertimeCheck(watchedData.endTime, context);
    if (!result.isValid && result.errorMessage) {
      setOvertimeError(result.errorMessage);
    } else {
      setOvertimeError(null);
    }
  }, [
    watchedData.endTime,
    appConfig,
    overtimeRequestEndTime,
    hasOvertimeRequest,
    getEndTime,
  ]);

  const totalWorkTime = useMemo(() => {
    if (!watchedData.endTime) return 0;
    return calcTotalWorkTime(watchedData.startTime, watchedData.endTime);
  }, [watchedData.startTime, watchedData.endTime]);

  const totalRestTime = useMemo(
    () =>
      watchedData.rests?.reduce((acc, rest) => {
        if (!rest) return acc;
        if (!rest.endTime) return acc;

        const diff = calcTotalRestTime(rest.startTime, rest.endTime);
        return acc + diff;
      }, 0) ?? 0,
    [watchedData.rests],
  );

  const totalProductionTime = useMemo(
    () => totalWorkTime - totalRestTime,
    [totalWorkTime, totalRestTime],
  );

  // 合計時間単位休暇時間を計算
  const totalHourlyPaidHolidayTime = useMemo(
    () =>
      watchedData.hourlyPaidHolidayTimes?.reduce((acc, time) => {
        if (!time) return acc;
        if (!time.endTime) return acc;

        const diff = calcTotalHourlyPaidHolidayTime(
          time.startTime,
          time.endTime,
        );
        return acc + diff;
      }, 0) ?? 0,
    [watchedData.hourlyPaidHolidayTimes],
  );

  const visibleRestWarning = useMemo(
    () =>
      !!(
        watchedData.startTime &&
        watchedData.endTime &&
        totalWorkTime > 6 &&
        totalRestTime === 0
      ),
    [watchedData.startTime, watchedData.endTime, totalWorkTime, totalRestTime],
  );

  // 休憩中かどうかを判定（勤務開始時間と最初の休憩時間が入力されている状態）
  const isOnBreak = useMemo(
    () =>
      !!(
        watchedData.startTime &&
        watchedData.rests &&
        watchedData.rests.length > 0 &&
        watchedData.rests[0]?.startTime &&
        !watchedData.rests[0]?.endTime
      ),
    [watchedData.startTime, watchedData.rests],
  );

  const onSubmit = useCallback(
    async (data: AttendanceEditInputs) => {
      // 残業チェック：バリデーションエラーがある場合は提出を中止
      if (overtimeError) {
        dispatch(setSnackbarError(overtimeError));
        return;
      }

      // 備考はユーザー入力の値（data.remarks）をそのまま保存します。
      // 画面上に表示しているタグ（remarkTags）は見かけ上の表示であり、備考の値には影響を与えません。
      if (attendance) {
        // 有給フラグが付いている場合は勤務時間/休憩等は送らない（バックエンド側バリデーション対策）
        const payload = {
          id: attendance.id,
          staffId: attendance.staffId,
          workDate: data.workDate,
          // 有給の場合は規定開始/終了時刻を送る
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
          // 有給の場合は規定の昼休憩時間を送信する（勤務時間は規定値）
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
        };

        try {
          const res = await handleUpdateAttendance(payload);

          // 管理者が他のスタッフの勤怠を編集した場合のみメール送信
          try {
            const isEditingOtherStaff =
              staff &&
              authenticatedUser &&
              staff.cognitoUserId !== authenticatedUser.cognitoUserId;

            if (isEditingOtherStaff && res && enabledSendMail) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            // メール送信に失敗しても更新処理自体は成功扱いにする
            logger.error(`Failed to send edit mail: ${mailError}`);
          }

          // 更新後は最新の勤怠を再取得してフォームを最新化する
          if (staff && targetWorkDate) {
            await refetchAttendance();
          }

          dispatch(setSnackbarSuccess(MESSAGE_CODE.S04001));
        } catch (error) {
          logger.error(`Update attendance error:`, error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error details: ${errorMessage}`);
          dispatch(setSnackbarError(MESSAGE_CODE.E04001));
        }

        return;
      }

      if (!targetStaffId || !targetWorkDate) {
        dispatch(setSnackbarError(MESSAGE_CODE.E04001));
        return;
      }

      try {
        const res = await handleCreateAttendance({
          // 有給の場合は勤務時間/休憩などのフィールドをクリアして送信
          staffId: targetStaffId,
          workDate: new AttendanceDateTime()
            .setDateString(targetWorkDate)
            .toDataFormat(),
          // 有給の場合は規定開始/終了時刻のみ送る
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
        });

        if (!staff) {
          return;
        }

        // 管理者が他のスタッフの勤怠を作成した場合のみメール送信
        if (enabledSendMail) {
          try {
            const isEditingOtherStaff =
              authenticatedUser &&
              staff.cognitoUserId !== authenticatedUser.cognitoUserId;

            if (isEditingOtherStaff) {
              await new AttendanceEditMailSender(staff, res).changeRequest();
            }
          } catch (mailError) {
            // メール送信に失敗しても作成処理自体は成功扱いにする
            logger.error(`Failed to send create mail: ${mailError}`);
          }
        }

        dispatch(setSnackbarSuccess(MESSAGE_CODE.S04001));
      } catch (error) {
        logger.error(`Create attendance error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Error details: ${errorMessage}`);
        dispatch(setSnackbarError(MESSAGE_CODE.E04001));
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
      refetchAttendance,
      getStartTime,
      getEndTime,
      overtimeError,
    ],
  );

  // absentFlag の変更に応じて備考欄を自動更新する
  const absentFlagValue = useWatch({ control, name: "absentFlag" });

  useEffect(() => {
    const flag = !!absentFlagValue;
    const tags: string[] = (getValues("remarkTags") as string[]) || [];
    const has = tags.includes("欠勤");
    if (flag && !has) {
      setValue("remarkTags", [...tags, "欠勤"]);
    }
    if (!flag && has) {
      setValue(
        "remarkTags",
        tags.filter((t) => t !== "欠勤"),
      );
    }
  }, [absentFlagValue, setValue, getValues]);

  // specialHolidayFlag の変更に応じて備考欄へ "特別休暇" を追記/削除し、
  // ON の場合は有給と同様に規定の開始/終了時刻と休憩を設定する
  const specialHolidayFlagValue = useWatch({
    control,
    name: "specialHolidayFlag",
  });

  useEffect(() => {
    const flag = !!specialHolidayFlagValue;

    if (flag) {
      // 備考タグに特別休暇が無ければ追記
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      if (!tags.includes("特別休暇")) {
        setValue("remarkTags", [...tags, "特別休暇"]);
      }

      // 開始/終了時刻を規定値に設定（既に同じであれば何もしない）
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
      } catch (e) {
        logger.debug(`failed to set default times for special holiday: ${e}`);
      }

      // 休憩を規定値に設定（既に同じ配列でなければ置換）
      const dateStr =
        (getValues("workDate") as string) || attendance?.workDate || "";
      const lunchStartCfg = getLunchRestStartTime();
      const lunchEndCfg = getLunchRestEndTime();
      const baseDay = dateStr ? dayjs(dateStr) : workDate ? workDate : dayjs();
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
      } catch {
        // noop
      }

      // 時間単位休暇はクリア（有給時と同様）
      try {
        const currentHourly = getValues("hourlyPaidHolidayTimes") || [];
        if ((currentHourly as HourlyPaidHolidayTimeInputs[]).length > 0) {
          hourlyPaidHolidayTimeReplace([]);
        }
      } catch {
        // noop
      }

      // 特別休暇がONのとき、有給フラグが立っていたら解除する（相互排他）
      try {
        const currentPaid = getValues("paidHolidayFlag");
        if (currentPaid) {
          setValue("paidHolidayFlag", false);
        }
      } catch {
        // noop
      }
    } else {
      // OFF になったら備考タグから "特別休暇" を削除
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      if (tags.includes("特別休暇")) {
        setValue(
          "remarkTags",
          tags.filter((t) => t !== "特別休暇"),
        );
      }
    }
  }, [specialHolidayFlagValue]);

  // paidHolidayFlag の変更に応じて備考欄へ "有給休暇" を追記/削除する
  const paidHolidayFlagValue = useWatch({ control, name: "paidHolidayFlag" });

  useEffect(() => {
    const flag = !!paidHolidayFlagValue;
    try {
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      if (flag) {
        if (!tags.includes("有給休暇")) {
          setValue("remarkTags", [...tags, "有給休暇"]);
        }
      } else {
        if (tags.includes("有給休暇")) {
          setValue(
            "remarkTags",
            tags.filter((t) => t !== "有給休暇"),
          );
        }
      }
    } catch {
      // noop
    }
  }, [paidHolidayFlagValue]);

  if (appConfigLoading || staffsLoading || !hasAttendanceFetched) {
    return <LinearProgress />;
  }

  if (staffSError) {
    return (
      <Alert severity="error">
        <AlertTitle>エラー</AlertTitle>
        <Typography variant="body2">{staffSError.message}</Typography>
      </Alert>
    );
  }

  if (!targetStaffId) {
    return (
      <Alert severity="error">
        <AlertTitle>エラー</AlertTitle>
        <Typography variant="body2">スタッフが指定されていません。</Typography>
      </Alert>
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
      <Stack spacing={2} sx={{ pb: 5 }}>
        {isSubmitting && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
              保存中...
            </Typography>
          </Box>
        )}
        <Box>
          <Breadcrumbs>
            <Link to="/" color="inherit">
              TOP
            </Link>
            <Link to="/admin/attendances" color="inherit">
              勤怠管理
            </Link>
            <Link
              to={`/admin/staff/${targetStaffId}/attendance`}
              color="inherit"
            >
              勤怠一覧
            </Link>
            {workDate && (
              <Typography color="text.primary">
                {workDate.format(AttendanceDate.DisplayFormat)}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>
        <Box>
          <Title>勤怠編集</Title>
          {readOnly && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="info">
                <div>この画面は表示専用です（編集はできません）</div>
                {sortedHistories[historyIndex] && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    履歴作成日時:{" "}
                    {dayjs(sortedHistories[historyIndex].createdAt).format(
                      "YYYY/MM/DD HH:mm:ss",
                    )}
                  </Typography>
                )}
              </Alert>
            </Box>
          )}
          {/* 戻るボタンをアラート下に移動 */}
          {readOnly && (
            <Box sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const date = workDate
                    ? workDate.format(AttendanceDate.DataFormat)
                    : targetWorkDate;
                  const sid = targetStaffId;
                  if (date && sid) {
                    navigate(`/admin/attendances/edit/${date}/${sid}`);
                  }
                }}
                sx={{ zIndex: 1500, pointerEvents: "auto" }}
              >
                編集画面に戻る
              </Button>
            </Box>
          )}
        </Box>

        {/* 履歴一覧とフォームを左右に並べる（表示専用モード） */}
        <Box
          sx={
            readOnly
              ? { mt: 1, display: "flex", gap: 2, alignItems: "flex-start" }
              : {}
          }
        >
          {/* 左: 履歴リスト（表示専用時） */}
          {readOnly && (
            <Box
              sx={{
                width: 260,
                maxHeight: "60vh",
                overflowY: "auto",
                zIndex: 1500,
                pointerEvents: "auto",
              }}
            >
              {historiesLoading ? (
                <Box sx={{ p: 2 }}>
                  <LinearProgress />
                </Box>
              ) : sortedHistories && sortedHistories.length > 0 ? (
                <List dense disablePadding>
                  {sortedHistories.map((h, idx) => (
                    <ListItemButton
                      key={idx}
                      selected={idx === historyIndex}
                      onClick={() => {
                        setHistoryIndex(idx);
                        try {
                          applyHistory(idx);
                        } catch {
                          // noop
                        }
                      }}
                    >
                      <ListItemText
                        primary={`履歴 #${sortedHistories.length - idx}`}
                        secondary={dayjs(h.createdAt).format(
                          "YYYY/MM/DD HH:mm:ss",
                        )}
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Alert severity="info">履歴がありません。</Alert>
                </Box>
              )}
            </Box>
          )}

          {/* 右: フォーム（常に表示） */}
          <Box sx={{ flexGrow: 1 }}>
            <Stack spacing={2} sx={{ px: 30 }}>
              {errorMessages.length > 0 && (
                <Box>
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

              {overtimeError && (
                <Box>
                  <Alert severity="error">
                    <AlertTitle>残業チェック</AlertTitle>
                    <Typography variant="body2">{overtimeError}</Typography>
                  </Alert>
                </Box>
              )}

              {!attendance && (
                <Box>
                  <Alert severity="info">
                    指定された日付に勤怠情報の登録がありません。保存時に新規作成されます。
                  </Alert>
                </Box>
              )}

              <Stack direction="row" spacing={1}>
                {!readOnly && <EditAttendanceHistoryList />}
                {!readOnly && <SystemCommentList />}
              </Stack>

              {!readOnly && (
                <GroupContainer>
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

              <GroupContainer>
                <Box>
                  <WorkDateItem
                    staffId={targetStaffId}
                    workDate={workDate}
                    MoveDateItemComponent={MoveDateItem}
                  />
                </Box>
              </GroupContainer>

              <AttendanceEditFormSkeleton
                control={control}
                setValue={setValue}
                getValues={getValues}
                highlightStartTime={highlightStartTime}
                highlightEndTime={highlightEndTime}
                onHighlightStartTime={setHighlightStartTime}
                onHighlightEndTime={setHighlightEndTime}
                restFields={restFields}
                restAppend={restAppend}
                lunchRestStartTime={lunchRestStartTime}
                lunchRestEndTime={lunchRestEndTime}
                visibleRestWarning={visibleRestWarning}
                totalProductionTime={totalProductionTime}
                totalHourlyPaidHolidayTime={totalHourlyPaidHolidayTime}
                readOnly={readOnly}
                changeRequests={changeRequests}
                isOnBreak={isOnBreak}
                targetWorkDate={targetWorkDate}
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
                  const items: { label: string; content: JSX.Element }[] = [];
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
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" alignItems={"center"}>
                            <Box sx={{ fontWeight: "bold", width: "150px" }}>
                              欠勤
                            </Box>
                            <Box>
                              <Controller
                                name="absentFlag"
                                control={control}
                                render={({ field }) => (
                                  <Checkbox
                                    {...field}
                                    checked={field.value || false}
                                    disabled={
                                      changeRequests.length > 0 || !!readOnly
                                    }
                                  />
                                )}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      ),
                    });
                  }
                  if (getSpecialHolidayEnabled && getSpecialHolidayEnabled()) {
                    items.push({
                      label: "特別休暇",
                      content: (
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" alignItems={"center"}>
                            <Box sx={{ fontWeight: "bold", width: "150px" }}>
                              特別休暇
                            </Box>
                            <Box>
                              <Controller
                                name="specialHolidayFlag"
                                control={control}
                                render={({ field }) => (
                                  <Checkbox
                                    {...field}
                                    checked={field.value || false}
                                    disabled={
                                      changeRequests.length > 0 || !!readOnly
                                    }
                                  />
                                )}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      ),
                    });
                  }
                  if (getHourlyPaidHolidayEnabled()) {
                    items.push({
                      label: `時間単位(${hourlyPaidHolidayTimeFields.length}件)`,
                      content: (
                        <Stack spacing={1}>
                          <Stack direction="row">
                            <Box
                              sx={{ fontWeight: "bold", width: "150px" }}
                            >{`時間単位休暇(${hourlyPaidHolidayTimeFields.length}件)`}</Box>
                            <Stack spacing={1} sx={{ flexGrow: 2 }}>
                              {hourlyPaidHolidayTimeFields.length === 0 && (
                                <Box
                                  sx={{ color: "text.secondary", fontSize: 14 }}
                                >
                                  時間単位休暇の時間帯を追加してください。
                                </Box>
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
                              <Box>
                                <IconButton
                                  aria-label="add-hourly-paid-holiday-time"
                                  onClick={() =>
                                    hourlyPaidHolidayTimeAppend({
                                      startTime: null,
                                      endTime: null,
                                    })
                                  }
                                  disabled={!!readOnly}
                                >
                                  <AddAlarmIcon />
                                </IconButton>
                              </Box>
                            </Stack>
                          </Stack>
                        </Stack>
                      ),
                    });
                  }
                  items.push({
                    label: "指定休日",
                    content: (
                      <Box sx={{ mt: 1 }}>
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
                      </Box>
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
                    <GroupContainer>
                      {attendance?.updatedAt && (
                        <Stack direction="row" alignItems={"center"}>
                          <Box sx={{ fontWeight: "bold", width: "150px" }}>
                            最終更新日時
                          </Box>
                          <Box sx={{ flexGrow: 2 }}>
                            <Typography
                              variant="body1"
                              color="text.secondary"
                              sx={{ pl: 1 }}
                            >
                              {dayjs(attendance.updatedAt).format(
                                "YYYY/MM/DD HH:mm:ss",
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                      <Box>
                        <Stack direction="row" alignItems={"center"}>
                          <Box sx={{ fontWeight: "bold", width: "150px" }}>
                            メール設定
                          </Box>
                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={enabledSendMail}
                                  onChange={() =>
                                    setEnabledSendMail(!enabledSendMail)
                                  }
                                />
                              }
                              label="スタッフに変更通知メールを送信する"
                            />
                          </Box>
                        </Stack>
                      </Box>
                    </GroupContainer>
                  ) : undefined
                }
              />

              <Stack
                direction="row"
                alignItems={"center"}
                justifyContent={"center"}
                spacing={3}
              >
                <Box>
                  {!readOnly && (
                    <SaveButton
                      onClick={handleSubmit(onSubmit)}
                      disabled={
                        !isValid || !isDirty || isSubmitting || !!overtimeError
                      }
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                        ) : null
                      }
                    >
                      {isSubmitting ? "保存中..." : "保存"}
                    </SaveButton>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Box>
        <ChangeRequestDialog
          attendance={attendance}
          updateAttendance={handleUpdateAttendance}
          staff={staff}
        />
        {/* readOnly mode: don't overlay the whole page. Inputs/components
            should rely on their own `disabled`/`readOnly` props so the UI
            remains visible but non-editable where appropriate. */}
      </Stack>
    </AttendanceEditProvider>
  );
}
