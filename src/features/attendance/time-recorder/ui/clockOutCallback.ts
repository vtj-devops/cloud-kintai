/**
 * 勤怠打刻（退勤）時のコールバック関数を提供します。
 *
 * @packageDocumentation
 */
import { ReturnDirectlyFlag } from "@entities/attendance/lib/actions/attendanceActions";
import { resolveBusinessWorkDate } from "@entities/attendance/lib/businessDate";
import { getNowISOStringWithZeroSeconds } from "@entities/attendance/lib/time";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Dispatch } from "@reduxjs/toolkit";
import { Attendance, Staff } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import { TimeRecordMailSender } from "@shared/lib/mail/TimeRecordMailSender";
import { pushNotification } from "@shared/lib/store/notificationSlice";

import * as MESSAGE_CODE from "@/errors";
/**
 * 退勤打刻時の処理を行うコールバック関数です。
 *
 * @param cognitoUser - 現在ログイン中のCognitoユーザー情報
 * @param clockOut - 退勤打刻を行う非同期関数
 * @param dispatch - Reduxのdispatch関数
 * @param staff - スタッフ情報
 * @param logger - ログ出力用Loggerインスタンス
 */
export async function clockOutCallback(cognitoUser: CognitoUser | null | undefined, clockOut: (staffId: string, workDate: string, endTime: string, returnDirectlyFlag?: ReturnDirectlyFlag) => Promise<Attendance>, dispatch: Dispatch, staff: Staff | null | undefined, logger: Logger, endTimeIso?: string, occurredAt = getNowISOStringWithZeroSeconds()): Promise<void> {
    if (!cognitoUser) {
        logger.debug("Skipped clockOutCallback because cognitoUser is missing");
        return;
    }
    if (!staff) {
        logger.debug("Skipped clockOutCallback because staff is missing");
        return;
    }
    const workDate = resolveBusinessWorkDate(occurredAt);
    const clockOutTime = endTimeIso ?? occurredAt;
    const t0 = Date.now();
    try {
        const attendance = await clockOut(cognitoUser.id, workDate, clockOutTime);
        void t0;
        dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S01002
        }));
        try {
            await new TimeRecordMailSender(cognitoUser, attendance, staff).clockOut();
        }
        catch (mailErr) {
            logger.error("Failed to send clock out mail", mailErr);
        }
    }
    catch (error) {
        logger.error("Failed to clock out", error);
        dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E01002
        }));
    }
}
