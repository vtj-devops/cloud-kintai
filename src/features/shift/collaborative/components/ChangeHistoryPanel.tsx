import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";

import { HistoryEntry } from "../hooks/useUndoRedo";
import { ShiftState } from "../types/collaborative.types";

export type ChangeHistoryEntry = HistoryEntry & {
  status: "undo" | "redo";
};

interface ChangeHistoryPanelProps {
  undoHistory: HistoryEntry[];
  redoHistory: HistoryEntry[];
  maxVisible?: number;
  staffNameMap?: Map<string, string>;
  open: boolean;
  onClose: () => void;
}

const SHIFT_STATE_LABELS: Record<ShiftState, string> = {
  work: "出勤",
  fixedOff: "固定休",
  requestedOff: "希望休",
  auto: "自動調整枠",
  empty: "未入力",
};

const formatShiftState = (state?: ShiftState) =>
  state ? SHIFT_STATE_LABELS[state] : "未設定";

const formatLockState = (locked?: boolean) =>
  locked === undefined ? "未設定" : locked ? "ロック" : "解除";

export const ChangeHistoryPanel: React.FC<ChangeHistoryPanelProps> = ({
  undoHistory,
  redoHistory,
  maxVisible = 10,
  staffNameMap,
  open,
  onClose,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const entries = useMemo<ChangeHistoryEntry[]>(() => {
    const undoEntries = undoHistory.map((entry) => ({
      ...entry,
      status: "undo" as const,
    }));
    const redoEntries = redoHistory.map((entry) => ({
      ...entry,
      status: "redo" as const,
    }));

    return [...undoEntries, ...redoEntries].toSorted(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [redoHistory, undoHistory]);

  const userOptions = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((entry) => entry.userName)
            .filter((name): name is string => Boolean(name)),
        ),
      ).toSorted(),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const start = startDate ? dayjs(startDate).startOf("day") : null;
    const end = endDate ? dayjs(endDate).endOf("day") : null;

    const filtered = entries.filter((entry) => {
      if (userFilter !== "all" && entry.userName !== userFilter) {
        return false;
      }

      const entryTime = dayjs(entry.timestamp);
      if (start && entryTime.isBefore(start)) {
        return false;
      }
      if (end && entryTime.isAfter(end)) {
        return false;
      }

      return true;
    });

    return filtered.slice(0, maxVisible);
  }, [entries, startDate, endDate, userFilter, maxVisible]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setUserFilter("all");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle>変更履歴</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "flex-end" }}
            sx={{ flexWrap: "wrap" }}
          >
            <TextField
              label="開始日"
              type="date"
              size="small"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: "1 1 auto", minWidth: 140 }}
            />
            <TextField
              label="終了日"
              type="date"
              size="small"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: "1 1 auto", minWidth: 140 }}
            />
            <FormControl size="small" sx={{ flex: "1 1 auto", minWidth: 140 }}>
              <InputLabel id="change-history-user-filter-label">
                ユーザー
              </InputLabel>
              <Select
                labelId="change-history-user-filter-label"
                label="ユーザー"
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                {userOptions.map((userName) => (
                  <MenuItem key={userName} value={userName}>
                    {userName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="text"
              onClick={handleResetFilters}
              sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              リセット
            </Button>
          </Stack>

          {entries.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              変更履歴はありません
            </Typography>
          ) : filteredEntries.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              条件に一致する履歴はありません
            </Typography>
          ) : (
            <List dense disablePadding>
              {filteredEntries.map((entry) => (
                <ListItem
                  key={entry.id}
                  divider
                  sx={{ alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={entry.description || "シフト変更"}
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(entry.timestamp).format("YYYY/M/D HH:mm")} /{" "}
                          {entry.userName || "不明"}
                        </Typography>
                        <Box component="div">
                          {entry.updates.map((update, index) => {
                            const staffName =
                              staffNameMap?.get(update.staffId) ??
                              update.staffId;
                            const stateDiff = `${formatShiftState(update.previousState)} → ${formatShiftState(update.newState)}`;
                            const lockDiff =
                              update.previousLocked === undefined &&
                              update.isLocked === undefined
                                ? null
                                : `${formatLockState(update.previousLocked)} → ${formatLockState(update.isLocked)}`;

                            return (
                              <Box
                                key={`${update.staffId}-${update.date}-${index}`}
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.primary"
                                >
                                  {staffName} / {update.date}日
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {stateDiff}
                                </Typography>
                                {lockDiff && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    ロック: {lockDiff}
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Stack>
                    }
                  />
                  <Chip
                    size="small"
                    label={
                      entry.status === "undo" ? "取り消し可能" : "やり直し可能"
                    }
                    color={entry.status === "undo" ? "default" : "warning"}
                    variant="outlined"
                    sx={{ ml: 1, mt: 0.5 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
