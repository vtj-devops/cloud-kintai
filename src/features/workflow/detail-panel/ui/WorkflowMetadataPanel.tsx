import WorkflowStatusChip from "@entities/workflow/ui/WorkflowStatusChip";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { formatDateSlash } from "@shared/lib/time";
import type { ReactNode } from "react";

import type { WorkflowApprovalStepView } from "../../approval-flow/types";
import WorkflowApprovalTimeline from "../../approval-flow/ui/WorkflowApprovalTimeline";
import { useWorkflowDetailContext } from "../model/WorkflowDetailContext";

export type WorkflowMetadataPanelProps = {
  workflowId?: string | null;
  fallbackId?: string;
  category?: WorkflowCategory | null;
  categoryLabel: string;
  staffName: string;
  applicationDate: string;
  status?: WorkflowStatus | null;
  overTimeDetails?: {
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    reason?: string | null;
  } | null;
  customWorkflowTitle?: string | null;
  customWorkflowContent?: string | null;
  approvalSteps: WorkflowApprovalStepView[];
};

type MetadataRowProps = {
  label: string;
  value: ReactNode;
  preserveWhitespace?: boolean;
};

function MetadataRow({
  label,
  value,
  preserveWhitespace = false,
}: MetadataRowProps) {
  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 md:border-r">
        {label}
      </div>
      <div
        className={[
          "min-w-0 border-b border-slate-200 px-4 py-2.5 text-[15px] leading-7 text-slate-800",
          preserveWhitespace ? "whitespace-pre-wrap" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </div>
    </>
  );
}

export function WorkflowMetadataPanelBase({
  workflowId,
  fallbackId,
  category,
  categoryLabel,
  staffName,
  applicationDate,
  status,
  overTimeDetails,
  customWorkflowTitle,
  customWorkflowContent,
  approvalSteps,
}: WorkflowMetadataPanelProps) {
  const displayId = workflowId ?? fallbackId ?? "-";
  const isOvertime = category === WorkflowCategory.OVERTIME;
  const isPaidLeave = category === WorkflowCategory.PAID_LEAVE;
  const isAbsence = category === WorkflowCategory.ABSENCE;
  const isClockCorrection = category === WorkflowCategory.CLOCK_CORRECTION;
  const isCustom = category === WorkflowCategory.CUSTOM;

  const overtimeDate = formatDateSlash(overTimeDetails?.date);
  const overtimeTimeRange = overTimeDetails?.startTime
    ? `${overTimeDetails.startTime} - ${overTimeDetails?.endTime ?? ""}`
    : "-";

  return (
    <section className="overflow-hidden ro vunded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_24px_48px_-36px_rgba(15,23,42,0.35)] md:p-5">
      <div className="flex flex-col gap-1.5 border-b border-slate-200/80 pb-4">
        <p className="m-0 text-sm leading-6 text-slate-500">
          申請内容と現在のステータスを確認できます。
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 items-start md:grid-cols-[minmax(7rem,9.5rem)_minmax(0,1fr)] lg:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)]">
          <MetadataRow label="ID" value={displayId} />
          <MetadataRow label="種別" value={categoryLabel} />
          <MetadataRow label="申請者" value={staffName} />
          <MetadataRow label="申請日" value={applicationDate} />
          <MetadataRow
            label="ステータス"
            value={<WorkflowStatusChip status={status} />}
          />

          {isPaidLeave && (
            <>
              <MetadataRow
                label="取得期間"
                value={
                  overTimeDetails?.startTime && overTimeDetails?.endTime
                    ? overTimeDetails.startTime === overTimeDetails.endTime
                      ? formatDateSlash(overTimeDetails.startTime)
                      : `${formatDateSlash(overTimeDetails.startTime)} ～ ${formatDateSlash(
                          overTimeDetails.endTime,
                        )}`
                    : "-"
                }
              />
              {overTimeDetails?.reason && (
                <MetadataRow label="申請理由" value={overTimeDetails.reason} />
              )}
            </>
          )}

          {isAbsence && (
            <>
              <MetadataRow
                label="欠勤日"
                value={formatDateSlash(overTimeDetails?.date) || "-"}
              />
              {overTimeDetails?.reason && (
                <MetadataRow label="申請理由" value={overTimeDetails.reason} />
              )}
            </>
          )}

          {isOvertime && (
            <>
              <MetadataRow label="残業予定日" value={overtimeDate || "-"} />
              <MetadataRow label="残業予定時間" value={overtimeTimeRange} />
              {overTimeDetails?.reason && (
                <MetadataRow label="残業理由" value={overTimeDetails.reason} />
              )}
            </>
          )}

          {isClockCorrection && (
            <>
              <MetadataRow
                label="対象日"
                value={formatDateSlash(overTimeDetails?.date) || "-"}
              />
              <MetadataRow
                label="修正時刻"
                value={
                  overTimeDetails?.startTime || overTimeDetails?.endTime
                    ? `${overTimeDetails.startTime || overTimeDetails.endTime}`
                    : "-"
                }
              />
              {overTimeDetails?.reason && (
                <MetadataRow label="修正理由" value={overTimeDetails.reason} />
              )}
            </>
          )}

          {isCustom && (
            <>
              <MetadataRow
                label="タイトル"
                value={customWorkflowTitle || "-"}
              />
              <MetadataRow
                label="詳細"
                value={customWorkflowContent || "-"}
                preserveWhitespace
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <WorkflowApprovalTimeline steps={approvalSteps} />
      </div>
    </section>
  );
}

/** context接続版（WorkflowDetailProvider 内で使う場合） */
export function WorkflowMetadataPanelView() {
  const {
    workflow,
    id,
    categoryLabel,
    staffName,
    applicationDate,
    approvalSteps,
  } = useWorkflowDetailContext();

  return (
    <WorkflowMetadataPanelBase
      workflowId={workflow?.id}
      fallbackId={id}
      category={workflow?.category ?? null}
      categoryLabel={categoryLabel}
      staffName={staffName}
      applicationDate={applicationDate}
      status={workflow?.status ?? null}
      overTimeDetails={workflow?.overTimeDetails ?? null}
      customWorkflowTitle={workflow?.customWorkflowTitle ?? null}
      customWorkflowContent={workflow?.customWorkflowContent ?? null}
      approvalSteps={approvalSteps}
    />
  );
}

export default function WorkflowMetadataPanel() {
  return <WorkflowMetadataPanelView />;
}
