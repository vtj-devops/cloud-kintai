import {
  Box,
  Button,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  CLOCK_CORRECTION_LABEL,
} from "@/features/workflow/application-form/model/workflowFormModel";
import { TimeInput } from "@/shared/ui/TimeInput";

type Props = {
  category: string;
  disabled?: boolean;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  dateError: string;
  paidReason: string;
  setPaidReason: (v: string) => void;
  absenceDate: string;
  setAbsenceDate: (v: string) => void;
  absenceDateError: string;
  absenceReason: string;
  setAbsenceReason: (v: string) => void;
  overtimeDate: string;
  setOvertimeDate: (v: string) => void;
  overtimeDateError: string;
  overtimeStart: string | null;
  setOvertimeStart: (v: string | null) => void;
  overtimeEnd: string | null;
  setOvertimeEnd: (v: string | null) => void;
  overtimeError: string;
  overtimeReason?: string;
  setOvertimeReason?: (v: string) => void;
  customWorkflowTitle?: string;
  setCustomWorkflowTitle?: (v: string) => void;
  customWorkflowContent?: string;
  setCustomWorkflowContent?: (v: string) => void;
  customWorkflowTitleError?: string;
  customWorkflowContentError?: string;
  templateOptions?: Array<{
    id: string;
    name: string;
  }>;
  selectedTemplateId?: string;
  setSelectedTemplateId?: (v: string) => void;
  onApplyTemplate?: () => void;
  disableTemplateApply?: boolean;
};

export default function WorkflowTypeFields({
  category,
  disabled = false,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dateError,
  paidReason,
  setPaidReason,
  absenceDate,
  setAbsenceDate,
  absenceDateError,
  absenceReason,
  setAbsenceReason,
  overtimeDate,
  setOvertimeDate,
  overtimeDateError,
  overtimeStart,
  setOvertimeStart,
  overtimeEnd,
  setOvertimeEnd,
  overtimeError,
  overtimeReason,
  setOvertimeReason,
  customWorkflowTitle,
  setCustomWorkflowTitle,
  customWorkflowContent,
  setCustomWorkflowContent,
  customWorkflowTitleError,
  customWorkflowContentError,
  templateOptions,
  selectedTemplateId,
  setSelectedTemplateId,
  onApplyTemplate,
  disableTemplateApply,
}: Props) {
  return (
    <>
      {category === "有給休暇申請" && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              取得期間
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                type="date"
                size="small"
                disabled={disabled}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(dateError)}
                helperText={dateError}
              />
              <Typography>-</Typography>
              <TextField
                type="date"
                size="small"
                disabled={disabled}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(dateError)}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              申請理由
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              size="small"
              fullWidth
              disabled={disabled}
              value={paidReason}
              onChange={(e) => setPaidReason(e.target.value)}
            />
          </Grid>
        </>
      )}

      {category === "欠勤申請" && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              欠勤日
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              type="date"
              size="small"
              fullWidth
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(absenceDateError)}
              helperText={absenceDateError}
              disabled={disabled}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              欠勤理由
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              size="small"
              fullWidth
              sx={{ "& .MuiInputBase-input": { padding: "6px 10px" } }}
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              disabled={disabled}
            />
          </Grid>
        </>
      )}

      {category === "残業申請" && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              残業予定日
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              type="date"
              size="small"
              value={overtimeDate}
              onChange={(e) => setOvertimeDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(overtimeDateError)}
              helperText={overtimeDateError}
              sx={{ maxWidth: 200 }}
              disabled={disabled}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              残業予定時間
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TimeInput
                value={overtimeStart}
                onChange={setOvertimeStart}
                baseDate={overtimeDate || new Date().toISOString().slice(0, 10)}
                size="small"
                error={Boolean(overtimeError)}
                disabled={disabled}
                sx={{ maxWidth: 160 }}
              />
              <Typography>-</Typography>
              <TimeInput
                value={overtimeEnd}
                onChange={setOvertimeEnd}
                baseDate={overtimeDate || new Date().toISOString().slice(0, 10)}
                size="small"
                error={Boolean(overtimeError)}
                disabled={disabled}
                sx={{ maxWidth: 160 }}
              />
              {overtimeError && (
                <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                  {overtimeError}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              残業理由
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              size="small"
              fullWidth
              value={overtimeReason}
              onChange={(e) =>
                setOvertimeReason && setOvertimeReason(e.target.value)
              }
              disabled={disabled}
            />
          </Grid>
        </>
      )}

      {category === CLOCK_CORRECTION_LABEL && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              対象日
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              type="date"
              size="small"
              value={overtimeDate}
              onChange={(e) => setOvertimeDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(overtimeDateError)}
              helperText={overtimeDateError}
              disabled={disabled}
              sx={{ maxWidth: 200 }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              出勤時間
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TimeInput
              value={overtimeStart}
              onChange={setOvertimeStart}
              baseDate={overtimeDate || new Date().toISOString().slice(0, 10)}
              size="small"
              error={Boolean(overtimeError)}
              helperText={overtimeError}
              disabled={disabled}
              sx={{ maxWidth: 160 }}
            />
          </Grid>
        </>
      )}

      {category === CLOCK_CORRECTION_CHECK_OUT_LABEL && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              対象日
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              type="date"
              size="small"
              value={overtimeDate}
              onChange={(e) => setOvertimeDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(overtimeDateError)}
              helperText={overtimeDateError}
              disabled={disabled}
              sx={{ maxWidth: 200 }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              退勤時間
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TimeInput
              value={overtimeEnd}
              onChange={setOvertimeEnd}
              baseDate={overtimeDate || new Date().toISOString().slice(0, 10)}
              size="small"
              error={Boolean(overtimeError)}
              helperText={overtimeError}
              disabled={disabled}
              sx={{ maxWidth: 160 }}
            />
          </Grid>
        </>
      )}

      {category === "その他" && (
        <>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              テンプレート
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Select
                size="small"
                fullWidth
                value={selectedTemplateId ?? ""}
                onChange={(e) =>
                  setSelectedTemplateId && setSelectedTemplateId(e.target.value)
                }
                disabled={disabled}
                displayEmpty
              >
                <MenuItem value="">
                  <em>テンプレートを選択</em>
                </MenuItem>
                {(templateOptions ?? []).map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="outlined"
                onClick={() => onApplyTemplate && onApplyTemplate()}
                disabled={disabled || disableTemplateApply}
              >
                適用
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              タイトル
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              size="small"
              fullWidth
              value={customWorkflowTitle ?? ""}
              onChange={(e) =>
                setCustomWorkflowTitle && setCustomWorkflowTitle(e.target.value)
              }
              disabled={disabled}
              error={Boolean(customWorkflowTitleError)}
              helperText={customWorkflowTitleError}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              詳細
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={6}
              value={customWorkflowContent ?? ""}
              onChange={(e) =>
                setCustomWorkflowContent &&
                setCustomWorkflowContent(e.target.value)
              }
              disabled={disabled}
              error={Boolean(customWorkflowContentError)}
              helperText={customWorkflowContentError}
            />
          </Grid>
        </>
      )}
    </>
  );
}
