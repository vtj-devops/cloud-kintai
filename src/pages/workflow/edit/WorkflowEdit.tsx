import { AuthContext } from "@app/providers/auth/AuthContext";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { fetchWorkflowById } from "@entities/workflow/model/loader";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import {
  DynamicWorkflowFormProvider,
} from "@features/workflow/application-form/model/DynamicWorkflowFormContext";
import {
  buildDynamicUpdateWorkflowInput,
  validateDynamicWorkflowForm,
} from "@features/workflow/application-form/model/dynamicWorkflowFormModel";
import DynamicWorkflowTypeFields from "@features/workflow/application-form/ui/DynamicWorkflowTypeFields";
import { extractExistingWorkflowComments } from "@features/workflow/comment-thread/model/workflowCommentBuilder";
import { useWorkflowEditLoaderState } from "@features/workflow/hooks/useWorkflowEditLoaderState";
import { sendWorkflowSubmissionNotification } from "@features/workflow/notifications/sendWorkflowSubmissionNotification";
import { createLogger } from "@shared/lib/logger";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import {
  DashboardInnerSurface,
  PageContent,
  PageSection,
} from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { SectionTitle } from "@shared/ui/typography";
import { type ChangeEvent, type FormEvent, useContext, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";

import type { WorkflowEditLoaderData } from "@/router/loaders/workflowEditLoader";

import styles from "./WorkflowEdit.module.scss";

const logger = createLogger("WorkflowEdit");

export default function WorkflowEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workflow } = useLoaderData() as WorkflowEditLoaderData;

  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { update: updateWorkflow } = useWorkflows({ isAuthenticated });
  const { staffs } = useStaffs({ isAuthenticated });
  const { notify } = useAppNotification();
  const {
    category,
    applicationDate,
    fields,
    setFieldValue,
    draftMode,
    setDraftMode,
    applicant,
    existingComments,
    setExistingComments,
    isDirty,
  } = useWorkflowEditLoaderState(workflow, staffs);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { dialog, runWithoutGuard } = usePageLeaveGuard({
    isDirty,
    isBusy: isSaving,
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const state = { categoryLabel: category, fields };
    const validation = validateDynamicWorkflowForm(state);
    setFieldErrors(validation.fieldErrors);
    if (!validation.isValid) return;

    (async () => {
      try {
        setIsSaving(true);
        if (!id) throw new Error("IDが不明です");
        let normalizedComments = existingComments;
        if (!draftMode) {
          const latest = await fetchWorkflowById(id);
          normalizedComments = extractExistingWorkflowComments(latest);
          setExistingComments(normalizedComments);
        }

        const baseInput = buildDynamicUpdateWorkflowInput({
          workflowId: id,
          draftMode,
          state,
          existingComments: normalizedComments,
        });

        const updatedWorkflow = await updateWorkflow(baseInput);

        if (!draftMode) {
          try {
            const workflowApplicant =
              applicant ||
              staffs.find((s) => s.id === workflow.staffId) ||
              null;
            await sendWorkflowSubmissionNotification({
              staffs,
              applicant: workflowApplicant,
              workflow: updatedWorkflow,
            });
          } catch (mailError) {
            logger.error(
              "Failed to send workflow submission notification:",
              mailError,
            );
            notify({
              title: "メール送信エラー",
              description: "管理者への通知メールの送信に失敗しました。",
              tone: "error",
              dedupeKey: "workflow-mail-error",
            });
          }
        }

        notify({ title: "保存しました", tone: "success" });
        setTimeout(() => {
          runWithoutGuard(() => navigate(`/workflow/${id}`));
        }, 1000);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Workflow update failed:", message);
        notify({
          title: "エラー",
          description: message,
          tone: "error",
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDraftToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDraftMode(checked);
  };

  return (
    <Page
      title="編集"
      width="full"
      showDefaultHeader={false}
    >
      {dialog}
      <PageContent width="form">
        <PageSection
          component="form"
          layoutVariant="dashboard"
          onSubmit={handleSave}
          sx={{ gap: 0 }}
        >
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <SectionTitle className="m-0 text-2xl font-bold text-slate-900">
                申請を編集
              </SectionTitle>
              <p className="m-0 text-sm text-slate-500">
                申請詳細を起点に、申請内容を更新します。
              </p>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate(id ? `/workflow/${id}` : "/workflow")}
            >
              申請詳細へ戻る
            </button>
          </div>
          <DashboardInnerSurface>
            <div className={styles.formRows}>
              <div className={styles.formRow}>
                <div className={styles.formLabel}>ID</div>
                <div>
                  <p className={styles.formValue}>{id ?? "—"}</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formLabel}>種別</div>
                <div>
                  <p className={styles.formValue}>{category || "（未設定）"}</p>
                </div>
              </div>

            <div className={styles.formRow}>
              <div className={styles.formLabel}>申請者</div>
              <div>
                <p className={styles.formValue}>
                  {applicant
                    ? `${applicant.familyName} ${applicant.givenName}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formLabel}>申請日</div>
              <div>
                <p className={styles.formValue}>{applicationDate}</p>
              </div>
            </div>

            <DynamicWorkflowFormProvider
              value={{
                category,
                disabled: false,
                fields,
                setFieldValue,
                fieldErrors,
              }}
            >
              <DynamicWorkflowTypeFields />
            </DynamicWorkflowFormProvider>

            <div className={styles.formRow}>
              <div className={styles.formLabel}>下書き</div>
              <div>
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={draftMode}
                    onChange={handleDraftToggle}
                  />
                  <span className={styles.toggleTrack} />
                  {draftMode ? (
                    <span className={styles.toggleLabelText}>
                      下書きとして保存
                    </span>
                  ) : null}
                </label>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formActions}>
                <div className={styles.actionsGroup}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      navigate(id ? `/workflow/${id}` : "/workflow")
                    }
                  >
                    申請詳細へ戻る
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSaving}
                  >
                    {isSaving ? "処理中..." : "保存"}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </DashboardInnerSurface>
        </PageSection>
      </PageContent>
    </Page>
  );
}
