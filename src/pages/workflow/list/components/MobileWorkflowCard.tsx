import WorkflowStatusChip from "@entities/workflow/ui/WorkflowStatusChip";
import type { WorkflowListItem } from "@features/workflow/list/workflowListModel";

import {
  isCancelledWorkflow,
  resolveWorkflowStatusKey,
} from "../lib/workflowListUtils";
import {
  cx,
  EMPTY_VALUE,
  formatWorkflowDateValue,
} from "./workflowListContentShared";

export default function MobileWorkflowCard({
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
      className="workflow-mobile-card-button"
    >
      <div
        className={cx(
          "workflow-mobile-card",
          isCancelled && "workflow-mobile-card--cancelled"
        )}
      >
        <div className="workflow-mobile-card__header">
          <div className="workflow-mobile-card__title">
            {item.category || EMPTY_VALUE}
          </div>
          <div className="workflow-mobile-card__chip">
            <WorkflowStatusChip status={resolveWorkflowStatusKey(item)} />
          </div>
        </div>

        <div className="workflow-mobile-card__divider" />

        <div className="workflow-mobile-card__table">
          <span className="workflow-mobile-card__table-label">申請日</span>
          <span className="workflow-mobile-card__table-value">
            {formatWorkflowDateValue(item.applicationDate)}
          </span>

          <span className="workflow-mobile-card__table-label">作成日</span>
          <span className="workflow-mobile-card__table-value">
            {formatWorkflowDateValue(item.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
