import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Dispatch } from "@reduxjs/toolkit";
import { Attendance } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";

type NotificationMessage = string;
type AttendanceMutation = (
  staffId: string,
  workDate: string,
  isoTime: string,
) => Promise<Attendance>;

export interface AttendanceMutationOptions {
  cognitoUser: CognitoUser | null | undefined;
  today: string;
  mutation: AttendanceMutation;
  dispatch: Dispatch;
  successMessage: NotificationMessage;
  errorMessage: NotificationMessage;
  logger: Logger;
  actionLabel?: string;
}

export function executeAttendanceMutation({
  cognitoUser,
  today,
  mutation,
  dispatch,
  successMessage,
  errorMessage,
  logger,
  actionLabel = "attendance mutation",
}: AttendanceMutationOptions) {
  if (!cognitoUser) {
    logger.warn(`[${actionLabel}] skipped because Cognito user is unavailable`);
    return;
  }

  const timestamp = getNowISOStringWithZeroSeconds();

  mutation(cognitoUser.id, today, timestamp)
    .then(() => {
      dispatch(
        pushNotification({
          tone: "success",
          message: successMessage,
        }),
      );
    })
    .catch((error) => {
      logger.error(`[${actionLabel}] failed`, error);
      dispatch(
        pushNotification({
          tone: "error",
          message: errorMessage,
        }),
      );
    });
}
