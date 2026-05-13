import { AppButton, AppIconButton } from "@shared/ui/button";
import { SectionTitle } from "@shared/ui/typography";
import { useEffect, useId, useMemo, useState } from "react";

import {
  useWorkflowListActions,
  useWorkflowListData,
  useWorkflowListUi,
} from "../context/WorkflowListPageContext";
import WorkflowClearFiltersAction from "./WorkflowClearFiltersAction";
import WorkflowListFiltersPanel from "./WorkflowListFiltersPanel";

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="workflow-filter-trigger-button__icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 5h13" />
      <path d="M6.5 10h7" />
      <path d="M8.5 15h3" />
    </svg>
  );
}

export default function WorkflowFiltersArea() {
  const { anyFilterActive, filters } = useWorkflowListData();
  const { onClearFilters, setFilter } = useWorkflowListActions();
  const { filterRowRef } = useWorkflowListUi();
  const [dialogOpen, setDialogOpen] = useState(false);
  const titleId = useId();

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.category) {
      count += 1;
    }

    if (filters.applicationFrom || filters.applicationTo) {
      count += 1;
    }

    if (filters.status && filters.status.length > 0) {
      count += 1;
    }

    if (filters.createdFrom || filters.createdTo) {
      count += 1;
    }

    return count;
  }, [filters]);

  const closeDialog = () => {
    filterRowRef.current?.closeAllPopovers();
    setDialogOpen(false);
  };

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [dialogOpen]);

  return (
    <>
      <section className="workflow-filter-toolbar">
        <div className="workflow-filter-toolbar__actions">
          <AppButton
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="workflow-filter-trigger-button"
            aria-haspopup="dialog"
            aria-expanded={dialogOpen}
            aria-controls={dialogOpen ? titleId : undefined}
            startIcon={<FilterIcon />}
          >
            <span>フィルター</span>
            {anyFilterActive ? (
              <span className="workflow-filter-trigger-button__badge">
                {activeFilterCount}
              </span>
            ) : null}
          </AppButton>
        </div>
      </section>

      {dialogOpen ? (
        <div
          className="workflow-filter-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeDialog}
        >
          <div
            className="workflow-filter-dialog__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="workflow-filter-dialog__header">
              <div>
                <SectionTitle
                  id={titleId}
                  className="workflow-filter-dialog__title"
                >
                  申請一覧のフィルター
                </SectionTitle>
                <p className="workflow-filter-dialog__description">
                  種別、申請日、ステータス、作成日を組み合わせて一覧を整理できます。
                </p>
              </div>
              <AppIconButton
                onClick={closeDialog}
                className="workflow-filter-dialog__close"
                aria-label="フィルターダイアログを閉じる"
                tone="neutral"
              >
                ×
              </AppIconButton>
            </div>

            <div className="workflow-filter-dialog__body">
              <WorkflowListFiltersPanel
                ref={filterRowRef}
                filters={filters}
                setFilter={setFilter}
              />
            </div>

            <div className="workflow-filter-dialog__footer">
              {anyFilterActive ? (
                <WorkflowClearFiltersAction onClearFilters={onClearFilters} />
              ) : (
                <span />
              )}
              <AppButton
                size="sm"
                onClick={closeDialog}
                className="workflow-filter-dialog__submit"
              >
                一覧に反映
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
