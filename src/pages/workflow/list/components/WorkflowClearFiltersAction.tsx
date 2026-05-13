import { AppButton } from "@shared/ui/button";

import { WORKFLOW_CLEAR_FILTERS_LABEL } from "./workflowListContentShared";

type WorkflowClearFiltersActionProps = {
  onClearFilters: () => void;
};

export default function WorkflowClearFiltersAction({
  onClearFilters,
}: WorkflowClearFiltersActionProps) {
  return (
    <div className="workflow-filter-actions">
      <AppButton
        variant="outline"
        tone="secondary"
        size="sm"
        onClick={onClearFilters}
        className="workflow-clear-filters-button"
        startIcon={
          <span className="workflow-clear-filters-button__icon">×</span>
        }
      >
        {WORKFLOW_CLEAR_FILTERS_LABEL}
      </AppButton>
    </div>
  );
}
