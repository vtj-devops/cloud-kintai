import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Page from "@shared/ui/page/Page";
import { useContext, useState } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AuthContext } from "@/context/AuthContext";
import { fetchWorkflowById } from "@/entities/workflow/model/loader";
import {
  buildUpdateWorkflowInput,
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  CLOCK_CORRECTION_LABEL,
  validateWorkflowForm,
  type WorkflowFormState,
} from "@/features/workflow/application-form/model/workflowFormModel";
import WorkflowTypeFields from "@/features/workflow/application-form/ui/WorkflowTypeFields";
import { extractExistingWorkflowComments } from "@/features/workflow/comment-thread/model/workflowCommentBuilder";
import { useWorkflowEditLoaderState } from "@/features/workflow/hooks/useWorkflowEditLoaderState";
import type { WorkflowEditLoaderData } from "@/router/loaders/workflowEditLoader";
import { designTokenVar } from "@/shared/designSystem";
import { createLogger } from "@/shared/lib/logger";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";
import { dashboardInnerSurfaceSx, PageSection } from "@/shared/ui/layout";

const ACTIONS_GAP = designTokenVar("spacing.sm", "8px");
const logger = createLogger("WorkflowEditPage");

export default function WorkflowEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workflow } = useLoaderData() as WorkflowEditLoaderData;

  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { update: updateWorkflow } = useWorkflows({ isAuthenticated });
  const { staffs } = useStaffs({ isAuthenticated });
  const dispatch = useAppDispatchV2();
  const {
    category,
    setCategory,
    applicationDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    absenceDate,
    setAbsenceDate,
    absenceReason,
    setAbsenceReason,
    paidReason,
    setPaidReason,
    overtimeDate,
    setOvertimeDate,
    overtimeStart,
    setOvertimeStart,
    overtimeEnd,
    setOvertimeEnd,
    overtimeReason,
    setOvertimeReason,
    customWorkflowTitle,
    setCustomWorkflowTitle,
    customWorkflowContent,
    setCustomWorkflowContent,
    draftMode,
    setDraftMode,
    applicant,
    existingComments,
    setExistingComments,
  } = useWorkflowEditLoaderState(workflow, staffs);
  const [dateError, setDateError] = useState("");
  const [absenceDateError, setAbsenceDateError] = useState("");
  const [overtimeDateError, setOvertimeDateError] = useState("");
  const [overtimeError, setOvertimeError] = useState("");
  const [customWorkflowTitleError, setCustomWorkflowTitleError] = useState("");
  const [customWorkflowContentError, setCustomWorkflowContentError] =
    useState("");

  const handleSave = (e: React.FormEvent) => {
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

    (async () => {
      try {
        if (!id) throw new Error("IDが不明です");
        let normalizedComments = existingComments;
        if (!draftMode) {
          const latest = await fetchWorkflowById(id);
          normalizedComments = extractExistingWorkflowComments(latest);
          setExistingComments(normalizedComments);
        }

        const baseInput = buildUpdateWorkflowInput({
          workflowId: id,
          draftMode,
          state: formState,
          existingComments: normalizedComments,
        });

        await updateWorkflow(baseInput);
        dispatch(setSnackbarSuccess("保存しました"));
        setTimeout(() => navigate(`/workflow/${id}`), 1000);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Workflow update failed:", message);
        dispatch(setSnackbarError(message));
      }
    })();
  };

  const handleDraftToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDraftMode(checked);
  };

  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value as string;
    setCategory(v);
    if (v === "有給休暇申請") {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      if (!paidReason) setPaidReason("私用のため");
    }
  };

  return (
    <Page
      title="編集"
      breadcrumbs={[
        { label: "TOP", href: "/" },
        { label: "ワークフロー", href: "/workflow" },
      ]}
      maxWidth="lg"
    >
      <PageSection
        component="form"
        layoutVariant="dashboard"
        onSubmit={handleSave}
        sx={{ gap: 0 }}
      >
        <Box sx={dashboardInnerSurfaceSx}>
          <Grid container rowSpacing={2} columnSpacing={1} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                ID
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="body1">{id ?? "—"}</Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                種別
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              {id ? (
                // 編集時は種別の変更を想定しないためテキスト表示
                <Typography variant="body1">
                  {category || "（未設定）"}
                </Typography>
              ) : (
                <Select
                  value={category}
                  onChange={handleCategoryChange}
                  displayEmpty
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>種別を選択</em>
                  </MenuItem>
                  <ListSubheader>勤怠</ListSubheader>
                  <MenuItem value="有給休暇申請">有給休暇申請</MenuItem>
                  <MenuItem value="欠勤申請">欠勤申請</MenuItem>
                  <MenuItem value="残業申請">残業申請</MenuItem>
                  <MenuItem value={CLOCK_CORRECTION_LABEL}>
                    {CLOCK_CORRECTION_LABEL}
                  </MenuItem>
                  <MenuItem value={CLOCK_CORRECTION_CHECK_OUT_LABEL}>
                    {CLOCK_CORRECTION_CHECK_OUT_LABEL}
                  </MenuItem>
                  <MenuItem value="その他">その他</MenuItem>
                </Select>
              )}
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                申請者
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography>
                {applicant
                  ? `${applicant.familyName} ${applicant.givenName}`
                  : "—"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                申請日
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              {id ? (
                <Typography variant="body1">{applicationDate}</Typography>
              ) : (
                <TextField
                  value={applicationDate}
                  InputProps={{ readOnly: true }}
                  size="small"
                  fullWidth
                />
              )}
            </Grid>

            {/* 種別固有フィールド（共通コンポーネント） */}
            <WorkflowTypeFields
              category={category}
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
            />

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

            <Grid item xs={12} sm={3} />
            <Grid item xs={12} sm={9}>
              <Box sx={{ display: "flex", gap: ACTIONS_GAP }}>
                <Button size="small" onClick={() => navigate(-1)}>
                  戻る
                </Button>
                <Button type="submit" variant="contained" size="small">
                  保存
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PageSection>
      {/* notifications are handled globally by SnackbarGroup */}
    </Page>
  );
}
