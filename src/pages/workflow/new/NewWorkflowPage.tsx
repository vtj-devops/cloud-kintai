import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import useWorkflowTemplates from "@entities/workflow-template/model/useWorkflowTemplates";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ApprovalStatus,
  ApprovalStepInput,
  ApproverMultipleMode,
  ApproverSettingMode,
  WorkflowCategory,
} from "@shared/api/graphql/types";
import Page from "@shared/ui/page/Page";
import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AuthContext } from "@/context/AuthContext";
import {
  CATEGORY_LABELS,
  getEnabledWorkflowCategories,
} from "@/entities/workflow/lib/workflowLabels";
import {
  buildCreateWorkflowInput,
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  CLOCK_CORRECTION_LABEL,
  validateWorkflowForm,
  type WorkflowFormState,
} from "@/features/workflow/application-form/model/workflowFormModel";
import WorkflowTypeFields from "@/features/workflow/application-form/ui/WorkflowTypeFields";
import { designTokenVar } from "@/shared/designSystem";
import { createLogger } from "@/shared/lib/logger";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";
import { parseTimeToISO } from "@/shared/lib/time";
import { dashboardInnerSurfaceSx, PageSection } from "@/shared/ui/layout";

const logger = createLogger("NewWorkflowPage");

/**
 * 今日の日付をスラッシュ区切り形式（YYYY/MM/DD）で取得
 */
const getTodayAsSlash = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
};

/**
 * スタッフの承認者設定に基づいて承認ステップを生成
 */
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

export default function NewWorkflowPage() {
  const WORKFLOW_TEMPLATE_ORGANIZATION_ID = "default";
  const ACTIONS_GAP = designTokenVar("spacing.sm", "8px");
  const navigate = useNavigate();
  const [draftMode, setDraftMode] = useState(false);
  const [category, setCategory] = useState("");
  const [applicationDate, setApplicationDate] = useState(() =>
    getTodayAsSlash(),
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceDateError, setAbsenceDateError] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [paidReason, setPaidReason] = useState("");
  const [overtimeStart, setOvertimeStart] = useState<string | null>(null);
  const [overtimeEnd, setOvertimeEnd] = useState<string | null>(null);
  const [overtimeError, setOvertimeError] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeDateError, setOvertimeDateError] = useState("");
  const [overtimeReason, setOvertimeReason] = useState("");
  const [customWorkflowTitle, setCustomWorkflowTitle] = useState("");
  const [customWorkflowContent, setCustomWorkflowContent] = useState("");
  const [customWorkflowTitleError, setCustomWorkflowTitleError] = useState("");
  const [customWorkflowContentError, setCustomWorkflowContentError] =
    useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });
  const { create: createWorkflow } = useWorkflows({ isAuthenticated });
  const { templates } = useWorkflowTemplates({
    isAuthenticated,
    organizationId: WORKFLOW_TEMPLATE_ORGANIZATION_ID,
  });
  const dispatch = useAppDispatchV2();
  const { config, getStartTime, getEndTime, getAbsentEnabled } = useAppConfig();

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

  // Derived state: find matching staff from staffs
  const staff = useMemo(() => {
    if (!cognitoUser?.id) return undefined;
    return staffs.find((s) => s.cognitoUserId === cognitoUser.id) || null;
  }, [staffs, cognitoUser]);

  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }

    if (typeof err === "string") {
      return err;
    }

    if (typeof err === "object" && err !== null) {
      // RTK Query error format
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
      if ("message" in err && typeof err.message === "string") {
        return err.message;
      }
      if ("error" in err && typeof err.error === "string") {
        return err.error;
      }
    }

    return "ワークフローの作成に失敗しました。";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formState: WorkflowFormState = {
      categoryLabel: category,
      startDate,
      endDate,
      absenceDate,
      paidReason,
      absenceReason,
      overtimeDate,
      overtimeStart,
      overtimeEnd,
      overtimeReason,
      customWorkflowTitle,
      customWorkflowContent,
    };

    const validation = validateWorkflowForm(formState);
    setDateError(validation.errors.dateError ?? "");
    setAbsenceDateError(validation.errors.absenceDateError ?? "");
    setOvertimeDateError(validation.errors.overtimeDateError ?? "");
    setOvertimeError(validation.errors.overtimeError ?? "");
    setCustomWorkflowTitleError(
      validation.errors.customWorkflowTitleError ?? "",
    );
    setCustomWorkflowContentError(
      validation.errors.customWorkflowContentError ?? "",
    );
    if (!validation.isValid) return;
    // 申請者（staff）が取れていない場合はエラー
    if (!staff?.id) {
      dispatch(setSnackbarError("申請者情報が取得できませんでした。"));
      return;
    }

    // 送信時の申請日は今日に固定する
    const todaySlash = getTodayAsSlash();
    setApplicationDate(todaySlash);

    const input = buildCreateWorkflowInput({
      staffId: staff.id,
      draftMode,
      state: formState,
      overtimeDateFallbackFactory: () => new Date().toISOString().slice(0, 10),
    });

    // --- 申請時に承認ステップをスナップショットとして保存する ---
    // staff の approverSetting を参照して approvalSteps / assignedApproverStaffIds を生成
    const { approvalSteps, assignedApproverStaffIds } = generateApprovalSteps(
      staff,
      staffs,
    );

    if (approvalSteps.length > 0) {
      input.approvalSteps = approvalSteps;
      input.assignedApproverStaffIds = assignedApproverStaffIds;
      input.nextApprovalStepIndex = 0;
    }

    // 保存用に submitter 側のスナップショット情報も入れておく
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
      await createWorkflow(input);
      dispatch(setSnackbarSuccess("ワークフローを作成しました。"));
      navigate("/workflow", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Workflow creation failed:", message);
      const errorMessage = extractErrorMessage(err);
      dispatch(setSnackbarError(errorMessage));
    }
  };

  const handleDraftToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDraftMode(checked);
  };

  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value as string;
    setCategory(v);
    // 種別選択時の初期化処理等はここに記述（タイトル入力は廃止されたため削除済）
    // 有給のときは開始/終了を今日で初期化
    const today = new Date().toISOString().slice(0, 10);
    if (v === "有給休暇申請") {
      setStartDate(today);
      setEndDate(today);
      // 申請理由のデフォルト
      if (!paidReason) setPaidReason("私用のため");
    } else if (v === CLOCK_CORRECTION_LABEL) {
      // 打刻修正の場合は対象日を今日に、出勤時間を既定の勤務開始時刻に初期化
      setOvertimeDate(today);
      const defaultStartTime = getStartTime();
      const isoTime = parseTimeToISO(defaultStartTime.format("HH:mm"), today);
      setOvertimeStart(isoTime);
      setOvertimeEnd(null);
    } else if (v === CLOCK_CORRECTION_CHECK_OUT_LABEL) {
      setOvertimeDate(today);
      const defaultEndTime = getEndTime();
      if (defaultEndTime) {
        const isoTime = parseTimeToISO(defaultEndTime.format("HH:mm"), today);
        setOvertimeEnd(isoTime);
      } else {
        setOvertimeEnd(null);
      }
      setOvertimeStart(null);
    }
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) {
      return;
    }

    const targetTemplate = templates.find(
      (template) => template.id === selectedTemplateId,
    );
    if (!targetTemplate) {
      dispatch(setSnackbarError("テンプレートが見つかりませんでした。"));
      return;
    }

    const hasCurrentValue =
      customWorkflowTitle.trim().length > 0 ||
      customWorkflowContent.trim().length > 0;

    if (hasCurrentValue) {
      const shouldOverwrite = window.confirm(
        "現在入力しているタイトル・詳細をテンプレート内容で上書きします。よろしいですか？",
      );
      if (!shouldOverwrite) {
        return;
      }
    } else {
      const shouldApply = window.confirm("テンプレートを適用しますか？");
      if (!shouldApply) {
        return;
      }
    }

    setCustomWorkflowTitle(targetTemplate.title);
    setCustomWorkflowContent(targetTemplate.content);
    setCustomWorkflowTitleError("");
    setCustomWorkflowContentError("");
  };

  return (
    <Page
      title="新規作成"
      breadcrumbs={[
        { label: "TOP", href: "/" },
        { label: "ワークフロー", href: "/workflow" },
      ]}
      maxWidth="lg"
    >
      <PageSection
        component="form"
        layoutVariant="dashboard"
        onSubmit={handleSubmit}
        sx={{ gap: 0 }}
      >
        <Box sx={dashboardInnerSurfaceSx}>
          <Grid container rowSpacing={2} columnSpacing={1} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                種別
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Select
                value={category}
                displayEmpty
                onChange={handleCategoryChange}
                size="small"
                fullWidth
              >
                <MenuItem value="">
                  <em>種別を選択</em>
                </MenuItem>
                {enabledCategoryOptions.map((item) => {
                  if (item.category === WorkflowCategory.CLOCK_CORRECTION) {
                    return (
                      <React.Fragment key={item.category}>
                        <MenuItem value={CLOCK_CORRECTION_LABEL}>
                          {CLOCK_CORRECTION_LABEL}
                        </MenuItem>
                        <MenuItem value={CLOCK_CORRECTION_CHECK_OUT_LABEL}>
                          {CLOCK_CORRECTION_CHECK_OUT_LABEL}
                        </MenuItem>
                      </React.Fragment>
                    );
                  }

                  const label = CATEGORY_LABELS[item.category] ?? item.label;
                  return (
                    <MenuItem key={item.category} value={label}>
                      {label}
                    </MenuItem>
                  );
                })}
              </Select>
            </Grid>

            {/* プレビュー機能は廃止されました */}

            {/* 申請者 */}
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                申請者
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="body1">
                {staff ? `${staff.familyName} ${staff.givenName}` : "—"}
              </Typography>
            </Grid>

            {/* 申請日 */}
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                申請日
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <TextField
                value={applicationDate}
                InputProps={{ readOnly: true }}
                size="small"
                fullWidth
              />
            </Grid>

            {/* タイトル入力は廃止されました（申請はテンプレート/種別で自動的にタイトルを決定します） */}

            {/* 説明: 削除済み */}

            {/* 種別固有フィールド（共通コンポーネント） */}
            <WorkflowTypeFields
              category={category}
              disabled={category === ""}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              dateError={dateError}
              paidReason={paidReason}
              setPaidReason={setPaidReason}
              absenceDate={absenceDate}
              setAbsenceDate={setAbsenceDate}
              absenceDateError={absenceDateError}
              absenceReason={absenceReason}
              setAbsenceReason={setAbsenceReason}
              overtimeDate={overtimeDate}
              setOvertimeDate={setOvertimeDate}
              overtimeDateError={overtimeDateError}
              overtimeStart={overtimeStart}
              setOvertimeStart={setOvertimeStart}
              overtimeEnd={overtimeEnd}
              setOvertimeEnd={setOvertimeEnd}
              overtimeError={overtimeError}
              overtimeReason={overtimeReason}
              setOvertimeReason={setOvertimeReason}
              customWorkflowTitle={customWorkflowTitle}
              setCustomWorkflowTitle={setCustomWorkflowTitle}
              customWorkflowContent={customWorkflowContent}
              setCustomWorkflowContent={setCustomWorkflowContent}
              customWorkflowTitleError={customWorkflowTitleError}
              customWorkflowContentError={customWorkflowContentError}
              templateOptions={templates.map((template) => ({
                id: template.id,
                name: template.name,
              }))}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              onApplyTemplate={handleApplyTemplate}
              disableTemplateApply={!selectedTemplateId}
            />
            {/* 新規作成では "その他" は選択不可のため備考UIは表示しない */}

            {/* 下書き */}
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                下書き
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <FormControlLabel
                control={
                  <Switch checked={draftMode} onChange={handleDraftToggle} />
                }
                label={draftMode ? "下書きとして保存" : ""}
              />
            </Grid>

            {/* ボタン（右カラムに詰める） */}
            <Grid item xs={12} sm={3} />
            <Grid item xs={12} sm={9}>
              <Box sx={{ display: "flex", gap: ACTIONS_GAP }}>
                <Button size="small" onClick={() => navigate(-1)}>
                  戻る
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={category === ""}
                >
                  作成
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PageSection>
    </Page>
  );
}
