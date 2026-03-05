import {
  useCreateAttendanceMutation,
  useGetAttendanceByStaffAndDateQuery,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { attendanceEditSchema } from "@entities/attendance/validation/attendanceEditSchema";
import { collectAttendanceErrorMessages } from "@entities/attendance/validation/collectErrorMessages";
import {
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertTitle,
  Box,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  useFieldArray,
  useForm,
  UseFormHandleSubmit,
  useWatch,
} from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { resolveConfigTimeOnDate } from "@/entities/attendance/lib/resolveConfigTimeOnDate";
import * as MESSAGE_CODE from "@/errors";
import AttendanceEditProvider from "@/features/attendance/edit/model/AttendanceEditProvider";
import {
  AttendanceEditInputs,
  defaultValues,
  HourlyPaidHolidayTimeInputs,
} from "@/features/attendance/edit/model/common";
import DesktopEditor from "@/features/attendance/edit/ui/desktopEditor/DesktopEditor";
import { MobileEditor } from "@/features/attendance/edit/ui/mobileEditor/MobileEditor";
import { createLogger } from "@/shared/lib/logger";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

import sendChangeRequestMail from "./sendChangeRequestMail";

const logger = createLogger("AttendanceEdit");

export default function AttendanceEdit() {
  const { cognitoUser } = useContext(AuthContext);
  const {
    getHourlyPaidHolidayEnabled,
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);
  const navigate = useNavigate();
  const dispatch = useAppDispatchV2();
  const { targetWorkDate } = useParams();

  const [staff, setStaff] = useState<StaffType | undefined | null>(undefined);

  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const {
    staffs,
    loading: staffsLoading,
    error: staffSError,
  } = useStaffs({
    isAuthenticated,
  });
  const [createAttendanceMutation] = useCreateAttendanceMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceMutation();

  const createAttendance = useCallback(
    (input: Parameters<typeof createAttendanceMutation>[0]) =>
      createAttendanceMutation(input).unwrap(),
    [createAttendanceMutation],
  );

  const updateAttendance = useCallback(
    (input: Parameters<typeof updateAttendanceMutation>[0]) =>
      updateAttendanceMutation(input).unwrap(),
    [updateAttendanceMutation],
  );

  const targetWorkDateISO = useMemo(() => {
    if (!targetWorkDate) {
      return null;
    }

    return dayjs(targetWorkDate).format(AttendanceDate.DataFormat);
  }, [targetWorkDate]);

  const staffId = staff?.cognitoUserId ?? null;
  const shouldFetchAttendance = Boolean(staffId && targetWorkDateISO);

  const {
    data: attendanceData,
    isLoading: isAttendanceInitialLoading,
    isFetching: isAttendanceFetching,
    isUninitialized: isAttendanceUninitialized,
    error: attendanceError,
  } = useGetAttendanceByStaffAndDateQuery(
    {
      staffId: staffId ?? "",
      workDate: targetWorkDateISO ?? "",
    },
    { skip: !shouldFetchAttendance },
  );

  const attendance: Attendance | null = attendanceData ?? null;

  const attendanceLoading =
    !shouldFetchAttendance ||
    isAttendanceInitialLoading ||
    isAttendanceFetching ||
    isAttendanceUninitialized;

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, isSubmitting, errors },
  } = useForm<AttendanceEditInputs>({
    mode: "onChange",
    defaultValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(attendanceEditSchema) as any,
  });

  const {
    fields: restFields,
    append: restAppend,
    remove: restRemove,
    update: restUpdate,
    replace: restReplace,
  } = useFieldArray({
    control,
    name: "rests",
  });

  const {
    fields: hourlyPaidHolidayTimeFields,
    append: hourlyPaidHolidayTimeAppend,
    remove: hourlyPaidHolidayTimeRemove,
    update: hourlyPaidHolidayTimeUpdate,
    replace: hourlyPaidHolidayTimeReplace,
  } = useFieldArray({
    control,
    name: "hourlyPaidHolidayTimes",
  });

  const hourlyPaidHolidayEnabled = getHourlyPaidHolidayEnabled();

  const onSubmit = async (data: AttendanceEditInputs) => {
    // 時間単位休暇の合計時間はサーバでは利用しない（times の配列を送る）
    if (attendance) {
      await updateAttendance({
        id: attendance.id,
        changeRequests: [
          {
            startTime: data.startTime,
            endTime: data.endTime,
            goDirectlyFlag: data.goDirectlyFlag,
            returnDirectlyFlag: data.returnDirectlyFlag,
            remarks: data.remarks,
            specialHolidayFlag: data.specialHolidayFlag,
            paidHolidayFlag: data.paidHolidayFlag,
            // hourlyPaidHolidayHours is deprecated here; send times array instead
            substituteHolidayDate: data.substituteHolidayDate,
            staffComment: data.staffComment,
            rests: (data.rests || []).map((rest) => ({
              startTime: rest.startTime,
              endTime: rest.endTime,
            })),
            hourlyPaidHolidayTimes:
              data.hourlyPaidHolidayTimes?.map((item) => ({
                startTime: item.startTime ?? "",
                endTime: item.endTime ?? "",
              })) ?? [],
          },
        ],
        revision: attendance.revision,
      })
        .then(() => {
          if (!cognitoUser) return;

          try {
            void sendChangeRequestMail(
              cognitoUser,
              dayjs(attendance.workDate),
              staffs,
              data.staffComment,
            );
          } catch (mailError) {
            logger.error("Failed to send change request mail:", mailError);
            dispatch(setSnackbarError(MESSAGE_CODE.E00002));
          }

          dispatch(setSnackbarSuccess(MESSAGE_CODE.S02005));

          navigate("/attendance/list");
        })
        .catch(() => {
          dispatch(setSnackbarError(MESSAGE_CODE.E02005));
        });
    } else {
      if (!staff || !targetWorkDate) return;

      await createAttendance({
        staffId: staff.cognitoUserId,
        workDate: dayjs(targetWorkDate).format(AttendanceDate.DataFormat),
        changeRequests: [
          {
            startTime: data.startTime,
            endTime: data.endTime,
            goDirectlyFlag: data.goDirectlyFlag,
            returnDirectlyFlag: data.returnDirectlyFlag,
            remarks: data.remarks,
            specialHolidayFlag: data.specialHolidayFlag,
            paidHolidayFlag: data.paidHolidayFlag,
            // hourlyPaidHolidayHours is deprecated here; send times array instead
            substituteHolidayDate: data.substituteHolidayDate,
            staffComment: data.staffComment,
            rests: (data.rests || []).map((rest) => ({
              startTime: rest.startTime,
              endTime: rest.endTime,
            })),
            hourlyPaidHolidayTimes:
              data.hourlyPaidHolidayTimes?.map((item) => ({
                startTime: item.startTime ?? "",
                endTime: item.endTime ?? "",
              })) ?? [],
          },
        ],
      })
        .then(() => {
          dispatch(setSnackbarSuccess(MESSAGE_CODE.S02005));

          if (!cognitoUser) return;
          try {
            void sendChangeRequestMail(
              cognitoUser,
              dayjs(targetWorkDate),
              staffs,
              data.staffComment,
            );
          } catch (mailError) {
            console.error("Failed to send change request mail:", mailError);
            dispatch(setSnackbarError(MESSAGE_CODE.E00002));
          }
          navigate("/attendance/list");
        })
        .catch((e) => {
          logger.error("Failed to update attendance:", e);
          dispatch(setSnackbarError(MESSAGE_CODE.E02005));
        });
    }
  };

  // Derived state: find matching staff from staffs
  const derivedStaff = useMemo(() => {
    if (!cognitoUser?.id) return undefined;
    const { id: staffId } = cognitoUser;
    return staffs.find((s) => s.cognitoUserId === staffId) || null;
  }, [staffs, cognitoUser]);

  // Update staff state when derived staff changes
  useEffect(() => {
    setStaff(derivedStaff);
  }, [derivedStaff]);

  useEffect(() => {
    if (!staffId || !targetWorkDateISO) {
      return;
    }

    reset();
  }, [staffId, targetWorkDateISO, reset]);

  useEffect(() => {
    if (!shouldFetchAttendance || !attendanceError) {
      return;
    }

    dispatch(setSnackbarError(MESSAGE_CODE.E02001));
  }, [attendanceError, dispatch, shouldFetchAttendance]);

  useEffect(() => {
    if (!attendance || !targetWorkDateISO) {
      return;
    }

    if (attendance.workDate !== targetWorkDateISO) {
      return;
    }

    setValue("startTime", attendance.startTime);
    setValue("endTime", attendance.endTime);
    setValue("paidHolidayFlag", attendance.paidHolidayFlag || false);
    setValue("specialHolidayFlag", attendance.specialHolidayFlag || false);
    setValue("goDirectlyFlag", attendance.goDirectlyFlag || false);
    setValue("substituteHolidayDate", attendance.substituteHolidayDate);
    setValue("returnDirectlyFlag", attendance.returnDirectlyFlag || false);

    try {
      const text = attendance.remarks || "";
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const known = ["有給休暇", "特別休暇", "欠勤"];
      const tags: string[] = [];
      const others: string[] = [];
      lines.forEach((line) => {
        if (known.includes(line)) {
          tags.push(line);
        } else {
          others.push(line);
        }
      });
      setValue("remarkTags", tags);
      setValue("remarks", others.join("\n"));
    } catch {
      setValue("remarks", attendance.remarks);
    }

    const normalizedRests = attendance.rests
      ? attendance.rests
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map((item) => ({
            startTime: item.startTime,
            endTime: item.endTime,
          }))
      : [];

    setValue("rests", normalizedRests);

    const normalizedHourlyPaidHolidayTimes = attendance.hourlyPaidHolidayTimes
      ? attendance.hourlyPaidHolidayTimes
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map((item) => ({
            startTime: item.startTime,
            endTime: item.endTime,
          }))
      : [];

    setValue("hourlyPaidHolidayTimes", normalizedHourlyPaidHolidayTimes);
  }, [attendance, targetWorkDateISO, setValue]);

  // absentFlag の変更に応じて備考欄を自動更新する
  const absentFlagValue = useWatch({ control, name: "absentFlag" });

  useEffect(() => {
    const flag = !!absentFlagValue;
    try {
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
    } catch {
      // noop
    }
  }, [absentFlagValue, setValue, getValues]);

  // specialHolidayFlag の変更に応じて備考欄へ "特別休暇" を追記/削除し、ON の場合は有給と同様に規定の開始/終了時刻と休憩を設定する
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

      // 開始/終了時刻を規定値に設定
      try {
        const desiredStart = resolveConfigTimeOnDate(
          getStartTime(),
          getValues("startTime") as string | null | undefined,
          targetWorkDate,
          attendance?.workDate,
        );
        const desiredEnd = resolveConfigTimeOnDate(
          getEndTime(),
          getValues("endTime") as string | null | undefined,
          targetWorkDate,
          attendance?.workDate,
        );
        if (getValues("startTime") !== desiredStart) {
          setValue("startTime", desiredStart);
        }
        if (getValues("endTime") !== desiredEnd) {
          setValue("endTime", desiredEnd);
        }
      } catch {
        // noop
      }

      // 休憩をAppConfigの昼休憩時刻で設定
      try {
        const dateStr = (getValues("workDate") as string) || "";
        const lunchStartCfg = getLunchRestStartTime();
        const lunchEndCfg = getLunchRestEndTime();
        // 安全な基準日を決定する（workDate が無ければ targetWorkDate を利用、なければ現在日）
        const baseDay = dateStr
          ? dayjs(dateStr)
          : targetWorkDate
            ? dayjs(targetWorkDate)
            : dayjs();
        const desiredRests = [
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

      // 時間単位休暇はクリア
      try {
        const currentHourly = (getValues("hourlyPaidHolidayTimes") || []) as
          | HourlyPaidHolidayTimeInputs[]
          | undefined;
        if (
          currentHourly &&
          currentHourly.length > 0 &&
          hourlyPaidHolidayTimeReplace &&
          typeof hourlyPaidHolidayTimeReplace === "function"
        ) {
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

        // 有給ON時は規定の出退勤・休憩で上書きする
        try {
          const desiredStart = resolveConfigTimeOnDate(
            getStartTime(),
            getValues("startTime") as string | null | undefined,
            targetWorkDate,
            attendance?.workDate,
          );
          const desiredEnd = resolveConfigTimeOnDate(
            getEndTime(),
            getValues("endTime") as string | null | undefined,
            targetWorkDate,
            attendance?.workDate,
          );
          if (getValues("startTime") !== desiredStart) {
            setValue("startTime", desiredStart);
          }
          if (getValues("endTime") !== desiredEnd) {
            setValue("endTime", desiredEnd);
          }
        } catch {
          // noop
        }

        // 昼休憩をAppConfigの規定で単一に置き換える（他の休憩は強制上書き）
        try {
          const dateStr = (getValues("workDate") as string) || "";
          const lunchStartCfg = getLunchRestStartTime();
          const lunchEndCfg = getLunchRestEndTime();
          const baseDay = dateStr
            ? dayjs(dateStr)
            : targetWorkDate
              ? dayjs(targetWorkDate)
              : dayjs();
          const desiredRests = [
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

        // 時間単位休暇はクリア
        try {
          const currentHourly = (getValues("hourlyPaidHolidayTimes") || []) as
            | HourlyPaidHolidayTimeInputs[]
            | undefined;
          if (
            currentHourly &&
            currentHourly.length > 0 &&
            hourlyPaidHolidayTimeReplace &&
            typeof hourlyPaidHolidayTimeReplace === "function"
          ) {
            hourlyPaidHolidayTimeReplace([]);
          }
        } catch {
          // noop
        }

        // 有給ON時は特別休暇フラグを落とす（相互排他）
        try {
          const currentSpecial = getValues("specialHolidayFlag");
          if (currentSpecial) {
            setValue("specialHolidayFlag", false);
          }
        } catch {
          // noop
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

  const changeRequests = attendance?.changeRequests
    ? attendance.changeRequests
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter((item) => !item.completed)
    : [];
  const errorMessages = useMemo(
    () => collectAttendanceErrorMessages(errors),
    [errors],
  );

  // 休憩中かどうかを判定（勤務開始時間と最初の休憩時間が入力されている状態）
  const startTimeValue = useWatch({ control, name: "startTime" });
  const restsValue = useWatch({ control, name: "rests" });
  const isOnBreak = useMemo(
    () =>
      !!(
        startTimeValue &&
        restsValue &&
        restsValue.length > 0 &&
        restsValue[0]?.startTime &&
        !restsValue[0]?.endTime
      ),
    [startTimeValue, restsValue],
  );

  if (!targetWorkDate) {
    return null;
  }

  if (staffsLoading || attendanceLoading) {
    return <LinearProgress data-testid="attendance-loading" />;
  }

  if (staffSError) {
    dispatch(setSnackbarError(MESSAGE_CODE.E00001));
    return null;
  }

  return (
    <AttendanceEditProvider
      value={{
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
        // 時間単位休暇用のFieldArrayをContextに渡す
        hourlyPaidHolidayTimeFields,
        hourlyPaidHolidayTimeAppend,
        hourlyPaidHolidayTimeRemove,
        hourlyPaidHolidayTimeUpdate,
        hourlyPaidHolidayTimeReplace,
        hourlyPaidHolidayEnabled,
        isOnBreak,
      }}
    >
      <Box
        data-testid="attendance-edit-root"
        sx={{
          width: "100%",
          maxWidth: { md: 1280 },
          mx: "auto",
        }}
      >
        {errorMessages.length > 0 && (
          <Box mb={2}>
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
        <Box
          sx={{ display: { xs: "block", md: "none" } }}
          data-testid="attendance-mobile-editor"
        >
          <MobileEditor />
        </Box>
        <Box
          sx={{ display: { xs: "none", md: "block" } }}
          data-testid="attendance-desktop-editor"
        >
          <DesktopEditor />
        </Box>
      </Box>
    </AttendanceEditProvider>
  );
}
