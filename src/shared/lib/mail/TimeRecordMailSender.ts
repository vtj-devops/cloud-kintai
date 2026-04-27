import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { Attendance, Staff } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import * as MESSAGE_CODE from "@/errors";

import { MailSender } from "./MailSender";

export class TimeRecordMailSender extends MailSender {
  cognitoUser: CognitoUser;
  attendance: Attendance;
  staff: Staff | null | undefined;

  constructor(
    cognitoUser: CognitoUser,
    attendance: Attendance,
    staff?: Staff | null
  ) {
    super();
    this.cognitoUser = cognitoUser;
    this.attendance = attendance;
    this.staff = staff;
  }

  protected getWorkDate() {
    const { workDate } = this.attendance;
    return dayjs(workDate).format(AttendanceDate.DisplayFormat);
  }

  protected getStaffName() {
    const { familyName, givenName } = this.cognitoUser;
    if (!familyName && !givenName) {
      return "";
    }

    if (familyName && givenName) {
      return `${familyName} ${givenName} さん`;
    }

    return `${familyName || givenName} さん`;
  }

  private getAdminAuditMailAddress() {
    const auditMailAddress = import.meta.env
      .VITE_ADMIN_AUDIT_MAIL_ADDRESS as string;
    if (!auditMailAddress) {
      throw new Error(MESSAGE_CODE.E00002);
    }
    return auditMailAddress;
  }

  private getStaffAttendanceUrl() {
    const { id } = this.cognitoUser;

    const APP_BASE_PATH = import.meta.env.VITE_BASE_PATH;
    if (!APP_BASE_PATH) {
      throw new Error(MESSAGE_CODE.E00002);
    }

    return `${APP_BASE_PATH}/admin/staff/${id}/attendance`;
  }

  clockIn() {
    if (!this.staff) {
      return;
    }

    const { notifications } = this.staff;

    if (notifications?.workStart) {
      const { mailAddress } = this.cognitoUser;
      const { startTime, goDirectlyFlag } = this.attendance;

      const subject = `[出勤]勤怠連絡 - ${this.getWorkDate()}`;
      const body = [
        `おはようございます。${this.getStaffName()}`,
        "",
        "出勤処理が完了しました。",
        "",
        "-----",
        `勤務日：${this.getWorkDate()}`,
        `出勤時刻：${startTime ? dayjs(startTime).format("HH:mm") : ""}`,
        `出退勤区分：${goDirectlyFlag ? "直行" : "通常出勤"}`,
        "-----",
        "",
        "本日も1日よろしくお願いします。",
      ].join("\n");

      return this.send([mailAddress], subject, body);
    }

    return this.clockInForAdmin();
  }

  private clockInForAdmin() {
    const { startTime, goDirectlyFlag } = this.attendance;

    const subject = `[出勤]勤怠連絡(${this.getStaffName()}) - ${this.getWorkDate()}`;
    const body = [
      "管理者 各位",
      "",
      `${this.getStaffName()}が出勤しました。`,
      "",
      "-----",
      `勤務日：${this.getWorkDate()}`,
      `出勤時刻：${startTime ? dayjs(startTime).format("HH:mm") : ""}`,
      `出退勤区分：${goDirectlyFlag ? "直行" : "通常出勤"}`,
      "-----",
      "",
      this.getStaffAttendanceUrl(),
      "",
    ].join("\n");

    return this.send([this.getAdminAuditMailAddress()], subject, body);
  }

  clockOut() {
    if (!this.staff) {
      return;
    }

    const { notifications } = this.staff;

    if (notifications?.workEnd) {
      const { mailAddress } = this.cognitoUser;
      const { endTime, returnDirectlyFlag } = this.attendance;

      const subject = `[退勤]勤怠連絡 - ${this.getWorkDate()}`;
      const body = [
        `お疲れ様でした。${this.getStaffName()}`,
        "",
        "退勤処理が完了しました。",
        "",
        "-----",
        `勤務日：${this.getWorkDate()}`,
        `退勤時刻：${endTime ? dayjs(endTime).format("HH:mm") : ""}`,
        `出退勤区分：${returnDirectlyFlag ? "直帰" : "通常退勤"}`,
        "-----",
        "",
        "1日お疲れ様でした。気をつけて帰ってくださいね。",
      ].join("\n");
      return this.send([mailAddress], subject, body);
    }

    return this.clockOutForAdmin();
  }

  private clockOutForAdmin() {
    const { endTime, returnDirectlyFlag } = this.attendance;
    const subject = `[退勤]勤怠連絡(${this.getStaffName()}) - ${this.getWorkDate()}`;
    const body = [
      "管理者 各位",
      "",
      `${this.getStaffName()}が退勤しました。`,
      "",
      "-----",
      `勤務日：${this.getWorkDate()}`,
      `退勤時刻：${endTime ? dayjs(endTime).format("HH:mm") : ""}`,
      `出退勤区分：${returnDirectlyFlag ? "直帰" : "通常退勤"}`,
      "-----",
      "",
      this.getStaffAttendanceUrl(),
      "",
    ].join("\n");

    return this.send([this.getAdminAuditMailAddress()], subject, body);
  }
}
