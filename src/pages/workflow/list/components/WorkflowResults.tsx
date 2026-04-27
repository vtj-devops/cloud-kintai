import { DataStateContainer } from "@shared/ui/feedback/DataStateContainer";

import {
  useWorkflowListActions,
  useWorkflowListData,
} from "../context/WorkflowListPageContext";
import DesktopWorkflowRow from "./DesktopWorkflowRow";
import MobileWorkflowCard from "./MobileWorkflowCard";
import { cx, WORKFLOW_LIST_COLUMNS } from "./workflowListContentShared";
import { InfoCard, Spinner } from "./WorkflowSharedUi";

function WorkflowLoadingState({ isCompact }: { isCompact: boolean }) {
  return (
    <div
      className={cx(
        "workflow-loading-state",
        isCompact
          ? "workflow-loading-state--compact"
          : "workflow-loading-state--desktop",
      )}
    >
      <Spinner />
    </div>
  );
}

function WorkflowEmptyState({ isCompact }: { isCompact: boolean }) {
  return (
    <div
      className={cx(
        "workflow-empty-state",
        !isCompact && "workflow-empty-state--desktop",
      )}
    >
      <InfoCard>該当するワークフローがありません。</InfoCard>
    </div>
  );
}

export default function WorkflowResults() {
  const { isCompact, loading, filteredItems } = useWorkflowListData();
  const { resolveWorkflowKey, onCardClick } = useWorkflowListActions();
  const hasData = filteredItems.length > 0;
  const loadingContent = <WorkflowLoadingState isCompact={isCompact} />;
  const emptyContent = <WorkflowEmptyState isCompact={isCompact} />;

  if (isCompact) {
    return (
      <div className={!loading && hasData ? "workflow-mobile-results" : undefined}>
        <DataStateContainer
          isLoading={loading}
          hasData={hasData}
          loadingContent={loadingContent}
          emptyContent={emptyContent}
        >
          <>
            {filteredItems.map((item) => (
              <MobileWorkflowCard
                key={resolveWorkflowKey(item)}
                item={item}
                onClick={onCardClick}
              />
            ))}
            <p className="workflow-mobile-end-message">これ以上ありません。</p>
          </>
        </DataStateContainer>
      </div>
    );
  }

  return (
    <div className="workflow-desktop-results-shell">
      <div className="workflow-desktop-results-head">
        {WORKFLOW_LIST_COLUMNS.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div className="workflow-desktop-results-body">
        <DataStateContainer
          isLoading={loading}
          hasData={hasData}
          loadingContent={loadingContent}
          emptyContent={emptyContent}
        >
          <>
            {filteredItems.map((item) => (
              <DesktopWorkflowRow
                key={resolveWorkflowKey(item)}
                item={item}
                onClick={onCardClick}
              />
            ))}
          </>
        </DataStateContainer>
      </div>
    </div>
  );
}
