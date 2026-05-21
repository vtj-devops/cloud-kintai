import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/feedback";

import { ShiftRequestDayStatus } from "../model/statusMapping";
import { STATUS_LABEL_MAP, WEEKDAY_LABELS } from "./constants";

type ShiftPatternCreateDialogProps = {
  open: boolean;
  patternsLoading: boolean;
  newPatternName: string;
  newPatternMapping: Record<number, ShiftRequestDayStatus>;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onChangeMapping: (weekday: number, status: ShiftRequestDayStatus) => void;
  onSave: () => void;
};

export function ShiftPatternCreateDialog({
  open,
  patternsLoading,
  newPatternName,
  newPatternMapping,
  onClose,
  onChangeName,
  onChangeMapping,
  onSave,
}: ShiftPatternCreateDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="新しいパターンを作成"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="ghost" tone="neutral" size="sm" onClick={onClose}>
            キャンセル
          </AppButton>
          <AppButton onClick={onSave} size="sm" disabled={patternsLoading}>
            保存
          </AppButton>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="パターン名"
          value={newPatternName}
          onChange={(event) => onChangeName(event.target.value)}
        />
        <Typography variant="body2">曜日ごとのステータスを設定してください</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
          }}
        >
          {Array.from({ length: 7 }).map((_, index) => (
            <FormControl size="small" fullWidth key={index}>
              <InputLabel>{WEEKDAY_LABELS[index]}</InputLabel>
              <Select
                label={WEEKDAY_LABELS[index]}
                value={newPatternMapping[index]}
                onChange={(event) =>
                  onChangeMapping(index, event.target.value as ShiftRequestDayStatus)
                }
              >
                {(
                  ["work", "fixedOff", "requestedOff", "auto"] as
                    ShiftRequestDayStatus[]
                ).map((status) => (
                  <MenuItem key={status} value={status}>
                    {STATUS_LABEL_MAP[status]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      </Stack>
    </AppDialog>
  );
}
