import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  useCreateAttendanceMutation,
  useLazyGetAttendanceByStaffAndDateQuery,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  getWorkflowCategoryLabel,
  STATUS_LABELS,
} from "@entities/workflow/lib/workflowLabels";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import { WorkflowMetadataPanelBase } from "@features/workflow/detail-panel/ui/WorkflowMetadataPanel";
import { GetWorkflowQuery, WorkflowStatus } from "@shared/api/graphql/types";
import { designTokenVar } from "@shared/designSystem";
import { createLogger } from "@shared/lib/logger";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { SectionTitle, SubsectionTitle } from "@shared/ui/typography";
import { useCallback, useContext, useMemo } from "react";

import { useWorkflowApprovalActions } from "../hooks/useWorkflowApprovalActions";
import { useWorkflowDetailData } from "../hooks/useWorkflowDetailData";
import { useWorkflowDetailViewModel } from "../hooks/useWorkflowDetailViewModel";
import WorkflowCommentSection from "./WorkflowCommentSection";

const PANEL_BACKGROUND = designTokenVar("color.surface.primary", "#FFFFFF");
const PANEL_BORDER = designTokenVar("color.border.subtle", "#D7E0DB");
const PANEL_RADIUS = designTokenVar("radius.lg", "12px");
const HERO_BACKGROUND = designTokenVar(
  "component.adminWorkflow.detail.hero.background",
  "linear-gradient(135deg, rgba(15, 168, 94, 0.10), rgba(11, 109, 83, 0.04))",
);
const HERO_BORDER = designTokenVar(
  "component.adminWorkflow.detail.hero.border",
  "rgba(15, 168, 94, 0.18)",
);
const HERO_LABEL = designTokenVar("color.text.muted", "#5E7268");
const HERO_TITLE = designTokenVar("color.text.primary", "#1E2A25");
const SECTION_TITLE = designTokenVar("color.text.primary", "#1E2A25");
const LOADING_TEXT = designTokenVar("color.text.muted", "#5E7268");
const ERROR_TEXT = designTokenVar("color.feedback.danger.base", "#D7443E");
const logger = createLogger("WorkflowDetailPanel");
interface WorkflowDetailPanelProps {
  workflowId?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}
function BackArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function WorkflowDetailPanel({
  workflowId,
  onBack,
  showBackButton = false,
}: WorkflowDetailPanelProps) {
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });
  const { notify } = useAppNotification();
  const {
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useContext(AppConfigContext);
  const { update: updateWorkflow } = useWorkflows({ isAuthenticated });
  const [createAttendance] = useCreateAttendanceMutation();
  const [getAttendanceByStaffAndDate] =
    useLazyGetAttendanceByStaffAndDateQuery();
  const [updateAttendance] = useUpdateAttendanceMutation();
  const currentStaffId = useMemo(() => {
    if (!cognitoUser?.id) return null;
    return (
      staffs.find((staff) => staff.cognitoUserId === cognitoUser.id)?.id ?? null
    );
  }, [cognitoUser, staffs]);
  const handleNewCommentNotification = useCallback(() => {
    notify({
      title: "新着コメントがあります",
      description: "ワークフローに新しいコメントが投稿されました",
      tone: "info",
      dedupeKey: `workflow-comment-${workflowId ?? "unknown"}`,
    });
  }, [notify, workflowId]);
  const { workflow, setWorkflow, loading, error } = useWorkflowDetailData(
    workflowId,
    {
      currentStaffId,
      onNewComment: handleNewCommentNotification,
    },
  );
  const dispatch = useAppDispatchV2();
  const { staffName, applicationDate, approvalSteps } =
    useWorkflowDetailViewModel({
      workflow,
      staffs,
    });
  const categoryLabel = getWorkflowCategoryLabel(workflow);
  const statusLabel = workflow?.status
    ? (STATUS_LABELS[workflow.status] ?? workflow.status)
    : "—";
  const isApproveDisabled =
    !workflow?.id ||
    workflow.status === WorkflowStatus.APPROVED ||
    workflow.status === WorkflowStatus.CANCELLED;
  const isRejectDisabled =
    !workflow?.id ||
    workflow.status === WorkflowStatus.REJECTED ||
    workflow.status === WorkflowStatus.CANCELLED;
  const { handleApprove, handleReject } = useWorkflowApprovalActions({
    workflow,
    cognitoUser,
    staffs,
    updateWorkflow: (input) =>
      updateWorkflow(input) as Promise<
        NonNullable<GetWorkflowQuery["getWorkflow"]>
      >,
    setWorkflow,
    notifySuccess: (message) =>
      dispatch(
        pushNotification({
          tone: "success",
          message: message,
        }),
      ),
    notifyError: (message) =>
      dispatch(
        pushNotification({
          tone: "error",
          message: message,
        }),
      ),
    notifyInfo: (title, description) =>
      dispatch(
        pushNotification({
          tone: "info",
          message: title,
          description: description,
          autoHideMs: null,
        }),
      ),
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
    getAttendanceByStaffAndDate,
    createAttendance,
    updateAttendance,
  });
  return (
    <section
      className="w-full p-4 sm:p-6"
      style={{
        borderRadius: PANEL_RADIUS,
        border: `1px solid ${PANEL_BORDER}`,
        backgroundColor: PANEL_BACKGROUND,
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        className="mb-6 flex flex-col gap-4 rounded-2xl p-4 sm:p-5"
        style={{
          border: `1px solid ${HERO_BORDER}`,
          background: HERO_BACKGROUND,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle
                className="m-0 text-2xl font-extrabold leading-tight"
                style={{ color: HERO_TITLE }}
              >
                申請内容の確認
              </SectionTitle>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {showBackButton && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition hover:bg-white/80"
                style={{
                  borderColor: HERO_BORDER,
                  color: HERO_TITLE,
                  backgroundColor: "rgba(255,255,255,0.72)",
                }}
              >
                <BackArrowIcon />
                ワークフロー一覧へ戻る
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproveDisabled}
              className="inline-flex h-10 min-w-24 items-center justify-center rounded-md border border-emerald-700/65 bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600"
            >
              承認
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={isRejectDisabled}
              className="inline-flex h-10 min-w-24 items-center justify-center rounded-md border border-rose-700/60 bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600"
            >
              却下
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.72)" }}
          >
            <p className="m-0 text-xs" style={{ color: HERO_LABEL }}>
              現在ステータス
            </p>
            <p
              className="m-0 mt-1 text-sm font-bold"
              style={{ color: HERO_TITLE }}
            >
              {statusLabel}
            </p>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.72)" }}
          >
            <p className="m-0 text-xs" style={{ color: HERO_LABEL }}>
              承認ステップ
            </p>
            <p
              className="m-0 mt-1 text-sm font-bold"
              style={{ color: HERO_TITLE }}
            >
              {approvalSteps.length} 件
            </p>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.72)" }}
          >
            <p className="m-0 text-xs" style={{ color: HERO_LABEL }}>
              コメント件数
            </p>
            <p
              className="m-0 mt-1 text-sm font-bold"
              style={{ color: HERO_TITLE }}
            >
              {workflow?.comments?.filter(Boolean).length ?? 0} 件
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <p className="m-0 text-sm" style={{ color: LOADING_TEXT }}>
          読み込み中...
        </p>
      )}

      {error && (
        <p className="m-0 text-sm" style={{ color: ERROR_TEXT }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-7">
            <SubsectionTitle
              className="mb-2 text-base font-bold"
              style={{ color: SECTION_TITLE }}
            >
              申請情報
            </SubsectionTitle>
            <WorkflowMetadataPanelBase
              workflowId={workflow?.id ?? undefined}
              fallbackId={workflowId}
              category={workflow?.category ?? null}
              categoryLabel={categoryLabel}
              staffName={staffName}
              applicationDate={applicationDate}
              status={workflow?.status ?? null}
              overTimeDetails={workflow?.overTimeDetails ?? null}
              customWorkflowTitle={workflow?.customWorkflowTitle ?? null}
              customWorkflowContent={workflow?.customWorkflowContent ?? null}
              approvalSteps={approvalSteps}
            />
          </div>

          <div className="min-w-0 xl:col-span-5">
            <SubsectionTitle
              className="mb-2 text-base font-bold"
              style={{ color: SECTION_TITLE }}
            >
              コメントと対応履歴
            </SubsectionTitle>
            <WorkflowCommentSection
              workflow={workflow}
              staffs={staffs}
              cognitoUser={cognitoUser}
              onWorkflowUpdated={setWorkflow}
              onSuccess={(message) =>
                dispatch(
                  pushNotification({
                    tone: "success",
                    message: message,
                  }),
                )
              }
              onError={(message) => {
                logger.error("Failed to send comment:", message);
                dispatch(
                  pushNotification({
                    tone: "error",
                    message: message,
                  }),
                );
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
