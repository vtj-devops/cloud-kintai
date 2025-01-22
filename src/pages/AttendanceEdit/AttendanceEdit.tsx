import { Box, LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { useAppDispatchV2 } from "../../app/hooks";
import * as MESSAGE_CODE from "../../errors";
import useAttendance from "../../hooks/useAttendance/useAttendance";
import useStaffs, { StaffType } from "../../hooks/useStaffs/useStaffs";
import { AuthContext } from "../../Layout";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../lib/reducers/snackbarReducer";
import AttendanceEditProvider from "./AttendanceEditProvider";
import { AttendanceEditInputs, defaultValues } from "./common";
import DesktopEditor from "./DesktopEditor/DesktopEditor";
import { MobileEditor } from "./MobileEditor/MobileEditor";
import sendChangeRequestMail from "./sendChangeRequestMail";

export default function AttendanceEdit() {
  const { cognitoUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useAppDispatchV2();
  const { targetWorkDate } = useParams();

  const [staff, setStaff] = useState<StaffType | undefined | null>(undefined);

  const { staffs, loading: staffsLoading, error: staffSError } = useStaffs();
  const { attendance, getAttendance, updateAttendance, createAttendance } =
    useAttendance();

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = useForm<AttendanceEditInputs>({
    mode: "onChange",
    defaultValues,
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

  const onSubmit = async (data: AttendanceEditInputs) => {
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
            paidHolidayFlag: data.paidHolidayFlag,
            substituteHolidayDate: data.substituteHolidayDate,
            staffComment: data.staffComment,
            rests: data.rests.map((rest) => ({
              startTime: rest.startTime,
              endTime: rest.endTime,
            })),
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
              data.staffComment
            );
          } catch (e) {
            console.log(e);
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
            paidHolidayFlag: data.paidHolidayFlag,
            substituteHolidayDate: data.substituteHolidayDate,
            staffComment: data.staffComment,
            rests: data.rests.map((rest) => ({
              startTime: rest.startTime,
              endTime: rest.endTime,
            })),
          },
        ],
      })
        .then(() => {
          dispatch(setSnackbarSuccess(MESSAGE_CODE.S02005));

          if (!cognitoUser) return;
          void sendChangeRequestMail(
            cognitoUser,
            dayjs(targetWorkDate),
            staffs,
            data.staffComment
          );
          navigate("/attendance/list");
        })
        .catch((e) => {
          console.log("error", e);
          dispatch(setSnackbarError(MESSAGE_CODE.E02005));
        });
    }
  };

  useEffect(() => {
    if (!cognitoUser?.id) return;
    const { id: staffId } = cognitoUser;
    const matchStaff = staffs.find((s) => s.cognitoUserId === staffId);
    setStaff(matchStaff || null);
  }, [staffs, cognitoUser]);

  useEffect(() => {
    if (!staff || !targetWorkDate) return;

    reset();

    getAttendance(
      staff.cognitoUserId,
      dayjs(targetWorkDate).format(AttendanceDate.DataFormat)
    )
      .then((res) => {
        if (!res) return;

        setValue("startTime", res.startTime);
        setValue("endTime", res.endTime);
        setValue("paidHolidayFlag", res.paidHolidayFlag || false);
        setValue("goDirectlyFlag", res.goDirectlyFlag || false);
        setValue("substituteHolidayDate", res.substituteHolidayDate);
        setValue("returnDirectlyFlag", res.returnDirectlyFlag || false);
        setValue("remarks", res.remarks);
        setValue(
          "rests",
          res.rests
            ? res.rests
                .filter(
                  (item): item is NonNullable<typeof item> => item !== null
                )
                .map((item) => ({
                  startTime: item.startTime,
                  endTime: item.endTime,
                }))
            : []
        );
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E02001));
      });
  }, [staff, targetWorkDate]);

  const changeRequests = attendance?.changeRequests
    ? attendance.changeRequests
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter((item) => !item.completed)
    : [];

  if (!targetWorkDate) {
    return null;
  }

  if (staffsLoading) {
    return <LinearProgress />;
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
        handleSubmit,
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
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileEditor />
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopEditor />
      </Box>
    </AttendanceEditProvider>
  );
}
