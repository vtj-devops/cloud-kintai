import { AuthContext } from "@app/providers/auth/AuthContext";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  getCategoryLabel,
  getStaffName,
  isAssignedAsApprover,
} from "@features/workflow/notification/lib/workflowNotificationUtils";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { onCreateWorkflow } from "@shared/api/graphql/documents/subscriptions";
import {
  OnCreateWorkflowSubscription,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { useCallback, useContext, useEffect, useMemo } from "react";

const logger = createLogger("useWorkflowNotification");

/**
 * ワークフローの新規作成を購読し、自分が承認者として割り当てられている場合に通知を表示するフック
 */
export const useWorkflowNotification = (enabled = true) => {
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated" && enabled;
  const { staffs } = useStaffs({ isAuthenticated });
  const { notify } = useAppNotification();

  const currentStaffId = useMemo(() => {
    if (!cognitoUser?.id || !isAuthenticated) {
      logger.debug("No cognitoUser or not authenticated");
      return null;
    }
    const staff = staffs.find((s) => s.cognitoUserId === cognitoUser.id);
    const staffId = staff?.id ?? null;
    logger.info("Current staff ID:", {
      cognitoUserId: cognitoUser.id,
      staffId,
      staffRole: staff?.role,
    });
    return staffId;
  }, [cognitoUser, staffs, isAuthenticated]);

  const handleWorkflowCreated = useCallback(
    async (workflow: OnCreateWorkflowSubscription["onCreateWorkflow"]) => {
      logger.info("handleWorkflowCreated called:", {
        workflowId: workflow?.id,
        currentStaffId,
      });

      if (!workflow) {
        logger.warn("No workflow data");
        return;
      }

      if (workflow.staffId === currentStaffId) {
        logger.info("Skipping notification - user is the submitter");
        return;
      }

      if (!currentStaffId || !isAssignedAsApprover(workflow, currentStaffId, staffs)) {
        logger.info("Skipping notification - user is not assigned as approver");
        return;
      }

      try {
        const submitterName = getStaffName(staffs, workflow.staffId);
        const categoryLabel = getCategoryLabel(workflow);

        logger.info("Showing notification:", { submitterName, categoryLabel });

        notify({
          title: "新しい申請があります",
          description: `${submitterName} さんから${categoryLabel}が作成されました`,
          tone: "info",
          dedupeKey: `workflow-${workflow.id}`,
          autoHideMs: null,
        });

        logger.info("Workflow notification sent successfully:", {
          workflowId: workflow.id,
          category: workflow.category,
          submitter: workflow.staffId,
        });
      } catch (error) {
        logger.error("Failed to show workflow notification:", error);
      }
    },
    [currentStaffId, staffs, notify],
  );

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      logger.debug("Not authenticated, skipping subscription");
      return;
    }

    if (!currentStaffId) {
      logger.debug("No currentStaffId, skipping subscription");
      return;
    }

    logger.info("Starting workflow subscription for staff:", {
      currentStaffId,
      isAuthenticated,
    });

    const subscription = graphqlClient
      .graphql({
        query: onCreateWorkflow,
      })
      .subscribe({
        next: ({ data }) => {
          logger.info("Subscription received data:", {
            hasData: !!data,
            hasWorkflow: !!data?.onCreateWorkflow,
          });

          if (!data?.onCreateWorkflow) {
            logger.warn("No workflow data in subscription");
            return;
          }

          logger.info("Workflow created event received:", {
            id: data.onCreateWorkflow.id,
            category: data.onCreateWorkflow.category,
            staffId: data.onCreateWorkflow.staffId,
            assignedApproverStaffIds:
              data.onCreateWorkflow.assignedApproverStaffIds,
          });

          void handleWorkflowCreated(data.onCreateWorkflow);
        },
        error: (error) => {
          logger.error("Workflow subscription error:", error);
        },
      });

    return () => {
      logger.info("Unsubscribing from workflow subscription");
      subscription.unsubscribe();
    };
  }, [enabled, isAuthenticated, currentStaffId, handleWorkflowCreated]);

  return {
    isSubscribed: enabled && isAuthenticated && !!currentStaffId,
  };
};
