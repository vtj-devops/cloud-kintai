import { getWorkflowCategoryLabel } from "@entities/workflow/lib/workflowLabels";
import type {
  NotificationStaff,
  WorkflowData,
} from "@features/workflow/notification/model/workflowNotificationEventService";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { sendMail } from "@shared/api/graphql/documents/queries";
import { formatStaffDisplayName } from "@shared/lib/mail/adminNotification";
import { formatDateTimeReadable } from "@shared/lib/time";

import * as MESSAGE_CODE from "@/errors";

type SendWorkflowCommentNotificationArgs = {
  workflow: WorkflowData;
  actorStaffId: string;
  actorDisplayName: string;
  commentText: string;
  staffs: NotificationStaff[];
};

const normalizeRole = (role?: string | null) =>
  (role ?? "")
    .trim()
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

const isAdminRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return (
    normalized === "ADMIN" ||
    normalized === "STAFFADMIN" ||
    normalized === "OWNER"
  );
};

const parseAdminOverrideRecipients = () => {
  const raw = (
    import.meta.env.VITE_ADMIN_NOTIFICATION_EMAILS as string | undefined
  )
    ?.split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return raw ?? [];
};

const resolveAdminRecipients = (staffs: NotificationStaff[]) => {
  const overrideRecipients = parseAdminOverrideRecipients();
  if (overrideRecipients.length > 0) {
    return overrideRecipients;
  }

  return staffs
    .filter((staff) => isAdminRole(staff.role))
    .map((staff) => staff.mailAddress?.trim())
    .filter((address): address is string => Boolean(address));
};

const createEmailPayload = (
  args: SendWorkflowCommentNotificationArgs,
  to: string[],
  reviewUrl: string,
) => {
  const { workflow, actorDisplayName, commentText } = args;
  const categoryLabel = getWorkflowCategoryLabel(workflow);
  const submittedAt = formatDateTimeReadable(
    workflow.updatedAt || workflow.createdAt,
    "-",
  );
  const safeCommentText = commentText.trim() || "(コメント本文なし)";

  return {
    to,
    subject: `ワークフローにコメントが追加されました - ${categoryLabel}`,
    body: [
      "ワークフローに新しいコメントが追加されました。",
      "",
      `申請種別：${categoryLabel}`,
      `申請ID：${workflow.id}`,
      `投稿者：${actorDisplayName}`,
      `投稿日時：${submittedAt}`,
      "",
      "【コメント】",
      safeCommentText,
      "",
      "確認用URL",
      reviewUrl,
      "",
    ].join("\n"),
  };
};

export const sendWorkflowCommentNotification = async (
  args: SendWorkflowCommentNotificationArgs,
) => {
  const { workflow, actorStaffId, staffs } = args;
  const actor = staffs.find((staff) => staff.id === actorStaffId);
  const actorIsAdmin = isAdminRole(actor?.role);

  const basePath = import.meta.env.VITE_BASE_PATH;
  if (!basePath) {
    throw new Error(MESSAGE_CODE.E00002);
  }

  let recipients: string[] = [];
  let reviewUrl = `${basePath}/workflow/${workflow.id}`;

  if (actorIsAdmin) {
    const applicant = staffs.find((staff) => staff.id === workflow.staffId);
    const applicantAddress = applicant?.mailAddress?.trim();
    if (!applicantAddress) {
      return;
    }
    recipients = [applicantAddress];
    reviewUrl = `${basePath}/workflow/${workflow.id}`;
  } else {
    recipients = resolveAdminRecipients(staffs);
    reviewUrl = `${basePath}/admin/workflow/${workflow.id}`;
  }

  if (recipients.length === 0) {
    return;
  }

  const payload = createEmailPayload(args, recipients, reviewUrl);
  await graphqlClient.graphql({
    query: sendMail,
    variables: {
      data: {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
      },
    },
  });
};

export const buildWorkflowCommentActorName = (
  staffs: NotificationStaff[],
  actorStaffId: string,
  fallback: string,
) => {
  const actor = staffs.find((staff) => staff.id === actorStaffId);
  if (!actor) {
    return fallback;
  }

  return formatStaffDisplayName(actor.familyName, actor.givenName, fallback);
};
