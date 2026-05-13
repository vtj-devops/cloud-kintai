import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  useCreateAttendanceMutation,
  useLazyGetAttendanceByStaffAndDateQuery,
  useUpdateAttendanceMutation,
} from "@entities/attendance/api/attendanceApi";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { getWorkflowCategoryLabel } from "@entities/workflow/lib/workflowLabels";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import WorkflowStatusChip from "@entities/workflow/ui/WorkflowStatusChip";
import {
  GetWorkflowQuery,
  Workflow as WorkflowType,
  WorkflowStatus,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { SectionTitle } from "@shared/ui/typography";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { useWorkflowApprovalActions } from "../hooks/useWorkflowApprovalActions";
import { useWorkflowDetailData } from "../hooks/useWorkflowDetailData";

interface WorkflowCarouselDialogProps {
  open: boolean;
  onClose: () => void;
  selectedWorkflowId: string;
  filteredWorkflowIds: string[];
  workflowsById: Map<string, WorkflowType>;
  staffNamesById: Map<string, string>;
  onOpenInRightPanel: (workflowId: string) => void;
  enableApprovalActions?: boolean;
}

function ChevronLeftIcon() {
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

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7.5 4.5 13 10l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5l10 10M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OpenInPanelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 5h8v8m0-8-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 11v4H5V7h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type WorkflowCarouselActionButtonsProps = {
  onApproveAndNext: () => void;
  onRejectAndNext: () => void;
  isApproveDisabled: boolean;
  isRejectDisabled: boolean;
};

function WorkflowCarouselActionButtons({
  onApproveAndNext,
  onRejectAndNext,
  isApproveDisabled,
  isRejectDisabled,
}: WorkflowCarouselActionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <AppButton
        className="min-w-0"
        onClick={() => {
          void onApproveAndNext();
        }}
        disabled={isApproveDisabled}
      >
        承認して次へ
      </AppButton>
      <AppButton
        tone="danger"
        className="min-w-0"
        onClick={() => {
          void onRejectAndNext();
        }}
        disabled={isRejectDisabled}
      >
        却下して次へ
      </AppButton>
    </div>
  );
}

const FOCUSABLE_SELECTOR =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export default function WorkflowCarouselDialog({
  open,
  onClose,
  selectedWorkflowId,
  filteredWorkflowIds,
  workflowsById,
  staffNamesById,
  onOpenInRightPanel,
  enableApprovalActions = false,
}: WorkflowCarouselDialogProps) {
  const initialIndex = useMemo(
    () =>
      Math.max(
        filteredWorkflowIds.findIndex(
          (workflowId) => workflowId === selectedWorkflowId,
        ),
        0,
      ),
    [filteredWorkflowIds, selectedWorkflowId],
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isCompleted, setIsCompleted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<Element | null>(null);
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });
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
  const dispatch = useAppDispatchV2();

  const currentWorkflowId = filteredWorkflowIds[currentIndex] ?? null;
  const { workflow: workflowDetail, setWorkflow } = useWorkflowDetailData(
    currentWorkflowId ?? "",
  );
  const currentWorkflow = currentWorkflowId
    ? workflowsById.get(currentWorkflowId)
    : undefined;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < filteredWorkflowIds.length - 1;
  const { handleApprove, handleReject } = useWorkflowApprovalActions({
    workflow: workflowDetail,
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
          message,
        }),
      ),
    notifyError: (message) =>
      dispatch(
        pushNotification({
          tone: "error",
          message,
        }),
      ),
    notifyInfo: (title, description) =>
      dispatch(
        pushNotification({
          tone: "info",
          message: title,
          description,
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
  const isApproveDisabled =
    !workflowDetail?.id ||
    workflowDetail.status === WorkflowStatus.APPROVED ||
    workflowDetail.status === WorkflowStatus.CANCELLED;
  const isRejectDisabled =
    !workflowDetail?.id ||
    workflowDetail.status === WorkflowStatus.REJECTED ||
    workflowDetail.status === WorkflowStatus.CANCELLED;

  const handlePrev = () => {
    if (!canGoPrev) return;
    setCurrentIndex((previous) => previous - 1);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setCurrentIndex((previous) => previous + 1);
  };

  const moveToNextStep = () => {
    if (!canGoNext) {
      setIsCompleted(true);
      return;
    }
    handleNext();
  };

  const handleApproveAndNext = async () => {
    if (!enableApprovalActions || isApproveDisabled || isCompleted) return;
    const succeeded = await handleApprove();
    if (!succeeded) return;
    moveToNextStep();
  };

  const handleRejectAndNext = async () => {
    if (!enableApprovalActions || isRejectDisabled || isCompleted) return;
    const succeeded = await handleReject();
    if (!succeeded) return;
    moveToNextStep();
  };

  useEffect(() => {
    if (!open) return;

    previousActiveElementRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousActiveElementRef.current instanceof HTMLElement) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        if (!dialogRef.current) {
          return;
        }

        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => !element.hasAttribute("disabled"));

        if (focusable.length === 0) {
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement as HTMLElement | null;

        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (isCompleted) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
        return;
      }

      if (event.key === "Enter" && currentWorkflowId) {
        event.preventDefault();
        onOpenInRightPanel(currentWorkflowId);
        return;
      }

      if (!enableApprovalActions) {
        return;
      }

      const lowerKey = event.key.toLowerCase();
      if (lowerKey === "y") {
        event.preventDefault();
        void handleApproveAndNext();
        return;
      }

      if (lowerKey === "n") {
        event.preventDefault();
        void handleRejectAndNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canGoNext,
    canGoPrev,
    currentWorkflowId,
    handleNext,
    handlePrev,
    handleApproveAndNext,
    handleRejectAndNext,
    enableApprovalActions,
    isCompleted,
    onClose,
    onOpenInRightPanel,
    open,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/50 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="ワークフローをまとめて確認"
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <SectionTitle className="m-0 text-base font-semibold text-slate-900 sm:text-lg">
            ワークフローをまとめて確認
          </SectionTitle>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto px-4 py-4 sm:px-5">
          {isCompleted ? (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6">
                <p className="m-0 text-xs font-semibold tracking-[0.12em] text-emerald-700">
                  CONFIRMATION COMPLETE
                </p>
                <p className="m-0 mt-2 text-lg font-semibold text-slate-900">
                  確認が完了しました
                </p>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-600">
                  対象の申請を最後まで処理しました。必要に応じて一覧へ戻って次の確認を開始してください。
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-3">
                <AppButton
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  onClick={onClose}
                  className="min-w-0"
                >
                  閉じる
                </AppButton>
              </div>
            </div>
          ) : currentWorkflow ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700">
                  {currentIndex + 1} / {filteredWorkflowIds.length}
                </span>

                <AppButton
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  onClick={() =>
                    currentWorkflowId && onOpenInRightPanel(currentWorkflowId)
                  }
                  disabled={!currentWorkflowId}
                  startIcon={<OpenInPanelIcon />}
                  className="min-w-0"
                >
                  右側で開く
                </AppButton>
              </div>

              {enableApprovalActions && currentWorkflowId && (
                <WorkflowCarouselActionButtons
                  onApproveAndNext={handleApproveAndNext}
                  onRejectAndNext={handleRejectAndNext}
                  isApproveDisabled={isApproveDisabled}
                  isRejectDisabled={isRejectDisabled}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="m-0 text-xs text-slate-500">申請種別</p>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-900">
                    {getWorkflowCategoryLabel(currentWorkflow)}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs text-slate-500">申請者</p>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-900">
                    {staffNamesById.get(currentWorkflow.staffId || "") ||
                      "不明"}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs text-slate-500">申請日</p>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-900">
                    {currentWorkflow.createdAt
                      ? currentWorkflow.createdAt.split("T")[0]
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs text-slate-500">ステータス</p>
                  <div className="mt-1">
                    <WorkflowStatusChip status={currentWorkflow.status} />
                  </div>
                </div>

                <div>
                  <p className="m-0 text-xs text-slate-500">承認ステップ</p>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-900">
                    {(currentWorkflow.approvalSteps?.length ?? 0) > 0
                      ? `${currentWorkflow.approvalSteps?.length} 件`
                      : "未設定"}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs text-slate-500">コメント</p>
                  <p className="m-0 mt-1 text-sm font-medium text-slate-900">
                    {(currentWorkflow.comments?.length ?? 0) > 0
                      ? `${currentWorkflow.comments?.length} 件`
                      : "コメントなし"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <AppButton
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  startIcon={<ChevronLeftIcon />}
                  className="min-w-0"
                >
                  前へ
                </AppButton>
                <AppButton
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  endIcon={<ChevronRightIcon />}
                  className="min-w-0"
                >
                  次へ
                </AppButton>
              </div>
            </div>
          ) : (
            <p className="m-0 py-6 text-sm text-slate-500">
              表示できるワークフローがありません。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
