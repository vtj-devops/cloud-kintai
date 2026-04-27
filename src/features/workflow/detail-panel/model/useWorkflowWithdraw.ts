import { buildWorkflowCommentsUpdateInput } from "@features/workflow/comment-thread/model/workflowCommentBuilder";
import type { WorkflowEntity } from "@features/workflow/hooks/useWorkflowLoaderWorkflow";
import { UpdateWorkflowInput, WorkflowStatus } from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import type { AppNotificationInput } from "@shared/lib/useAppNotification";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const logger = createLogger("useWorkflowWithdraw");

type UseWorkflowWithdrawParams = {
  workflow: WorkflowEntity | null | undefined;
  updateWorkflow: (input: UpdateWorkflowInput) => Promise<unknown>;
  setWorkflow: (workflow: WorkflowEntity) => void;
  notify: (input: AppNotificationInput) => void;
  navigate: ReturnType<typeof useNavigate>;
};

export function useWorkflowWithdraw({
  workflow,
  updateWorkflow,
  setWorkflow,
  notify,
  navigate,
}: UseWorkflowWithdrawParams) {
  const handleWithdraw = useCallback(async () => {
    if (!workflow?.id) return;
    if (!window.confirm("本当に取り下げますか？")) return;
    try {
      const statusInput: UpdateWorkflowInput = {
        id: workflow.id,
        status: WorkflowStatus.CANCELLED,
      };
      const afterStatus = await updateWorkflow(statusInput);
      setWorkflow(afterStatus as WorkflowEntity);

      const commentUpdate = buildWorkflowCommentsUpdateInput(
        afterStatus as WorkflowEntity,
        "申請が取り下げされました",
      );
      const afterComments = await updateWorkflow(commentUpdate);
      setWorkflow(afterComments as WorkflowEntity);

      notify({ title: "取り下げしました", tone: "success" });
      setTimeout(() => navigate("/workflow"), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Workflow withdrawal failed:", message);
      notify({
        title: "エラー",
        description: message,
        tone: "error",
      });
    }
  }, [workflow, updateWorkflow, setWorkflow, notify, navigate]);

  return { handleWithdraw };
}
