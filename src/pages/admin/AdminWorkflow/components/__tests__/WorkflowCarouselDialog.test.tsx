import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { fireEvent, render, screen } from "@testing-library/react";

import WorkflowCarouselDialog from "../WorkflowCarouselDialog";

const createWorkflow = (id: string, createdAt: string) => ({
  __typename: "Workflow" as const,
  id,
  category: WorkflowCategory.OVERTIME,
  staffId: `staff-${id}`,
  status: WorkflowStatus.PENDING,
  comments: [],
  approvalSteps: [],
  createdAt,
  updatedAt: createdAt,
});

describe("WorkflowCarouselDialog", () => {
  const workflowA = createWorkflow("wf-1", "2026-02-20T09:00:00.000Z");
  const workflowB = createWorkflow("wf-2", "2026-02-21T09:00:00.000Z");
  const workflowsById = new Map([
    [workflowA.id, workflowA],
    [workflowB.id, workflowB],
  ]);
  const staffNamesById = new Map([
    [workflowA.staffId, "山田太郎"],
    [workflowB.staffId, "鈴木花子"],
  ]);

  it("前へ/次へボタンでカルーセル移動できる", () => {
    render(
      <WorkflowCarouselDialog
        open
        onClose={jest.fn()}
        selectedWorkflowId={workflowA.id}
        filteredWorkflowIds={[workflowA.id, workflowB.id]}
        workflowsById={workflowsById}
        staffNamesById={staffNamesById}
        onOpenInRightPanel={jest.fn()}
        enableApprovalActions={false}
      />,
    );

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "前へ" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("Enterキーで右側で開くを実行し、Escapeで閉じる", () => {
    const onOpenInRightPanel = jest.fn();
    const onClose = jest.fn();

    render(
      <WorkflowCarouselDialog
        open
        onClose={onClose}
        selectedWorkflowId={workflowA.id}
        filteredWorkflowIds={[workflowA.id, workflowB.id]}
        workflowsById={workflowsById}
        staffNamesById={staffNamesById}
        onOpenInRightPanel={onOpenInRightPanel}
        enableApprovalActions={false}
      />,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onOpenInRightPanel).toHaveBeenCalledWith(workflowB.id);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
