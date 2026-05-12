import type { UseWorkflowListFiltersResult } from "@features/workflow/list/useWorkflowListFilters";
import { AppButton } from "@shared/ui/button";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";

import type { WorkflowListFiltersHandle } from "./WorkflowListFilters";
import WorkflowListFiltersPanel from "./WorkflowListFiltersPanel";

type WorkflowMobileFiltersProps = {
  anyFilterActive: boolean;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: Dispatch<SetStateAction<boolean>>;
  filterRowRef: RefObject<WorkflowListFiltersHandle | null>;
  filters: UseWorkflowListFiltersResult["filters"];
  setFilter: UseWorkflowListFiltersResult["setFilter"];
  clearFiltersAction: ReactNode;
};

export default function WorkflowMobileFilters({
  anyFilterActive,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  filterRowRef,
  filters,
  setFilter,
  clearFiltersAction,
}: WorkflowMobileFiltersProps) {
  return (
    <div className="workflow-mobile-filter-shell">
      <AppButton
        variant="outline"
        tone="secondary"
        size="sm"
        onClick={() => setMobileFiltersOpen((prev) => !prev)}
        className="workflow-mobile-filter-trigger"
        endIcon={
          <span className="workflow-mobile-filter-trigger__chevron">
            {mobileFiltersOpen ? "▲" : "▼"}
          </span>
        }
      >
        <div className="workflow-mobile-filter-trigger__left">
          <span className="workflow-mobile-filter-trigger__label">
            フィルター
          </span>
          {anyFilterActive && (
            <span className="workflow-mobile-filter-trigger__badge">
              適用中
            </span>
          )}
        </div>
      </AppButton>
      {mobileFiltersOpen ? (
        <div className="workflow-mobile-filter-panel">
          <WorkflowListFiltersPanel
            ref={filterRowRef}
            filters={filters}
            setFilter={setFilter}
          />
          {clearFiltersAction}
        </div>
      ) : null}
    </div>
  );
}
