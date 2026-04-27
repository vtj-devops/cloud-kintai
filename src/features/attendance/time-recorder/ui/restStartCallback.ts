import { resolveBusinessWorkDate } from "@entities/attendance/lib/businessDate";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Dispatch } from "@reduxjs/toolkit";
import { Attendance } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";

import * as MESSAGE_CODE from "@/errors";

export async function restStartCallback(cognitoUser: CognitoUser | null | undefined, dispatch: Dispatch, restStart: (staffId: string, workDate: string, startTime: string) => Promise<Attendance>, logger: Logger, occurredAt = getNowISOStringWithZeroSeconds()): Promise<void> {
    if (!cognitoUser) {
        logger.warn("[restStart] skipped because Cognito user is unavailable");
        return;
    }
    const workDate = resolveBusinessWorkDate(occurredAt);
    try {
        await restStart(cognitoUser.id, workDate, occurredAt);
        dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S01005
        }));
    }
    catch (error) {
        logger.error("[restStart] failed", error);
        dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E01003
        }));
    }
}
