import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import { UpdateWorkflowInput, WorkflowStatus } from "@shared/api/graphql/types";
import Page from "@shared/ui/page/Page";
import { useCallback, useContext, useMemo } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AuthContext } from "@/context/AuthContext";
import { getWorkflowCategoryLabel } from "@/entities/workflow/lib/workflowLabels";
import type { WorkflowDetailLoaderData } from "@/entities/workflow/model/loader";
import { buildWorkflowApprovalTimeline } from "@/features/workflow/approval-flow/model/workflowApprovalTimeline";
import type { WorkflowApprovalStepView } from "@/features/workflow/approval-flow/types";
import useWorkflowCommentThread from "@/features/workflow/comment-thread/model/useWorkflowCommentThread";
import { buildWorkflowCommentsUpdateInput } from "@/features/workflow/comment-thread/model/workflowCommentBuilder";
import WorkflowCommentThread from "@/features/workflow/comment-thread/ui/WorkflowCommentThread";
import { deriveWorkflowDetailPermissions } from "@/features/workflow/detail-panel/model/workflowDetailPermissions";
import WorkflowDetailActions from "@/features/workflow/detail-panel/ui/WorkflowDetailActions";
import WorkflowMetadataPanel from "@/features/workflow/detail-panel/ui/WorkflowMetadataPanel";
import {
  useWorkflowLoaderWorkflow,
  type WorkflowEntity,
} from "@/features/workflow/hooks/useWorkflowLoaderWorkflow";
import { designTokenVar } from "@/shared/designSystem";
import { createLogger } from "@/shared/lib/logger";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";
import { formatDateSlash, isoDateFromTimestamp } from "@/shared/lib/time";
import { PageSection } from "@/shared/ui/layout";

const SECTION_GAP = designTokenVar("spacing.xl", "24px");
const PANEL_GAP = designTokenVar("spacing.lg", "16px");
const logger = createLogger("WorkflowDetailPage");

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });
  const { update: updateWorkflow } = useWorkflows({ isAuthenticated });
  const { workflow: initialWorkflow } =
    useLoaderData() as WorkflowDetailLoaderData;
  const { workflow, setWorkflow } = useWorkflowLoaderWorkflow(initialWorkflow);
  const dispatch = useAppDispatchV2();

  const staffName = (() => {
    if (!workflow?.staffId) return "—";
    const s = staffs.find((st) => st.id === workflow.staffId);
    return s ? `${s.familyName} ${s.givenName}` : workflow.staffId;
  })();

  const applicationDate = formatDateSlash(
    isoDateFromTimestamp(workflow?.createdAt),
  );

  const categoryLabel = getWorkflowCategoryLabel(workflow);

  const approvalSteps = useMemo<WorkflowApprovalStepView[]>(
    () =>
      buildWorkflowApprovalTimeline({
        workflow,
        staffs,
        applicantName: staffName,
        applicationDate,
      }),
    [workflow, staffs, staffName, applicationDate],
  );

  const notifySuccess = useCallback(
    (message: string) => dispatch(setSnackbarSuccess(message)),
    [dispatch],
  );
  const notifyError = useCallback(
    (message: string) => dispatch(setSnackbarError(message)),
    [dispatch],
  );
  const handleWorkflowChange = useCallback(
    (nextWorkflow: WorkflowEntity) => {
      setWorkflow(nextWorkflow);
    },
    [setWorkflow],
  );

  const {
    currentStaff,
    messages,
    expandedMessages,
    toggleExpanded,
    input,
    setInput,
    sending,
    formatSender,
    sendMessage,
  } = useWorkflowCommentThread({
    workflow,
    staffs,
    cognitoUser,
    updateWorkflow,
    onWorkflowChange: handleWorkflowChange,
    notifySuccess,
    notifyError,
  });

  const permissions = useMemo(
    () => deriveWorkflowDetailPermissions(workflow),
    [workflow],
  );

  const handleWithdraw = async () => {
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
      dispatch(setSnackbarSuccess("取り下げしました"));
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Workflow withdrawal failed:", message);
      dispatch(setSnackbarError(message));
    }
  };

  return (
    <Page
      title="申請内容"
      breadcrumbs={[
        { label: "TOP", href: "/" },
        { label: "ワークフロー", href: "/workflow" },
      ]}
      maxWidth="lg"
    >
      <PageSection
        variant="plain"
        layoutVariant="detail"
        sx={{ gap: SECTION_GAP }}
      >
        <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
          <WorkflowDetailActions
            onBack={() => navigate(-1)}
            onWithdraw={handleWithdraw}
            onEdit={() => navigate(`/workflow/${id}/edit`)}
            withdrawDisabled={permissions.withdrawDisabled}
            withdrawTooltip={permissions.withdrawTooltip}
            editDisabled={permissions.editDisabled}
            editTooltip={permissions.editTooltip}
          />

          {!workflow ? (
            <Typography color="error">
              ワークフローの読み込みに失敗しました。
            </Typography>
          ) : (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={7}>
                <Stack spacing={0} sx={{ gap: PANEL_GAP }}>
                  <WorkflowMetadataPanel
                    workflowId={workflow.id}
                    fallbackId={id}
                    category={workflow.category ?? null}
                    categoryLabel={categoryLabel}
                    staffName={staffName}
                    applicationDate={applicationDate}
                    status={workflow.status ?? null}
                    overTimeDetails={workflow.overTimeDetails ?? null}
                    customWorkflowTitle={workflow.customWorkflowTitle ?? null}
                    customWorkflowContent={
                      workflow.customWorkflowContent ?? null
                    }
                    approvalSteps={approvalSteps}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} sm={5}>
                <WorkflowCommentThread
                  messages={messages}
                  staffs={staffs}
                  currentStaff={currentStaff}
                  expandedMessages={expandedMessages}
                  onToggle={toggleExpanded}
                  input={input}
                  setInput={setInput}
                  onSend={sendMessage}
                  sending={sending}
                  formatSender={formatSender}
                />
              </Grid>
            </Grid>
          )}
        </Paper>
      </PageSection>
    </Page>
  );
}
