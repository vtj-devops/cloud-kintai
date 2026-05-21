import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import type { DailyReport } from "@shared/api/graphql/types";
import { formatStaffDisplayName } from "@shared/lib/mail/adminNotification";
import { sendMailNotification } from "@shared/lib/notification/sendMailNotification";
import dayjs from "dayjs";

import * as MESSAGE_CODE from "@/errors";

type SendDailyReportCommentNotificationParams = {
  staffs: StaffType[];
  report: DailyReport;
  commentAuthorName: string;
  commentBody: string;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY/MM/DD") : value;
};

export const sendDailyReportCommentNotification = async ({
  staffs,
  report,
  commentAuthorName,
  commentBody,
}: SendDailyReportCommentNotificationParams) => {
  const targetStaff = staffs.find((staff) => staff.id === report.staffId);
  const toAddress = targetStaff?.mailAddress?.trim();
  if (!toAddress) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  const basePath = import.meta.env.VITE_BASE_PATH;
  if (!basePath) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  const staffName = formatStaffDisplayName(
    targetStaff?.familyName,
    targetStaff?.givenName,
    "スタッフ",
  );
  const reportDateLabel = formatDate(report.reportDate);
  const subject = `日報にコメントが追加されました - ${reportDateLabel} / ${staffName}`;
  const reportUrl = `${basePath}/attendance/daily-report?date=${report.reportDate}`;
  const title = report.title?.trim() || "(無題)";

  const body = [
    `${staffName} さん`,
    "",
    `${commentAuthorName} さんがあなたの日報にコメントを追加しました。`,
    "",
    "----- 日報情報 -----",
    `対象日：${reportDateLabel}`,
    `タイトル：${title}`,
    `日報ID：${report.id}`,
    "-----",
    "",
    "コメント",
    commentBody,
    "",
    "確認用URL",
    reportUrl,
    "",
  ].join("\n");

  await sendMailNotification({ to: [toAddress], subject, body });
};
