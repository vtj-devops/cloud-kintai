import {
  applyWorkflowFilters,
  isWorkflowFilterActive,
  mapWorkflowsToListItems,
  type WorkflowLike,
  type WorkflowListFilters,
} from "@features/workflow/list/workflowListModel";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/entities/workflow/lib/workflowLabels";

const buildWorkflow = (
  overrides: Partial<WorkflowLike> = {},
): WorkflowLike => ({
  id: "wf-default",
  staffId: "staff-1",
  status: WorkflowStatus.DRAFT,
  category: WorkflowCategory.PAID_LEAVE,
  createdAt: "2024-01-01T10:00:00Z",
  overTimeDetails: { date: "2024-01-05" },
  ...overrides,
});

describe("mapWorkflowsToListItems", () => {
  it("returns empty array when staff id is missing", () => {
    const result = mapWorkflowsToListItems([buildWorkflow()], undefined);
    expect(result).toEqual([]);
  });

  it("filters by staff id and sorts by application date", () => {
    const workflows = [
      buildWorkflow({
        id: "wf-1",
        overTimeDetails: { date: "2024-02-10" },
      }),
      buildWorkflow({
        id: "wf-2",
        staffId: "staff-2",
        overTimeDetails: { date: "2024-02-12" },
      }),
      buildWorkflow({
        id: "wf-3",
        overTimeDetails: { date: "2024-02-05" },
      }),
      buildWorkflow({
        id: "wf-4",
        overTimeDetails: null,
        createdAt: "2024-03-01T00:00:00Z",
      }),
    ];

    const result = mapWorkflowsToListItems(workflows, "staff-1");

    expect(result).toHaveLength(3);
    expect(result.map((it) => it.rawId)).toEqual(["wf-4", "wf-1", "wf-3"]);
    expect(result.every((it) => it.rawStaffId === "staff-1")).toBe(true);
    const wf4 = result.find((it) => it.rawId === "wf-4");
    expect(wf4?.applicationDate).toBe("2024-03-01");
  });
});

describe("applyWorkflowFilters", () => {
  const baseItems = mapWorkflowsToListItems(
    [
      buildWorkflow({
        id: "wf-a",
        status: WorkflowStatus.APPROVED,
        category: WorkflowCategory.ABSENCE,
        overTimeDetails: { date: "2024-04-01" },
      }),
      buildWorkflow({
        id: "wf-b",
        status: WorkflowStatus.PENDING,
        category: WorkflowCategory.OVERTIME,
        overTimeDetails: { date: "2024-05-10" },
      }),
      buildWorkflow({
        id: "wf-c",
        status: WorkflowStatus.CANCELLED,
        category: WorkflowCategory.PAID_LEAVE,
        createdAt: "2024-06-15T00:00:00Z",
        overTimeDetails: null,
      }),
    ],
    "staff-1",
  );

  const filter = (filters: WorkflowListFilters) =>
    applyWorkflowFilters(baseItems, filters).map((it) => it.rawId);

  it("filters by name substring", () => {
    expect(filter({ name: "wf-b" })).toEqual(["wf-b"]);
  });

  it("filters by category label or raw value", () => {
    expect(filter({ category: WorkflowCategory.ABSENCE })).toEqual(["wf-a"]);
    expect(
      filter({ category: CATEGORY_LABELS[WorkflowCategory.PAID_LEAVE] }),
    ).toEqual(["wf-c"]);
  });

  it("filters by status label or raw value", () => {
    expect(filter({ status: [WorkflowStatus.PENDING] })).toEqual(["wf-b"]);
    expect(
      filter({ status: [STATUS_LABELS[WorkflowStatus.APPROVED]] }),
    ).toEqual(["wf-a"]);
  });

  it("filters by application date range", () => {
    expect(
      filter({ applicationFrom: "2024-04-01", applicationTo: "2024-04-30" }),
    ).toEqual(["wf-a"]);
  });

  it("filters by created date range when application date missing", () => {
    expect(
      filter({ createdFrom: "2024-06-01", createdTo: "2024-06-30" }),
    ).toEqual(["wf-c"]);
  });
});

describe("isWorkflowFilterActive", () => {
  it("detects when any filter is populated", () => {
    expect(isWorkflowFilterActive({})).toBe(false);
    expect(isWorkflowFilterActive({ status: [WorkflowStatus.DRAFT] })).toBe(
      true,
    );
  });
});
