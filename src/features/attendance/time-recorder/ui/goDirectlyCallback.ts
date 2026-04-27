import { GoDirectlyFlag } from "@entities/attendance/lib/actions/attendanceActions";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import { resolveBusinessWorkDate } from "@entities/attendance/lib/businessDate";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Dispatch } from "@reduxjs/toolkit";
import { Attendance, Staff } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { TimeRecordMailSender } from "@shared/lib/mail/TimeRecordMailSender";
import { pushNotification } from "@shared/lib/store/notificationSlice";

import * as MESSAGE_CODE from "@/errors";

export async function goDirectlyCallback(cognitoUser: CognitoUser | null | undefined, staff: Staff | null | undefined, dispatch: Dispatch, clockIn: (staffId: string, workDate: string, startTime: string, goDirectlyFlag?: GoDirectlyFlag) => Promise<Attendance>, logger: Logger, 
// optional explicit ISO timestamp to use for work start (allows AppConfig-driven times)
startTimeIso?: string, occurredAt = getNowISOStringWithZeroSeconds()): Promise<void> {
    if (!cognitoUser) {
        logger.debug("Skipped goDirectlyCallback because cognitoUser is missing");
        return;
    }
    const workDate = resolveBusinessWorkDate(occurredAt);
    const attendanceStartTime = resolveStartTime(startTimeIso);
    try {
        const attendance = await clockIn(cognitoUser.id, workDate, attendanceStartTime, GoDirectlyFlag.YES);
        dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S01003
        }));
        try {
            await new TimeRecordMailSender(cognitoUser, attendance, staff).clockIn();
        }
        catch (mailErr) {
            logger.error("Failed to send go directly mail", mailErr);
        }
    }
    catch (error) {
        logger.error("Failed to clock in with go directly flag", error);
        dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E01005
        }));
    }
}
function resolveStartTime(startTimeIso?: string) {
    if (startTimeIso) {
        return startTimeIso;
    }
    return new AttendanceDateTime().setWorkStart().toISOString();
}
