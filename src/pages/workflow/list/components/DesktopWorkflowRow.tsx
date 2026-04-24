import WorkflowStatusChip from "@entities/workflow/ui/WorkflowStatusChip";
import type { WorkflowListItem } from "@features/workflow/list/workflowListModel";

import {
  isCancelledWorkflow,
  resolveWorkflowStatusKey,
} from "../lib/workflowListUtils";
import { cx, EMPTY_VALUE, formatWorkflowDateValue } from "./workflowListContentShared";

export default function DesktopWorkflowRow({
  item,
  onClick,
}: {
  item: WorkflowListItem;
  onClick: (item: WorkflowListItem) => void;
}) {
  const isCancelled = isCancelledWorkflow(item);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cx("workflow-desktop-row", isCancelled && "workflow-desktop-row--cancelled")}
    >
      <div className="workflow-desktop-row__category">{item.category || EMPTY_VALUE}</div>
      <div>{formatWorkflowDateValue(item.applicationDate)}</div>
      <div>
        <WorkflowStatusChip status={resolveWorkflowStatusKey(item)} />
      </div>
      <div>{formatWorkflowDateValue(item.createdAt)}</div>
    </button>
  );
}
