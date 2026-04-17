import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import MessageIcon from "@mui/icons-material/Message";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { memo, useState } from "react";

import {
  CELL_CHANGE_SOURCE_COLORS,
  CELL_CHANGE_SOURCE_LABELS,
} from "../lib/cellChangeSourceConfig";
import {
  CellChangeRecord,
  CellComment,
  Mention,
  ShiftState,
} from "../types/collaborative.types";

interface EditLockHolder {
  staffId: string;
  date: string;
  editorName: string;
  editorColor: string;
  isSelf: boolean;
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

interface ShiftCellPanelProps {
  selectionCount: number;
  selectedCells?: Array<{ staffId: string; date: string }>;
  comments?: CellComment[];
  cellHistory?: readonly CellChangeRecord[];
  onClear: () => void;
  onChangeState: (state: ShiftState) => void;
  onLock: () => void;
  onUnlock: () => void;
  onAddComments?: (content: string, mentions: Mention[]) => Promise<void>;
  canUnlock: boolean;
  showLock: boolean;
  showUnlock: boolean;
  isUpdating?: boolean;
  cellEditLockHolders?: EditLockHolder[];
  hasEditLockForSelected: boolean;
  isOthersEditingSelected: boolean;
  onAcquireEditLock: () => void;
  onReleaseEditLock: () => void;
  onForceReleaseLock: () => void;
}

const stateOptions: Array<{ state: ShiftState; label: string; color: string }> =
  [
    { state: "work", label: "出勤", color: "#4caf50" },
    { state: "requestedOff", label: "希望休", color: "#ff9800" },
    { state: "fixedOff", label: "固定休", color: "#f44336" },
    { state: "auto", label: "自動調整", color: "#2196f3" },
    { state: "empty", label: "未入力", color: "#9e9e9e" },
  ];

const ShiftCellPanelBase = ({
  selectionCount,
  selectedCells = [],
  comments = [],
  cellHistory = [],
  onClear,
  onChangeState,
  onLock,
  onUnlock,
  onAddComments,
  canUnlock,
  showLock,
  showUnlock,
  isUpdating = false,
  cellEditLockHolders = [],
  hasEditLockForSelected,
  isOthersEditingSelected,
  onAcquireEditLock,
  onReleaseEditLock,
  onForceReleaseLock,
}: ShiftCellPanelProps) => {
  const [commentText, setCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const MAX_HISTORY_VISIBLE = 5;

  const handleAddComment = async () => {
    if (!commentText.trim() || !onAddComments) return;

    setIsAddingComment(true);
    try {
      await onAddComments(commentText, []);
      setCommentText("");
    } finally {
      setIsAddingComment(false);
    }
  };

  if (selectionCount === 0) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        px: 3,
        py: 2,
        borderRadius: "24px",
        border: "1px solid rgba(226,232,240,0.9)",
        minWidth: 600,
        zIndex: 1000,
        opacity: isUpdating ? 0.6 : 1,
        pointerEvents: isUpdating ? "none" : "auto",
        bgcolor: "#ffffff",
        boxShadow: "0 28px 60px -36px rgba(15,23,42,0.4)",
      }}
    >
      <Stack spacing={2}>
        {/* 選択数表示 */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              {selectionCount}セル選択中
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={onClear}
            startIcon={<DeleteIcon />}
            color="inherit"
            disabled={isUpdating}
          >
            選択解除
          </Button>
        </Box>

        <Divider />

        {/* 編集ロック制御ボタン */}
        <Box>
          <Stack direction="row" spacing={1}>
            {!hasEditLockForSelected && !isOthersEditingSelected && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={onAcquireEditLock}
                disabled={isUpdating}
              >
                編集開始（ロック取得）
              </Button>
            )}
            {hasEditLockForSelected && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={onReleaseEditLock}
                disabled={isUpdating}
              >
                編集終了（ロック解除）
              </Button>
            )}
            {(hasEditLockForSelected || isOthersEditingSelected) &&
              canUnlock && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={onForceReleaseLock}
                  disabled={isUpdating}
                >
                  編集ロックを強制剥奪
                </Button>
              )}
            {isOthersEditingSelected && !canUnlock && (
              <Typography
                variant="body2"
                color="error"
                sx={{ alignSelf: "center" }}
              >
                他のユーザーが編集中です
              </Typography>
            )}
          </Stack>

          {/* 編集ロック保持者 */}
          {cellEditLockHolders.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {cellEditLockHolders.map(
                ({ staffId, date, editorName, editorColor, isSelf }) => (
                  <Stack
                    key={`${staffId}#${date}`}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: "0.65rem",
                        bgcolor: editorColor,
                      }}
                    >
                      {editorName.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {date}日:
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {editorName}
                    </Typography>
                    {isSelf && (
                      <Typography variant="caption" color="primary.main">
                        （あなた）
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                      が編集ロック中
                    </Typography>
                  </Stack>
                ),
              )}
            </Stack>
          )}
        </Box>

        <Divider />

        {/* 状態変更ボタン */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            状態を一括変更:
          </Typography>
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            {stateOptions.map((option) => (
              <Chip
                key={option.state}
                label={option.label}
                onClick={() => onChangeState(option.state)}
                disabled={isUpdating || !hasEditLockForSelected}
                sx={{
                  bgcolor: option.color,
                  color: "white",
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: option.color,
                    opacity: isUpdating ? 0.5 : 0.8,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        {/* 確定/解除ボタン */}
        <Stack direction="row" spacing={1}>
          {showLock && (
            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={onLock}
              size="small"
              color="primary"
              disabled={isUpdating}
            >
              確定（ロック）
            </Button>
          )}
          {showUnlock && (
            <Button
              variant="outlined"
              startIcon={<LockOpenIcon />}
              onClick={onUnlock}
              size="small"
              color="inherit"
              disabled={!canUnlock || isUpdating}
            >
              確定解除
            </Button>
          )}
        </Stack>

        <Divider />

        {/* コメント入力 */}
        {onAddComments && selectedCells.length > 0 && (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                コメント追加:
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <TextField
                  placeholder="選択セルにコメントを追加..."
                  size="small"
                  fullWidth
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isAddingComment || isUpdating}
                  multiline
                  maxRows={2}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  startIcon={
                    isAddingComment ? (
                      <CircularProgress size={16} />
                    ) : (
                      <MessageIcon />
                    )
                  }
                  onClick={handleAddComment}
                  disabled={
                    !commentText.trim() || isAddingComment || isUpdating
                  }
                  size="small"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  追加
                </Button>
              </Stack>
            </Box>

            {/* コメント一覧をチャット形式で表示 */}
            {comments && comments.length > 0 && (
              <Box
                sx={{
                  bgcolor: "background.default",
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  {comments.length}件のコメント
                </Typography>
                <Stack spacing={1.5}>
                  {comments.map((comment, index) => (
                    <Box
                      key={`${comment.id}-${comment.createdAt}-${index}`}
                      sx={{ display: "flex", gap: 1 }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.75rem",
                          bgcolor: `hsl(${
                            Math.abs(comment.userId.charCodeAt(0) * 131) % 360
                          }, 70%, 50%)`,
                        }}
                      >
                        {comment.userName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" fontWeight={600}>
                            {comment.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(comment.createdAt).format("HH:mm")}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            wordBreak: "break-word",
                            mt: 0.5,
                          }}
                        >
                          {comment.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />
          </>
        )}

        {/* セル変更履歴（インライン） */}
        {selectionCount === 1 && selectedCells.length === 1 && (
          <>
            <Box>
              <Button
                size="small"
                variant="text"
                color="inherit"
                endIcon={
                  historyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                onClick={() => setHistoryExpanded((v) => !v)}
                sx={{ px: 0, fontWeight: 600 }}
              >
                変更履歴
                {cellHistory.length > 0 ? `（${cellHistory.length}件）` : ""}
              </Button>
              <Collapse in={historyExpanded}>
                {cellHistory.length === 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    変更履歴はありません
                  </Typography>
                ) : (
                  <List dense disablePadding sx={{ mt: 0.5 }}>
                    {cellHistory.slice(0, MAX_HISTORY_VISIBLE).map((record) => (
                      <ListItem key={record.id} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {dayjs(record.changedAt).format("M/D HH:mm")}
                              </Typography>
                              <Chip
                                size="small"
                                label={CELL_CHANGE_SOURCE_LABELS[record.source]}
                                color={CELL_CHANGE_SOURCE_COLORS[record.source]}
                                variant="outlined"
                                sx={{ height: 16, fontSize: "0.6rem" }}
                              />
                            </Stack>
                          }
                          primaryTypographyProps={{ component: "div" }}
                          secondary={
                            <Stack spacing={0}>
                              <Typography
                                variant="caption"
                                color="text.primary"
                              >
                                {formatShiftState(record.previousState)} →{" "}
                                {formatShiftState(record.newState)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.disabled"
                              >
                                {record.changedByName || "不明"}
                              </Typography>
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
                      </ListItem>
                    ))}
                    {cellHistory.length > MAX_HISTORY_VISIBLE && (
                      <Typography variant="caption" color="text.disabled">
                        他 {cellHistory.length - MAX_HISTORY_VISIBLE} 件
                      </Typography>
                    )}
                  </List>
                )}
              </Collapse>
            </Box>
            <Divider />
          </>
        )}

        {/* ヘルプテキスト */}
        <Typography variant="caption" color="text.secondary">
          <strong>ヒント:</strong>{" "}
          Shift+クリックで範囲選択、Ctrl/Cmd+クリックで個別追加選択
        </Typography>
      </Stack>
    </Paper>
  );
};

export const ShiftCellPanel = memo(ShiftCellPanelBase);
