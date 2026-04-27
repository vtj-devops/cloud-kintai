import { AuthContext } from "@app/providers/auth/AuthContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  CATEGORY_LABELS,
  getEnabledWorkflowCategories,
} from "@entities/workflow/lib/workflowLabels";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import {
  DynamicWorkflowFormProvider,
} from "@features/workflow/application-form/model/DynamicWorkflowFormContext";
import {
  buildDynamicCreateWorkflowInput,
  validateDynamicWorkflowForm,
} from "@features/workflow/application-form/model/dynamicWorkflowFormModel";
import { useDynamicWorkflowForm } from "@features/workflow/application-form/model/useDynamicWorkflowForm";
import DynamicWorkflowTypeFields from "@features/workflow/application-form/ui/DynamicWorkflowTypeFields";
import { sendWorkflowSubmissionNotification } from "@features/workflow/notifications/sendWorkflowSubmissionNotification";
import {
  ApprovalStatus,
  ApprovalStepInput,
  ApproverMultipleMode,
  ApproverSettingMode,
  WorkflowCategory,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { parseTimeToISO } from "@shared/lib/time";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import {
  DashboardInnerSurface,
  PageContent,
  PageSection,
} from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { SectionTitle } from "@shared/ui/typography";
import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./NewWorkflow.module.scss";

// ワークフロー種別ラベル定数（YAML 由来の値と合わせる）
const CLOCK_CORRECTION_LABEL = "打刻修正(出勤忘れ)";
const CLOCK_CORRECTION_CHECK_OUT_LABEL = "打刻修正(退勤忘れ)";

const logger = createLogger("NewWorkflow");

const getTodayAsSlash = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
};

const generateApprovalSteps = (
  staff: StaffType,
  staffs: StaffType[],
): {
  approvalSteps: ApprovalStepInput[];
  assignedApproverStaffIds: string[];
} => {
  const approvalSteps: ApprovalStepInput[] = [];
  const assignedApproverStaffIds: string[] = [];

  if (staff?.approverSetting === ApproverSettingMode.SINGLE) {
    const target = staff.approverSingle;
    if (target) {
      const mapped = staffs.find(
        (s) => s.cognitoUserId === target || s.id === target,
      );
      const approverId = mapped ? mapped.id : target;
      approvalSteps.push({
        id: `s-0-${Date.now()}`,
        approverStaffId: approverId,
        decisionStatus: ApprovalStatus.PENDING,
        approverComment: null,
        decisionTimestamp: null,
        stepOrder: 0,
      });
      assignedApproverStaffIds.push(approverId);
    }
  } else if (staff?.approverSetting === ApproverSettingMode.MULTIPLE) {
    const multiple = staff.approverMultiple || [];
    multiple.forEach((aid, idx) => {
      if (!aid) return;
      const mapped = staffs.find(
        (s) => s.cognitoUserId === aid || s.id === aid,
      );
      const approverId = mapped ? mapped.id : aid;
      approvalSteps.push({
        id: `s-${idx}-${Date.now()}`,
        approverStaffId: approverId,
        decisionStatus: ApprovalStatus.PENDING,
        approverComment: null,
        decisionTimestamp: null,
        stepOrder: idx,
      });
      assignedApproverStaffIds.push(approverId);
    });
  } else if (staff?.approverSetting === ApproverSettingMode.ADMINS) {
    approvalSteps.push({
      id: `s-admin-${Date.now()}`,
      approverStaffId: "ADMINS",
      decisionStatus: ApprovalStatus.PENDING,
      approverComment: null,
      decisionTimestamp: null,
      stepOrder: 0,
    });
    assignedApproverStaffIds.push("ADMINS");
  }

  return { approvalSteps, assignedApproverStaffIds };
};

const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    if ("data" in err && typeof err.data === "object" && err.data !== null) {
      const data = err.data as Record<string, unknown>;
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
      if (
        "errors" in data &&
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        const firstError = data.errors[0];
        if (
          typeof firstError === "object" &&
          firstError !== null &&
          "message" in firstError
        ) {
          return String(firstError.message);
        }
      }
    }
    if ("message" in err && typeof err.message === "string") return err.message;
    if ("error" in err && typeof err.error === "string") return err.error;
  }
  return "ワークフローの作成に失敗しました。";
};

const buildCategoryOptions = (
  options: ReturnType<typeof getEnabledWorkflowCategories>,
) =>
  options.flatMap((item) => {
    if (item.category === WorkflowCategory.CLOCK_CORRECTION) {
      return [
        <option key={`${item.category}-clock-in`} value={CLOCK_CORRECTION_LABEL}>
          {CLOCK_CORRECTION_LABEL}
        </option>,
        <option key={`${item.category}-clock-out`} value={CLOCK_CORRECTION_CHECK_OUT_LABEL}>
          {CLOCK_CORRECTION_CHECK_OUT_LABEL}
        </option>,
      ];
    }
    const label = CATEGORY_LABELS[item.category] ?? item.label;
    return [
      <option key={item.category} value={label}>
        {label}
      </option>,
    ];
  });

const FormRow = ({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => (
  <div className={styles.formRow}>
    {label && <div className={styles.formLabel}>{label}</div>}
    {children}
  </div>
);

export default function NewWorkflow() {
  const navigate = useNavigate();
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";

  const { staffs } = useStaffs({ isAuthenticated });
  const { create: createWorkflow } = useWorkflows({ isAuthenticated });
  const { notify } = useAppNotification();
  const { config, getStartTime, getEndTime, getAbsentEnabled } = useAppConfig();

  const [draftMode, setDraftMode] = useState(false);
  const [category, setCategory] = useState("");
  const applicationDate = getTodayAsSlash();

  const { fields, setFieldValue, resetFields, isDirty: isFieldsDirty } =
    useDynamicWorkflowForm();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = draftMode || category !== "" || isFieldsDirty;

  const { dialog, runWithoutGuard } = usePageLeaveGuard({
    isDirty,
    isBusy: isSaving,
  });

  const enabledCategoryOptions = useMemo(
    () =>
      getEnabledWorkflowCategories(config).filter((item) => {
        if (item.category === WorkflowCategory.ABSENCE && !getAbsentEnabled()) {
          return false;
        }
        return true;
      }),
    [config, getAbsentEnabled],
  );

  const staff = useMemo(() => {
    if (!cognitoUser?.id) return undefined;
    return staffs.find((s) => s.cognitoUserId === cognitoUser.id) || null;
  }, [staffs, cognitoUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const state = { categoryLabel: category, fields };
    const validation = validateDynamicWorkflowForm(state);
    setFieldErrors(validation.fieldErrors);
    if (!validation.isValid) return;

    if (!staff?.id) {
      notify({
        title: "エラー",
        description: "申請者情報が取得できませんでした。",
        tone: "error",
        dedupeKey: "workflow-applicant-error",
      });
      return;
    }

    const input = buildDynamicCreateWorkflowInput({
      staffId: staff.id,
      draftMode,
      state,
    });

    const { approvalSteps, assignedApproverStaffIds } = generateApprovalSteps(
      staff,
      staffs,
    );
    if (approvalSteps.length > 0) {
      input.approvalSteps = approvalSteps;
      input.assignedApproverStaffIds = assignedApproverStaffIds;
      input.nextApprovalStepIndex = 0;
    }

    if (staff?.approverSetting) {
      input.submitterApproverSetting =
        staff.approverSetting as ApproverSettingMode;
      if (staff.approverSingle)
        input.submitterApproverId = staff.approverSingle;
      if (staff.approverMultiple && staff.approverMultiple.length > 0) {
        input.submitterApproverIds = staff.approverMultiple;
        if (staff.approverMultipleMode)
          input.submitterApproverMultipleMode =
            staff.approverMultipleMode as ApproverMultipleMode;
      }
    }

    try {
      setIsSaving(true);
      const createdWorkflow = await createWorkflow(input);

      if (!draftMode) {
        try {
          await sendWorkflowSubmissionNotification({
            staffs,
            applicant: staff,
            workflow: createdWorkflow,
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

      notify({
        title: "ワークフローを作成しました。",
        tone: "success",
      });
      runWithoutGuard(() => navigate("/workflow", { replace: true }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Workflow creation failed:", message);
      notify({
        title: "エラー",
        description: extractErrorMessage(err),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setCategory(v);
    setFieldErrors({});

    const today = new Date().toISOString().slice(0, 10);

    // 種別切り替え時にフィールドをリセットしてデフォルト値を設定
    if (v === "有給休暇申請") {
      resetFields({
        dateRange: { start: today, end: today },
        reason: "私用のため",
      });
    } else if (v === CLOCK_CORRECTION_LABEL) {
      const isoTime = parseTimeToISO(getStartTime().format("HH:mm"), today);
      resetFields({ date: today, checkInTime: isoTime });
    } else if (v === CLOCK_CORRECTION_CHECK_OUT_LABEL) {
      const defaultEndTime = getEndTime();
      resetFields({
        date: today,
        checkOutTime: defaultEndTime
          ? parseTimeToISO(defaultEndTime.format("HH:mm"), today)
          : null,
      });
    } else if (v === "残業申請") {
      resetFields({
        date: today,
        timeRange: { start: null, end: null },
        reason: "",
      });
    } else if (v === "欠勤申請") {
      resetFields({ date: today, reason: "" });
    } else if (v === "振替休暇申請") {
      resetFields({ targetDate: today, compensatoryDate: today, reason: "" });
    } else {
      resetFields();
    }
  };

  const handleDraftToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftMode(e.target.checked);
  };

  return (
    <Page title="新規作成" width="full" showDefaultHeader={false}>
      {dialog}
      <PageContent width="form">
        <PageSection
          component="form"
          layoutVariant="dashboard"
          onSubmit={handleSubmit}
          sx={{ gap: 0 }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate("/workflow")}
            >
              申請一覧へ戻る
            </button>
          </div>

          <div className={styles.pageHeader}>
            <div>
              <SectionTitle className={styles.pageTitle}>新規作成</SectionTitle>
              <p className={styles.pageSubtitle}>
                申請一覧を起点に、申請内容を作成します。
              </p>
            </div>
          </div>

          <DashboardInnerSurface>
            <div className={styles.formRows}>
              <FormRow label="種別">
                <div>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.select}
                      value={category}
                      onChange={handleCategoryChange}
                    >
                      <option value="">種別を選択</option>
                      {buildCategoryOptions(enabledCategoryOptions)}
                    </select>
                    <span className={styles.selectIcon} aria-hidden="true">
                      ▼
                    </span>
                  </div>
                </div>
              </FormRow>

              <FormRow label="申請者">
                <p className={styles.formValue}>
                  {staff ? `${staff.familyName} ${staff.givenName}` : "—"}
                </p>
              </FormRow>

              <FormRow label="申請日">
                <div>
                  <input
                    className={styles.readonlyInput}
                    value={applicationDate}
                    readOnly
                  />
                </div>
              </FormRow>

              <DynamicWorkflowFormProvider
                value={{
                  category,
                  disabled: category === "",
                  fields,
                  setFieldValue,
                  fieldErrors,
                }}
              >
                <DynamicWorkflowTypeFields />
              </DynamicWorkflowFormProvider>

              <FormRow label="下書き">
                <div>
                  <label className={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={draftMode}
                      onChange={handleDraftToggle}
                    />
                    <span className={styles.toggleTrack} />
                    {draftMode && (
                      <span className={styles.toggleLabelText}>
                        下書きとして保存
                      </span>
                    )}
                  </label>
                </div>
              </FormRow>

              <FormRow>
                <div className={styles.formActions}>
                  <div className={styles.actionsGroup}>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={category === "" || isSaving}
                    >
                      {isSaving ? "処理中..." : "作成"}
                    </button>
                  </div>
                </div>
              </FormRow>
            </div>
          </DashboardInnerSurface>
        </PageSection>
      </PageContent>
    </Page>
  );
}
