import { ReturnDirectlyFlag } from "@entities/attendance/lib/actions/attendanceActions";
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

export async function returnDirectlyCallback(cognitoUser: CognitoUser | null | undefined, staff: Staff | null | undefined, dispatch: Dispatch, clockOut: (staffId: string, workDate: string, endTime: string, returnDirectlyFlag?: ReturnDirectlyFlag) => Promise<Attendance>, logger: Logger, 
// optional explicit ISO timestamp to use for work end (allows AppConfig-driven times)
endTimeIso?: string, occurredAt = getNowISOStringWithZeroSeconds()): Promise<void> {
    if (!cognitoUser) {
        return;
    }
    const workDate = resolveBusinessWorkDate(occurredAt);
    const workEndTime = endTimeIso ?? new AttendanceDateTime().setWorkEnd().toISOString();
    try {
        const attendance = await clockOut(cognitoUser.id, workDate, workEndTime, ReturnDirectlyFlag.YES);
        dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S01004
        }));
        try {
            await new TimeRecordMailSender(cognitoUser, attendance, staff).clockOut();
        }
        catch (mailErr) {
            logger.error("Failed to send return directly mail", mailErr);
        }
    }
    catch (error) {
        logger.debug(error);
        dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E01006
        }));
    }
}
