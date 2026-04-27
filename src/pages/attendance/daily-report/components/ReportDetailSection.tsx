import {
  DailyReportFormChangeHandler,
  DailyReportFormFields,
} from "@features/attendance/daily-report";
import { DailyReportStatus } from "@shared/api/graphql/types";
import {
  formatDateTimeReadable,
  formatRelativeDateTime,
} from "@shared/lib/time";
import { SubsectionTitle } from "@shared/ui/typography";
import { type ReactNode } from "react";

import { buildSavedAtLabel } from "../dailyReportHelpers";
import type {
  DailyReportForm,
  DailyReportItem,
  ReactionType,
} from "../dailyReportTypes";
import { AlertBox, DividerLine, VStack } from "./DailyReportLayoutParts";

const STATUS_META: Record<
  DailyReportStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "下書き",
    className: "dr-status-chip--draft",
  },
  SUBMITTED: {
    label: "提出済",
    className: "dr-status-chip--submitted",
  },
  APPROVED: {
    label: "確認済",
    className: "dr-status-chip--approved",
  },
};

const REACTION_META: Record<ReactionType, { label: string; emoji: string }> = {
  CHEER: { label: "GOOD", emoji: "👍" },
  CHECK: { label: "確認済", emoji: "✅" },
  THANKS: { label: "感謝", emoji: "🙌" },
  LOOK: { label: "見ました", emoji: "👀" },
};

function buildUpdatedAtLabel(updatedAt: string) {
  return formatRelativeDateTime(updatedAt) || "-";
}

function resolveReportContent(content: string) {
  return content || "内容はまだ入力されていません。";
}

function buildReactionLabel(reaction: DailyReportItem["reactions"][number]) {
  const meta = REACTION_META[reaction.type];
  if (!meta) return null;
  return `${meta.emoji} ${meta.label} ×${reaction.count}`;
}

function buildCommentCreatedAtLabel(createdAt: string) {
  return formatDateTimeReadable(createdAt) || createdAt;
}

function StatusChip({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return <span className={`dr-status-chip ${className}`.trim()} data-testid="daily-report-status-chip">{label}</span>;
}

function CommentCard({ children }: { children: ReactNode }) {
  return <div className="dr-comment-card">{children}</div>;
}

function DetailHeader({ report }: { report: DailyReportItem }) {
  const statusMeta = STATUS_META[report.status];

  return (
    <div className="dr-detail-header">
      <div>
        <StatusChip label={statusMeta.label} className={statusMeta.className} />
        <SubsectionTitle className="dr-section-heading dr-break-word">{report.title}</SubsectionTitle>
        {report.updatedAt && (
          <p className="daily-report-calendar-note">
            最終更新: {buildUpdatedAtLabel(report.updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function ReportBody({
  report,
  isEditing,
  editDraft,
  isSelectedReportSubmitted,
  editDraftLastSavedAt,
  onEditChange,
}: {
  report: DailyReportItem;
  isEditing: boolean;
  editDraft: DailyReportForm | null;
  isSelectedReportSubmitted: boolean;
  editDraftLastSavedAt: string | null;
  onEditChange: DailyReportFormChangeHandler;
}) {
  if (isEditing && editDraft) {
    return (
      <VStack className="dr-gap-4">
        {isSelectedReportSubmitted && (
          <AlertBox tone="warning">
            この日報は提出済みです。先に「下書き保存」をすると、再提出できるようになります。
          </AlertBox>
        )}
        <DailyReportFormFields
          form={editDraft}
          onChange={onEditChange}
        />
        {editDraftLastSavedAt && (
          <p className="dr-saved-at">
            最終保存: {buildSavedAtLabel(editDraftLastSavedAt)}
          </p>
        )}
      </VStack>
    );
  }

  return (
    <div className="dr-content-box">
      <pre className="dr-content-text">
        {resolveReportContent(report.content)}
      </pre>
    </div>
  );
}

function AdminFeedbackSection({ report }: { report: DailyReportItem }) {
  const hasReactions = report.reactions.length > 0;
  const hasComments = report.comments.length > 0;

  if (!hasReactions && !hasComments) return null;

  return (
    <>
      <DividerLine />
      <div className="dr-content-box dr-feedback-box">
        <p className="dr-subheading dr-subheading--no-margin">管理者から</p>

        {hasReactions && (
          <div className="dr-chip-list">
            {report.reactions.map((reaction) => {
              const reactionLabel = buildReactionLabel(reaction);
              if (!reactionLabel) return null;
              return (
                <StatusChip
                  key={reaction.type}
                  label={reactionLabel}
                  className="dr-status-chip--neutral"
                />
              );
            })}
          </div>
        )}

        {hasComments && (
          <VStack className="dr-gap-3">
            {report.comments.map((comment) => (
              <CommentCard key={comment.id}>
                <div className="dr-comment-header">
                  <p className="dr-subheading dr-subheading--no-margin">
                    {comment.author}
                  </p>
                  <p className="dr-saved-at">
                    {buildCommentCreatedAtLabel(comment.createdAt)}
                  </p>
                </div>
                <p className="dr-comment-body">{comment.body}</p>
              </CommentCard>
            ))}
          </VStack>
        )}
      </div>
    </>
  );
}

interface ReportDetailSectionProps {
  report: DailyReportItem;
  isEditing: boolean;
  editDraft: DailyReportForm | null;
  isSelectedReportSubmitted: boolean;
  editDraftLastSavedAt: string | null;
  onEditChange: DailyReportFormChangeHandler;
}

export function ReportDetailSection({
  report,
  isEditing,
  editDraft,
  isSelectedReportSubmitted,
  editDraftLastSavedAt,
  onEditChange,
}: ReportDetailSectionProps) {
  return (
    <VStack className="dr-gap-5">
      <DetailHeader report={report} />

      <DividerLine />

      {report.status === DailyReportStatus.DRAFT && (
        <AlertBox tone="warning">
          この日報はまだ提出されていません。内容を確認して「提出する」ボタンをクリックしてください。
        </AlertBox>
      )}

      <ReportBody
        report={report}
        isEditing={isEditing}
        editDraft={editDraft}
        isSelectedReportSubmitted={isSelectedReportSubmitted}
        editDraftLastSavedAt={editDraftLastSavedAt}
        onEditChange={onEditChange}
      />

      <AdminFeedbackSection report={report} />
    </VStack>
  );
}
