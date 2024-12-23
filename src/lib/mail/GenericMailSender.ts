import dayjs from "dayjs";

import { Attendance } from "@/API";
import * as MESSAGE_CODE from "@/errors";
import { StaffType } from "@/hooks/useStaffs/useStaffs";

import { AttendanceDate } from "../AttendanceDate";
import { MailSender } from "./MailSender";

export class GenericMailSender extends MailSender {
  staff: StaffType;
  attendance: Attendance;
  basePath: string;

  constructor(staff: StaffType, attendance: Attendance) {
    super();
    this.staff = staff;
    this.attendance = attendance;
    this.basePath = import.meta.env.VITE_BASE_PATH;
    if (!this.basePath) {
      throw new Error(MESSAGE_CODE.E00002);
    }
  }

  protected getWorkDate() {
    const { workDate } = this.attendance;
    return dayjs(workDate).format(AttendanceDate.DisplayFormat);
  }

  protected getStaffName() {
    const { familyName, givenName } = this.staff;
    if (!familyName && !givenName) {
      return "";
    }

    if (familyName && givenName) {
      return `${familyName} ${givenName} さん`;
    }

    return `${familyName || givenName} さん`;
  }

  rejectChangeRequest(comment: string | null | undefined) {
    const { mailAddress } = this.staff;
    const { workDate } = this.attendance;

    const subject = `[却下]勤怠情報の変更リクエストが却下されました - ${this.getWorkDate()}`;
    const body = [
      `お疲れ様でした。${this.getStaffName()}`,
      "",
      "勤怠情報の変更リクエストが却下されました。",
      "",
      `${this.basePath}/attendance/${dayjs(workDate).format(
        AttendanceDate.QueryParamFormat
      )}/edit`,
      "",
      "【コメント】",
      comment || "コメントはありません。",
      "",
      "疑問点などがあれば、スタッフ管理者にお問い合わせください。",
    ].join("\n");

    this.send([mailAddress], subject, body);
  }

  approveChangeRequest(comment: string | null | undefined) {
    const { mailAddress } = this.staff;
    const { workDate } = this.attendance;

    const subject = `[承認]勤怠情報の変更リクエストが承認されました - ${dayjs(
      workDate
    ).format(AttendanceDate.DisplayFormat)}`;
    const body = [
      `お疲れ様です。${this.getStaffName()}`,
      "",
      "勤怠情報の変更リクエストが承認されました。",
      "",
      `${this.basePath}/attendance/${dayjs(workDate).format(
        AttendanceDate.QueryParamFormat
      )}/edit`,
      "",
      "【コメント】",
      comment || "コメントはありません。",
      "",
      "疑問点などがあれば、スタッフ管理者にお問い合わせください。",
    ].join("\n");

    this.send([mailAddress], subject, body);
  }
}
