import { Box, Paper, Stack, Typography } from "@mui/material";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { RefObject } from "react";

import { SelectedDateMap,ShiftRequestDayStatus } from "../model/statusMapping";
import { WEEKDAY_LABELS } from "./constants";
import { ShiftStatusButtons } from "./ShiftStatusButtons";

type ShiftDayDetailPanelProps = {
  isMobile: boolean;
  isSelectionMode: boolean;
  hasRowSelection: boolean;
  selectedRowCount: number;
  focusedDateKey: string | null;
  selectedDates: SelectedDateMap;
  interactionDisabled: boolean;
  dayDetailRef: RefObject<HTMLDivElement | null>;
  onSelectStatus: (status: ShiftRequestDayStatus) => void;
  onSelectStatusForDate: (dateKey: string, status: ShiftRequestDayStatus) => void;
  onClearDateSelection: (dateKey: string) => void;
};

export function ShiftDayDetailPanel({
  isMobile,
  isSelectionMode,
  hasRowSelection,
  selectedRowCount,
  focusedDateKey,
  selectedDates,
  interactionDisabled,
  dayDetailRef,
  onSelectStatus,
  onSelectStatusForDate,
  onClearDateSelection,
}: ShiftDayDetailPanelProps) {
  const padding = isMobile ? 1.5 : 2;
  const actionVerb = isMobile ? "タップ" : "クリック";

  if (isSelectionMode) {
    if (!hasRowSelection) {
      return (
        <Paper
          variant="outlined"
          sx={{ p: padding }}
          ref={isMobile ? dayDetailRef : undefined}
        >
          <Typography variant="body2" color="text.secondary">
            カレンダー上で日付を{actionVerb}
            して選択してください。選択した日付はここで一括操作できます。
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper
        variant="outlined"
        sx={{ p: padding }}
        ref={isMobile ? dayDetailRef : undefined}
      >
        <Stack spacing={isMobile ? 1.5 : 2}>
          <Typography variant="subtitle1">選択中: {selectedRowCount}日</Typography>
          <Typography variant="body2" color="text.secondary">
            下のボタンで選択した日付へステータスを一括適用できます。
          </Typography>
          <ShiftStatusButtons
            disabled={interactionDisabled}
            isMobile={isMobile}
            onSelect={onSelectStatus}
          />
        </Stack>
      </Paper>
    );
  }

  if (!focusedDateKey) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: padding }}
        ref={isMobile ? dayDetailRef : undefined}
      >
        <Typography variant="body2" color="text.secondary">
          カレンダー上の日付を{actionVerb}してステータスを設定してください。
        </Typography>
      </Paper>
    );
  }

  const focusedDay = dayjs(focusedDateKey);
  const weekday = WEEKDAY_LABELS[focusedDay.day()];
  const selected = selectedDates[focusedDateKey]?.status;

  return (
    <Paper
      variant="outlined"
      sx={{ p: padding }}
      ref={isMobile ? dayDetailRef : undefined}
    >
      <Stack spacing={isMobile ? 1.5 : 2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 1,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Typography variant={isMobile ? "subtitle1" : "h6"}>
            {`${focusedDay.format("M/D")}(${weekday})`}
          </Typography>
          {selected && (
            <AppButton
              size="sm"
              variant="ghost"
              disabled={interactionDisabled}
              onClick={() => onClearDateSelection(focusedDateKey)}
            >
              解除
            </AppButton>
          )}
        </Box>
        <ShiftStatusButtons
          selected={selected}
          disabled={interactionDisabled}
          isMobile={isMobile}
          onSelect={(status) => onSelectStatusForDate(focusedDateKey, status)}
        />
      </Stack>
    </Paper>
  );
}

