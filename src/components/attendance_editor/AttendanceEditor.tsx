import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import {
  Alert,
  AlertTitle,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  styled,
  Switch,
  Typography,
} from "@mui/material";
import { Logger } from "aws-amplify";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { SystemCommentInput } from "@/API";
import fetchStaff from "@/hooks/useStaff/fetchStaff";
import { AttendanceDate } from "@/lib/AttendanceDate";
import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditMailSender } from "@/lib/mail/AttendanceEditMailSender";
import AttendanceEditProvider from "@/pages/AttendanceEdit/AttendanceEditProvider";
import {
  AttendanceEditInputs,
  defaultValues,
} from "@/pages/AttendanceEdit/common";
import { SubstituteHolidayDateInput } from "@/pages/AttendanceEdit/DesktopEditor/SubstituteHolidayDateInput";

import { useAppDispatchV2 } from "../../app/hooks";
import * as MESSAGE_CODE from "../../errors";
import useAttendance from "../../hooks/useAttendance/useAttendance";
import useStaffs, {
  mappingStaffRole,
  StaffType,
} from "../../hooks/useStaffs/useStaffs";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../lib/reducers/snackbarReducer";
import Title from "../Title/Title";
import ChangeRequestDialog from "./ChangeRequestDialog/ChangeRequestDialog";
// eslint-disable-next-line import/no-cycle
import EditAttendanceHistoryList from "./EditAttendanceHistoryList/EditAttendanceHistoryList";
import GoDirectlyFlagInput from "./GoDirectlyFlagInput";
import ProductionTimeItem from "./items/ProductionTimeItem";
// eslint-disable-next-line import/no-cycle
import RemarksItem from "./items/RemarksItem";
// eslint-disable-next-line import/no-cycle
import {
  calcTotalRestTime,
  RestTimeItem,
} from "./items/RestTimeItem/RestTimeItem";
import SeparatorItem from "./items/SeparatorItem";
import StaffNameItem from "./items/StaffNameItem";
import WorkDateItem from "./items/WorkDateItem";
// eslint-disable-next-line import/no-cycle
import {
  calcTotalWorkTime,
  WorkTimeItem,
} from "./items/WorkTimeItem/WorkTimeItem";
import { LunchRestTimeNotSetWarning } from "./LunchRestTimeNotSetWarning";
import PaidHolidayFlagInput from "./PaidHolidayFlagInput";
import ReturnDirectlyFlagInput from "./ReturnDirectlyFlagInput";
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

export default function AttendanceEditor() {
  const dispatch = useAppDispatchV2();

  const { targetWorkDate, staffId: targetStaffId } = useParams();
  const { staffs, loading: staffsLoading, error: staffSError } = useStaffs();
  const { attendance, getAttendance, updateAttendance, createAttendance } =
    useAttendance();
  const [staff, setStaff] = useState<StaffType | undefined | null>(undefined);
  const [workDate, setWorkDate] = useState<dayjs.Dayjs | null>(null);
  const [enabledSendMail, setEnabledSendMail] = useState<boolean>(true);
  const [totalProductionTime, setTotalProductionTime] = useState<number>(0);
  const [visibleRestWarning, setVisibleRestWarning] = useState<boolean>(false);

  const logger = new Logger(
    "AttendanceEditor",
    import.meta.env.DEV ? "DEBUG" : "ERROR"
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

  useEffect(() => {
    if (!targetStaffId) return;

    fetchStaff(targetStaffId)
      .then((res) =>
        setStaff({
          id: res.id,
          cognitoUserId: res.cognitoUserId,
          familyName: res.familyName,
          givenName: res.givenName,
          mailAddress: res.mailAddress,
          owner: res.owner ?? false,
          role: mappingStaffRole(res.role),
          enabled: res.enabled,
          status: res.status,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
          usageStartDate: res.usageStartDate,
          notifications: res.notifications,
        })
      )
      .catch((e) => {
        logger.error(
          `Failed to fetch staff with ID ${targetStaffId}: ${e.message}`
        );
        dispatch(setSnackbarError(MESSAGE_CODE.E02001));
      });
  }, [staffs, targetStaffId]);

  useEffect(() => {
    if (!staff || !targetStaffId || !targetWorkDate) return;

    reset();

    setWorkDate(AttendanceDateTime.convertToDayjs(targetWorkDate));

    getAttendance(
      staff.cognitoUserId,
      new AttendanceDateTime().setDateString(targetWorkDate).toDataFormat()
    ).catch((e: Error) => {
      logger.debug(e);
      dispatch(setSnackbarError(MESSAGE_CODE.E02001));
    });
  }, [staff, targetStaffId, targetWorkDate]);

  useEffect(() => {
    watch((data) => {
      const totalWorkTime = calcTotalWorkTime(data.startTime, data.endTime);

      const totalRestTime =
        data.rests?.reduce((acc, rest) => {
          if (!rest) return acc;

          const diff = calcTotalRestTime(rest.startTime, rest.endTime);
          return acc + diff;
        }, 0) ?? 0;

      setVisibleRestWarning(
        !!(
          data.startTime &&
          data.endTime &&
          totalWorkTime > 6 &&
          totalRestTime === 0
        )
      );

      const totalTime = totalWorkTime - totalRestTime;
      setTotalProductionTime(totalTime);
    });
  }, [watch]);

  const onSubmit = async (data: AttendanceEditInputs) => {
    console.log("data", data.systemComments);

    if (attendance) {
      await updateAttendance({
        id: attendance.id,
        staffId: attendance.staffId,
        workDate: data.workDate,
        startTime: data.startTime,
        endTime: data.endTime || null,
        goDirectlyFlag: data.goDirectlyFlag,
        returnDirectlyFlag: data.returnDirectlyFlag,
        remarks: data.remarks,
        revision: data.revision,
        paidHolidayFlag: data.paidHolidayFlag,
        substituteHolidayDate: data.substituteHolidayDate,
        rests: data.rests.map((rest) => ({
          startTime: rest.startTime,
          endTime: rest.endTime,
        })),
        systemComments: data.systemComments.map(
          ({ comment, confirmed, createdAt }) => ({
            comment,
            confirmed,
            createdAt,
          })
        ),
      })
        .then((res) => {
          if (!staff || !res.histories) return;

          if (enabledSendMail) {
            new AttendanceEditMailSender(staff, res).changeRequest();
          }

          dispatch(setSnackbarSuccess(MESSAGE_CODE.S04001));
        })
        .catch((e) => {
          console.log(e);
          dispatch(setSnackbarError(MESSAGE_CODE.E04001));
        });

      return;
    }

    if (!targetStaffId || !targetWorkDate) {
      dispatch(setSnackbarError(MESSAGE_CODE.E04001));
      return;
    }

    await createAttendance({
      staffId: targetStaffId,
      workDate: new AttendanceDateTime()
        .setDateString(targetWorkDate)
        .toDataFormat(),
      startTime: data.startTime,
      endTime: data.endTime,
      goDirectlyFlag: data.goDirectlyFlag,
      returnDirectlyFlag: data.returnDirectlyFlag,
      remarks: data.remarks,
      paidHolidayFlag: data.paidHolidayFlag,
      substituteHolidayDate: data.substituteHolidayDate,
      rests: data.rests.map((rest) => ({
        startTime: rest.startTime,
        endTime: rest.endTime,
      })),
      systemComments: data.systemComments.map(
        ({ comment, confirmed, createdAt }) => ({
          comment,
          confirmed,
          createdAt,
        })
      ),
    })
      .then((res) => {
        if (!staff) {
          return;
        }

        if (enabledSendMail) {
          new AttendanceEditMailSender(staff, res).changeRequest();
        }

        dispatch(setSnackbarSuccess(MESSAGE_CODE.S04001));
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E04001));
      });
  };

  useEffect(() => {
    if (!attendance) return;

    setWorkDate(AttendanceDateTime.convertToDayjs(attendance.workDate));

    setValue("workDate", attendance.workDate);
    setValue("startTime", attendance.startTime);
    setValue("endTime", attendance.endTime);
    setValue("remarks", attendance.remarks || "");
    setValue("goDirectlyFlag", attendance.goDirectlyFlag || false);
    setValue("returnDirectlyFlag", attendance.returnDirectlyFlag || false);
    setValue("paidHolidayFlag", attendance.paidHolidayFlag || false);
    setValue("substituteHolidayDate", attendance.substituteHolidayDate);
    setValue("revision", attendance.revision);

    if (attendance.rests) {
      const rests = attendance.rests
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((item) => ({
          startTime: item.startTime,
          endTime: item.endTime,
        }));
      restReplace(rests);
    }

    if (attendance.histories) {
      const histories = attendance.histories.filter(
        (item): item is NonNullable<typeof item> => item !== null
      );
      setValue("histories", histories);
    }

    if (attendance.changeRequests) {
      const changeRequests = attendance.changeRequests.filter(
        (item): item is NonNullable<typeof item> => item !== null
      );
      setValue("changeRequests", changeRequests);
    }

    if (attendance.systemComments) {
      const systemComments = attendance.systemComments
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map(
          ({ comment, confirmed, createdAt }) =>
            ({
              comment,
              confirmed,
              createdAt,
            } as SystemCommentInput)
        );

      systemCommentReplace(systemComments);
    }
  }, [attendance]);

  if (staffsLoading || attendance === undefined) {
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
      }}
    >
      <Stack spacing={2} sx={{ pb: 5 }}>
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
        </Box>
        <Stack spacing={2} sx={{ px: 30 }}>
          <Box>
            {errors.startTime && (
              <Box>
                <Alert severity="error">
                  <AlertTitle>入力内容に誤りがあります。</AlertTitle>
                  <Typography variant="body2">
                    {errors.startTime.message}
                  </Typography>
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
          </Box>
          <Stack direction="row" spacing={1}>
            <EditAttendanceHistoryList />
            <SystemCommentList />
          </Stack>
          <Box>
            <WorkDateItem staffId={targetStaffId} workDate={workDate} />
          </Box>
          <StaffNameItem />
          <PaidHolidayFlagInput />
          <SubstituteHolidayDateInput />
          <Stack direction="row" alignItems={"center"}>
            <Box sx={{ fontWeight: "bold", width: "150px" }}>直行</Box>
            <Box>
              <GoDirectlyFlagInput />
            </Box>
          </Stack>
          <Stack direction="row" alignItems={"center"}>
            <Box sx={{ fontWeight: "bold", width: "150px" }}>直帰</Box>
            <Box>
              <ReturnDirectlyFlagInput />
            </Box>
          </Stack>
          <WorkTimeItem />
          <Stack direction="row">
            <Box
              sx={{ fontWeight: "bold", width: "150px" }}
            >{`休憩時間(${restFields.length}件)`}</Box>
            <Stack spacing={1} sx={{ flexGrow: 2 }}>
              {restFields.length === 0 && (
                <Stack direction="column" spacing={1}>
                  <Alert severity="info">
                    昼休憩はスタッフが退勤打刻時に12:00〜13:00で自動打刻されます。
                  </Alert>
                  {visibleRestWarning && (
                    <Box>
                      <LunchRestTimeNotSetWarning
                        targetWorkDate={targetWorkDate}
                      />
                    </Box>
                  )}
                </Stack>
              )}
              {restFields.map((rest, index) => (
                <RestTimeItem key={index} rest={rest} index={index} />
              ))}
              <Box>
                <IconButton
                  aria-label="staff-search"
                  onClick={() =>
                    restAppend({
                      startTime: null,
                      endTime: null,
                    })
                  }
                >
                  <AddAlarmIcon />
                </IconButton>
              </Box>
            </Stack>
          </Stack>
          <Box>
            <SeparatorItem />
          </Box>
          <Box>
            <ProductionTimeItem time={totalProductionTime} />
          </Box>
          <Box>
            <RemarksItem />
          </Box>
          <Box>
            <Stack direction="row" alignItems={"center"}>
              <Box sx={{ fontWeight: "bold", width: "150px" }}>メール設定</Box>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabledSendMail}
                      onChange={() => setEnabledSendMail(!enabledSendMail)}
                    />
                  }
                  label="スタッフに変更通知メールを送信する"
                />
              </Box>
            </Stack>
          </Box>
          <Stack
            direction="row"
            alignItems={"center"}
            justifyContent={"center"}
            spacing={3}
          >
            <Box>
              <SaveButton
                onClick={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={"24"} /> : null
                }
              >
                保存
              </SaveButton>
            </Box>
          </Stack>
        </Stack>
        <ChangeRequestDialog
          attendance={attendance}
          updateAttendance={updateAttendance}
          staff={staff}
        />
      </Stack>
    </AttendanceEditProvider>
  );
}
