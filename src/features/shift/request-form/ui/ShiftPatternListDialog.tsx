import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { AppButton } from "@shared/ui/button";
import { AppDialog, DataStateContainer, EmptyState } from "@shared/ui/feedback";
import React from "react";

import { ShiftRequestPattern } from "../model/shiftRequestPattern";
import { normalizeStatus } from "../model/statusMapping";
import { STATUS_LABEL_MAP, STATUS_MOBILE_LABEL_MAP, WEEKDAY_LABELS } from "./constants";

type ShiftPatternListDialogProps = {
  open: boolean;
  isMobile: boolean;
  patternsLoading: boolean;
  patterns: ShiftRequestPattern[];
  onClose: () => void;
  onOpenCreate: () => void;
  onApply: (pattern: ShiftRequestPattern) => void;
  onDelete: (id: string) => void;
};

export function ShiftPatternListDialog({
  open,
  isMobile,
  patternsLoading,
  patterns,
  onClose,
  onOpenCreate,
  onApply,
  onDelete,
}: ShiftPatternListDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="マイパターン一覧"
      maxWidth="sm"
      actions={
        <>
          <AppButton variant="ghost" tone="neutral" size="sm" onClick={onClose}>
            閉じる
          </AppButton>
          <AppButton
            onClick={onOpenCreate}
            startIcon={<AddIcon />}
            size="sm"
            disabled={patternsLoading}
          >
            新規作成
          </AppButton>
        </>
      }
    >
      <DataStateContainer
        isLoading={patternsLoading}
        hasData={patterns.length > 0}
        loadingContent={
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        }
        emptyContent={<EmptyState message="登録されたパターンはありません。" />}
      >
        <>
          {isMobile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              凡例: 出=出勤 / 固=固定休 / 希=希望休
            </Typography>
          )}
          <List>
            {patterns.map((pattern, index) => (
              <React.Fragment key={pattern.id}>
                <ListItem disableGutters sx={{ px: 0 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      width: "100%",
                      p: 2,
                      backgroundColor: "grey.50",
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {pattern.name}
                    </Typography>
                    <Table size="small" sx={{ tableLayout: "fixed" }}>
                      <TableHead>
                        <TableRow>
                          {WEEKDAY_LABELS.map((label, idx) => (
                            <TableCell
                              key={`${pattern.id}-weekday-${idx}`}
                              align="center"
                              sx={{ py: 0.5, whiteSpace: "nowrap" }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {WEEKDAY_LABELS.map((_, idx) => {
                            const normalized = normalizeStatus(
                              pattern.mapping[idx] as string,
                            );
                            return (
                              <TableCell
                                key={`${pattern.id}-status-${idx}`}
                                align="center"
                                sx={{ py: 0.5, whiteSpace: "nowrap" }}
                              >
                                {isMobile
                                  ? (STATUS_MOBILE_LABEL_MAP[normalized] ??
                                    STATUS_LABEL_MAP[normalized])
                                  : STATUS_LABEL_MAP[normalized]}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <AppButton
                        size="sm"
                        variant="ghost"
                        tone="neutral"
                        onClick={() => onApply(pattern)}
                        disabled={patternsLoading}
                      >
                        適用
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="ghost"
                        tone="danger"
                        onClick={() => onDelete(pattern.id)}
                        disabled={patternsLoading}
                        startIcon={<DeleteIcon />}
                      >
                        削除
                      </AppButton>
                    </Stack>
                  </Paper>
                </ListItem>
                {index !== patterns.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        </>
      </DataStateContainer>
    </AppDialog>
  );
}
