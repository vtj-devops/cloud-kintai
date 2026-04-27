import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import {
  formatStaffDisplayName,
  sendAdminNotificationMail,
} from "@shared/lib/mail/adminNotification";
import dayjs from "dayjs";

import * as MESSAGE_CODE from "@/errors";

export default function sendChangeRequestMail(
  cognitoUser: CognitoUser,
  workDate: dayjs.Dayjs,
  staffs: StaffType[],
  staffComment: string | undefined,
) {
  const { id, familyName, givenName } = cognitoUser;

  const APP_BASE_PATH = import.meta.env.VITE_BASE_PATH;
  if (!APP_BASE_PATH) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  const makeWorkDate = () =>
    dayjs(workDate).format(AttendanceDate.DisplayFormat);

  const makeStaffName = () => {
    const displayName = formatStaffDisplayName(familyName, givenName);
    return `${displayName} さん`;
  };

  const makeAttendanceEditUrl = () => {
    const targetDate = workDate.format(AttendanceDate.QueryParamFormat);
    return `${APP_BASE_PATH}/admin/attendances/edit/${targetDate}/${id}`;
  };

  const subject = `勤怠の変更リクエストが申請されました - ${makeWorkDate()}`;
  const body = [
    "スタッフ管理者 各位",
    "",
    "お疲れ様です",
    "",
    `${makeStaffName()}から勤怠の変更リクエストが申請されました。`,
    "申請内容を確認して「承認」または「却下」を選択してください",
    "",
    makeAttendanceEditUrl(),
    "",
    "【コメント】",
    staffComment || "コメントはありません",
    "",
  ].join("\n");

  return sendAdminNotificationMail({ staffs, subject, body });
}
