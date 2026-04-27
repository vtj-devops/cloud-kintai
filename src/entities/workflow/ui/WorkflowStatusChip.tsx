import { REVERSE_STATUS, STATUS_LABELS } from "@entities/workflow/lib/workflowLabels";
import { WorkflowStatus } from "@shared/api/graphql/types";
import StatusChip from "@shared/ui/chips/StatusChip";

type FeedbackKey = "success" | "warning" | "danger" | "info";

const WORKFLOW_STATUS_FEEDBACK_MAP: Partial<Record<string, FeedbackKey>> = {
  [WorkflowStatus.DRAFT]: "info",
  [WorkflowStatus.SUBMITTED]: "info",
  [WorkflowStatus.PENDING]: "warning",
  [WorkflowStatus.APPROVED]: "success",
  [WorkflowStatus.REJECTED]: "danger",
  [WorkflowStatus.CANCELLED]: "danger",
};

const isWorkflowStatus = (value: string): value is WorkflowStatus =>
  Boolean(STATUS_LABELS[value as WorkflowStatus]);

const resolveStatus = (status?: string | null): WorkflowStatus | undefined => {
  if (!status) return undefined;
  if (isWorkflowStatus(status)) return status;
  const reverseKey = REVERSE_STATUS[status];
  if (reverseKey && isWorkflowStatus(reverseKey)) return reverseKey as WorkflowStatus;
  return undefined;
};

interface WorkflowStatusChipProps {
  status?: string | null;
}

export default function WorkflowStatusChip({ status }: WorkflowStatusChipProps) {
  const resolvedStatus = resolveStatus(status);
  const label = resolvedStatus
    ? STATUS_LABELS[resolvedStatus]
    : status ?? "-";

  const feedbackKey = resolvedStatus ? WORKFLOW_STATUS_FEEDBACK_MAP[resolvedStatus] : undefined;
  const labelMap: Partial<Record<string, string>> = resolvedStatus
    ? { [resolvedStatus]: label }
    : {};
  const colorMap: Partial<Record<string, FeedbackKey>> =
    resolvedStatus && feedbackKey != null
      ? { [resolvedStatus]: feedbackKey }
      : {};

  return (
    <StatusChip
      status={resolvedStatus ?? status}
      labelMap={labelMap}
      colorMap={colorMap}
    />
  );
}
