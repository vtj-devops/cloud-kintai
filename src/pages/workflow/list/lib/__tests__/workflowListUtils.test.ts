import type { WorkflowListItem } from "@features/workflow/list/workflowListModel";
import { WorkflowStatus } from "@shared/api/graphql/types";

import {
  buildStatusSummary,
  buildWorkflowDetailPath,
  countItemsByStatus,
  getStatusCount,
  isCancelledWorkflow,
  resolveWorkflowKey,
  resolveWorkflowStatusKey,
} from "../workflowListUtils";

const makeItem = (
  overrides: Partial<WorkflowListItem> = {}
): WorkflowListItem => ({
  id: "item-1",
  name: "有給申請",
  status: "提出済み",
  rawStatus: WorkflowStatus.SUBMITTED,
  rawId: "wf-1",
  applicant: "山田太郎",
  createdAt: "2024-01-01",
  ...overrides,
});

describe("resolveWorkflowStatusKey", () => {
  it("returns rawStatus when present", () => {
    expect(resolveWorkflowStatusKey(makeItem({ rawStatus: WorkflowStatus.APPROVED }))).toBe(
      WorkflowStatus.APPROVED
    );
  });

  it("falls back to status when rawStatus is absent", () => {
    const item = makeItem({ rawStatus: undefined });
    expect(resolveWorkflowStatusKey(item)).toBe("提出済み");
  });

  it("returns UNKNOWN when both status and rawStatus are absent", () => {
    const item = makeItem({ rawStatus: undefined, status: undefined });
    expect(resolveWorkflowStatusKey(item)).toBe("UNKNOWN");
  });
});

describe("isCancelledWorkflow", () => {
  it("returns true for CANCELLED rawStatus", () => {
    expect(isCancelledWorkflow(makeItem({ rawStatus: WorkflowStatus.CANCELLED }))).toBe(true);
  });

  it("returns false for non-CANCELLED status", () => {
    expect(isCancelledWorkflow(makeItem({ rawStatus: WorkflowStatus.APPROVED }))).toBe(false);
  });
});

describe("countItemsByStatus", () => {
  it("counts items by their status key", () => {
    const items = [
      makeItem({ rawStatus: WorkflowStatus.SUBMITTED }),
      makeItem({ rawStatus: WorkflowStatus.SUBMITTED }),
      makeItem({ rawStatus: WorkflowStatus.APPROVED }),
    ];
    const counts = countItemsByStatus(items);
    expect(counts.get(WorkflowStatus.SUBMITTED)).toBe(2);
    expect(counts.get(WorkflowStatus.APPROVED)).toBe(1);
  });

  it("returns empty map for empty array", () => {
    expect(countItemsByStatus([])).toEqual(new Map());
  });
});

describe("getStatusCount", () => {
  it("returns count for given status", () => {
    const counts = new Map([[WorkflowStatus.SUBMITTED, 3]]);
    expect(getStatusCount(counts, WorkflowStatus.SUBMITTED)).toBe(3);
  });

  it("returns 0 for missing status", () => {
    expect(getStatusCount(new Map(), WorkflowStatus.APPROVED)).toBe(0);
  });
});

describe("buildStatusSummary", () => {
  it("returns correct totals and breakdowns", () => {
    const items = [
      makeItem({ rawStatus: WorkflowStatus.DRAFT }),
      makeItem({ rawStatus: WorkflowStatus.SUBMITTED }),
      makeItem({ rawStatus: WorkflowStatus.SUBMITTED }),
      makeItem({ rawStatus: WorkflowStatus.APPROVED }),
    ];
    const summary = buildStatusSummary(items);
    expect(summary.total).toBe(4);
    expect(summary.draft).toBe(1);
    expect(summary.pending).toBe(2);
    expect(summary.approved).toBe(1);
  });

  it("returns all zeros for empty list", () => {
    const summary = buildStatusSummary([]);
    expect(summary).toEqual({ total: 0, draft: 0, pending: 0, approved: 0 });
  });
});

describe("resolveWorkflowKey", () => {
  it("uses rawId when present", () => {
    expect(resolveWorkflowKey(makeItem({ rawId: "wf-42" }))).toBe("wf-42");
  });

  it("falls back to name-createdAt when rawId is absent", () => {
    const item = makeItem({ rawId: undefined, name: "申請", createdAt: "2024-03-01" });
    expect(resolveWorkflowKey(item)).toBe("申請-2024-03-01");
  });
});

describe("buildWorkflowDetailPath", () => {
  it("builds path with encoded rawId", () => {
    const item = makeItem({ rawId: "wf-1" });
    expect(buildWorkflowDetailPath(item)).toBe("/workflow/wf-1");
  });

  it("encodes special characters in the key", () => {
    const item = makeItem({ rawId: undefined, name: "有給申請", createdAt: "2024-01-01" });
    expect(buildWorkflowDetailPath(item)).toContain("/workflow/");
  });
});
