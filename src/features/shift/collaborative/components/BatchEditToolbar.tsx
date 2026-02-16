import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import MessageIcon from "@mui/icons-material/Message";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { memo, useState } from "react";

import { CellComment, Mention, ShiftState } from "../types/collaborative.types";

interface BatchEditToolbarProps {
  selectionCount: number;
  selectedCells?: Array<{ staffId: string; date: string }>;
  comments?: CellComment[];
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onChangeState: (state: ShiftState) => void;
  onLock: () => void;
  onUnlock: () => void;
  onAddComments?: (content: string, mentions: Mention[]) => Promise<void>;
  canUnlock: boolean;
  showLock: boolean;
  showUnlock: boolean;
  hasClipboard: boolean;
  canPaste: boolean;
  isUpdating?: boolean;
}

const stateOptions: Array<{ state: ShiftState; label: string; color: string }> =
  [
    { state: "work", label: "出勤", color: "#4caf50" },
    { state: "requestedOff", label: "希望休", color: "#ff9800" },
    { state: "fixedOff", label: "固定休", color: "#f44336" },
    { state: "auto", label: "自動調整", color: "#2196f3" },
    { state: "empty", label: "未入力", color: "#9e9e9e" },
  ];

const BatchEditToolbarBase = ({
  selectionCount,
  selectedCells = [],
  comments = [],
  onCopy,
  onPaste,
  onClear,
  onChangeState,
  onLock,
  onUnlock,
  onAddComments,
  canUnlock,
  showLock,
  showUnlock,
  hasClipboard,
  canPaste,
  isUpdating = false,
}: BatchEditToolbarProps) => {
  const [commentText, setCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

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
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        px: 3,
        py: 2,
        borderRadius: 2,
        minWidth: 600,
        zIndex: 1000,
        opacity: isUpdating ? 0.6 : 1,
        pointerEvents: isUpdating ? "none" : "auto",
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
                disabled={isUpdating}
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

        {/* コピー＆ペーストボタン */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={onCopy}
            size="small"
            disabled={isUpdating}
          >
            コピー
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={onPaste}
            disabled={!hasClipboard || !canPaste || isUpdating}
            size="small"
          >
            貼り付け
            {hasClipboard && " (Ctrl+V)"}
          </Button>
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
                  {comments.map((comment) => (
                    <Box key={comment.id} sx={{ display: "flex", gap: 1 }}>
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

        {/* ヘルプテキスト */}
        <Typography variant="caption" color="text.secondary">
          <strong>ヒント:</strong>{" "}
          Shift+クリックで範囲選択、Ctrl/Cmd+クリックで個別追加選択
        </Typography>
      </Stack>
    </Paper>
  );
};

export const BatchEditToolbar = memo(BatchEditToolbarBase);
