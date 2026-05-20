import {
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Attendance } from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { useAppNotification } from "@shared/lib/useAppNotification";
import dayjs from "dayjs";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import { buildChangeRequestPayload } from "./attendanceEditUtils";
import sendChangeRequestMail from "./sendChangeRequestMail";

const logger = createLogger("useSubmitAttendanceEdit");

type UseSubmitAttendanceEditParams = {
  cognitoUser: CognitoUser | null | undefined;
  attendance: Attendance | null;
  staff: StaffType | null | undefined;
  staffs: StaffType[];
  targetWorkDate: string | undefined;
  attendanceListPath: string;
  runWithoutGuard: (fn: () => void) => void;
  setSubmitError: (message: string) => void;
  clearSubmitError: () => void;
};

export function useSubmitAttendanceEdit({
  cognitoUser,
  attendance,
  staff,
  staffs,
  targetWorkDate,
  attendanceListPath,
  runWithoutGuard,
  setSubmitError,
  clearSubmitError,
}: UseSubmitAttendanceEditParams) {
  const { notify } = useAppNotification();
  const navigate = useNavigate();
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

  const onSubmit = async (data: AttendanceEditInputs) => {
    clearSubmitError();
    const changeRequestPayload = buildChangeRequestPayload(data);

    if (attendance) {
      await updateAttendance({
        id: attendance.id,
        changeRequests: [changeRequestPayload],
        revision: attendance.revision,
        logContext: {
          action: "attendance.request.submit",
        },
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
            notify({
              title: "メール送信エラー",
              description: MESSAGE_CODE.E00002,
              tone: "error",
              dedupeKey: "mail-error",
            });
          }

          notify({
            title: "修正申請完了",
            description: MESSAGE_CODE.S02005,
            tone: "success",
            dedupeKey: "attendance-change-request",
          });

          runWithoutGuard(() => navigate(attendanceListPath));
        })
        .catch(() => {
          setSubmitError(MESSAGE_CODE.E02005);
          notify({
            title: "修正申請エラー",
            description: MESSAGE_CODE.E02005,
            tone: "error",
            dedupeKey: "attendance-change-request-error",
          });
        });
    } else {
      if (!staff || !targetWorkDate) {
        setSubmitError(MESSAGE_CODE.E02005);
        return;
      }

      await createAttendance({
        staffId: staff.cognitoUserId,
        workDate: dayjs(targetWorkDate).format(AttendanceDate.DataFormat),
        changeRequests: [changeRequestPayload],
        logContext: {
          action: "attendance.request.submit",
        },
      })
        .then(() => {
          notify({
            title: "修正申請完了",
            description: MESSAGE_CODE.S02005,
            tone: "success",
            dedupeKey: "attendance-change-request",
          });

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
            notify({
              title: "メール送信エラー",
              description: MESSAGE_CODE.E00002,
              tone: "error",
              dedupeKey: "mail-error",
            });
          }
          runWithoutGuard(() => navigate(attendanceListPath));
        })
        .catch((e) => {
          logger.error("Failed to update attendance:", e);
          setSubmitError(MESSAGE_CODE.E02005);
          notify({
            title: "修正申請エラー",
            description: MESSAGE_CODE.E02005,
            tone: "error",
            dedupeKey: "attendance-change-request-error",
          });
        });
    }
  };

  return { onSubmit };
}
