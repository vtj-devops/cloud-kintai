import { API } from "aws-amplify";
import dayjs from "dayjs";

import { AttendanceDate } from "@/lib/AttendanceDate";

import * as MESSAGE_CODE from "../../errors";
import { sendMail } from "../../graphql/queries";
import { CognitoUser } from "../../hooks/useCognitoUser";
import { StaffRole, StaffType } from "../../hooks/useStaffs/useStaffs";

export default function sendChangeRequestMail(
  cognitoUser: CognitoUser,
  workDate: dayjs.Dayjs,
  staffs: StaffType[],
  staffComment: string | undefined
) {
  const { id, familyName, givenName } = cognitoUser;

  const adminStaffs = staffs.filter(
    (staff) =>
      staff.role === StaffRole.ADMIN || staff.role === StaffRole.STAFF_ADMIN
  );

  if (adminStaffs.length === 0) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  const APP_BASE_PATH = import.meta.env.VITE_BASE_PATH;
  if (!APP_BASE_PATH) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  const makeWorkDate = () =>
    dayjs(workDate).format(AttendanceDate.DisplayFormat);

  const makeStaffName = () => {
    if (!familyName && !givenName) {
      return "スタッフ";
    }

    if (familyName && givenName) {
      return `${familyName} ${givenName} さん`;
    }

    return `${familyName || givenName} さん`;
  };

  const makeAttendanceEditUrl = () => {
    const targetDate = workDate.format(AttendanceDate.QueryParamFormat);
    return `${APP_BASE_PATH}/admin/attendances/edit/${targetDate}/${id}`;
  };

  const mailParams = {
    query: sendMail,
    variables: {
      data: {
        to: adminStaffs.map((staff) => staff.mailAddress),
        subject: `勤怠の変更リクエストが申請されました - ${makeWorkDate()}`,
        body: [
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
        ].join("\n"),
      },
    },
  };

  console.log("mailParams", mailParams);

  try {
    void API.graphql(mailParams);
  } catch {
    throw new Error(MESSAGE_CODE.E00002);
  }
}
