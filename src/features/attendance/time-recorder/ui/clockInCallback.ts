/**
 * @file clockInCallback.ts
 * @description 出勤打刻時のコールバック処理を提供するユーティリティ。
 * Reduxのdispatchやユーザー情報、スタッフ情報を受け取り、打刻処理・メール送信・スナックバー表示を行う。
 */
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
 * 出勤打刻時のコールバック関数。
 *
 * @param cognitoUser - 現在のCognitoユーザー情報
 * @param clockIn - 出勤打刻を行う非同期関数
 * @param dispatch - Reduxのdispatch関数
 * @param staff - スタッフ情報
 * @param logger - デバッグ用ロガー
 * @param occurredAt - 打刻発生時刻（ISO）
 */
export async function clockInCallback(cognitoUser: CognitoUser | null | undefined, clockIn: (staffId: string, workDate: string, startTime: string) => Promise<Attendance>, dispatch: Dispatch, staff: Staff | null | undefined, logger: Logger, occurredAt = getNowISOStringWithZeroSeconds()): Promise<void> {
    if (!cognitoUser) {
        logger.debug("Skipped clockInCallback because cognitoUser is missing");
        return;
    }
    if (!staff) {
        logger.debug("Skipped clockInCallback because staff is missing");
        return;
    }
    const workDate = resolveBusinessWorkDate(occurredAt);
    const startTimeIso = occurredAt;
    const t0 = Date.now();
    try {
        const attendance = await clockIn(cognitoUser.id, workDate, startTimeIso);
        void t0;
        dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S01001
        }));
        try {
            await new TimeRecordMailSender(cognitoUser, attendance, staff).clockIn();
        }
        catch (mailErr) {
            logger.error("Failed to send clock in mail", mailErr);
        }
    }
    catch (error) {
        logger.error("Failed to clock in", error);
        dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E01001
        }));
    }
}
