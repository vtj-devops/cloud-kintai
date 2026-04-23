import { act, renderHook } from "@testing-library/react";

import {
  useWorkflowListFilters,
  type UseWorkflowListFiltersResult,
} from "../useWorkflowListFilters";
import type { WorkflowLike } from "../workflowListModel";
import { DEFAULT_STATUS_FILTERS } from "../workflowListModel";

const makeWorkflow = (
  overrides: Partial<WorkflowLike> = {}
): WorkflowLike => ({
  id: "wf-1",
  staffId: "staff-1",
  status: "SUBMITTED" as WorkflowLike["status"],
  category: "OVERTIME" as WorkflowLike["category"],
  createdAt: "2024-03-15T10:00:00Z",
  ...overrides,
});

describe("useWorkflowListFilters", () => {
  const currentStaffId = "staff-1";

  it("returns empty items when workflows is null", () => {
    const { result } = renderHook(() =>
      useWorkflowListFilters({ workflows: null, currentStaffId })
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.filteredItems).toEqual([]);
  });

  it("returns empty items when workflows is undefined", () => {
    const { result } = renderHook(() =>
      useWorkflowListFilters({ workflows: undefined, currentStaffId })
    );
    expect(result.current.items).toEqual([]);
  });

  it("returns empty items when currentStaffId is undefined", () => {
    const { result } = renderHook(() =>
      useWorkflowListFilters({
        workflows: [makeWorkflow()],
        currentStaffId: undefined,
      })
    );
    expect(result.current.items).toEqual([]);
  });

  it("filters by currentStaffId", () => {
    const workflows = [
      makeWorkflow({ id: "wf-1", staffId: "staff-1" }),
      makeWorkflow({ id: "wf-2", staffId: "staff-2" }),
    ];
    const { result } = renderHook(() =>
      useWorkflowListFilters({ workflows, currentStaffId: "staff-1" })
    );
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].rawId).toBe("wf-1");
  });

  it("initializes with default filters", () => {
    const { result } = renderHook(() =>
      useWorkflowListFilters({ workflows: [], currentStaffId })
    );
    expect(result.current.filters.name).toBe("");
    expect(result.current.filters.status).toEqual(DEFAULT_STATUS_FILTERS);
    expect(result.current.anyFilterActive).toBe(false);
  });

  it("setFilter updates name filter", () => {
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows: [], currentStaffId })
    );

    act(() => {
      result.current.setFilter("name", "テスト");
    });

    expect(result.current.filters.name).toBe("テスト");
    expect(result.current.anyFilterActive).toBe(true);
  });

  it("setFilter does not update when value is the same", () => {
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows: [], currentStaffId })
    );

    const filtersBefore = result.current.filters;

    act(() => {
      result.current.setFilter("name", "");
    });

    expect(result.current.filters).toBe(filtersBefore);
  });

  it("setFilter with same array value does not re-render", () => {
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows: [], currentStaffId })
    );

    const filtersBefore = result.current.filters;
    const currentStatus = result.current.filters.status ?? [];

    act(() => {
      result.current.setFilter("status", [...currentStatus]);
    });

    expect(result.current.filters).toBe(filtersBefore);
  });

  it("clearFilters resets all filters to default", () => {
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows: [], currentStaffId })
    );

    act(() => {
      result.current.setFilter("name", "テスト");
      result.current.setFilter("category", "残業");
    });

    expect(result.current.anyFilterActive).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.name).toBe("");
    expect(result.current.filters.category).toBe("");
    expect(result.current.anyFilterActive).toBe(false);
  });

  it("filteredItems reflects status filter — non-matching status returns empty", () => {
    const workflows = [
      makeWorkflow({ id: "wf-1", staffId: "staff-1", status: "SUBMITTED" as WorkflowLike["status"] }),
    ];
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows, currentStaffId: "staff-1" })
    );

    expect(result.current.filteredItems).toHaveLength(1);

    act(() => {
      result.current.setFilter("status", ["APPROVED"]);
    });

    expect(result.current.filteredItems).toHaveLength(0);
  });

  it("filteredItems returns all items when status filter is empty", () => {
    const workflows = [
      makeWorkflow({ id: "wf-1", staffId: "staff-1" }),
    ];
    const { result } = renderHook<UseWorkflowListFiltersResult, unknown>(() =>
      useWorkflowListFilters({ workflows, currentStaffId: "staff-1" })
    );

    act(() => {
      result.current.setFilter("status", []);
    });

    expect(result.current.filteredItems).toHaveLength(1);
  });
});
