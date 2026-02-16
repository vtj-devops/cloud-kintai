import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ReplyIcon from "@mui/icons-material/Reply";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";

import { useShiftComments } from "../hooks/useShiftComments";
import { CellComment, Mention } from "../types/collaborative.types";

interface CellCommentDialogProps {
  open: boolean;
  cellKey: string;
  staffName: string;
  date: string;
  comments: CellComment[];
  availableUsers: { userId: string; userName: string }[];
  currentUserId: string;
  onClose: () => void;
  onAddComment: (cellKey: string, content: string, mentions: Mention[]) => void;
  onUpdateComment: (
    commentId: string,
    content: string,
    mentions: Mention[],
  ) => void;
  onDeleteComment: (commentId: string) => void;
  onReplyComment: (
    parentCommentId: string,
    content: string,
    mentions: Mention[],
  ) => void;
  onDeleteReply: (parentCommentId: string, replyId: string) => void;
}

/**
 * セルコメントダイアログ
 * コメント追加/編集/削除、返信機能を提供
 */
export const CellCommentDialog: React.FC<CellCommentDialogProps> = ({
  open,
  cellKey,
  staffName,
  date,
  comments,
  availableUsers,
  currentUserId,
  onClose,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onReplyComment,
  onDeleteReply,
}) => {
  const { parseMentions } = useShiftComments();
  const [newCommentContent, setNewCommentContent] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<
    { userId: string; userName: string }[]
  >([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState<
    { userId: string; userName: string }[]
  >([]);

  const userNames = useMemo(
    () => availableUsers.map((u) => u.userName),
    [availableUsers],
  );

  /**
   * 新規コメント追加
   */
  const handleAddComment = useCallback(() => {
    if (!newCommentContent.trim()) return;

    const mentions = parseMentions(newCommentContent, availableUsers);
    onAddComment(cellKey, newCommentContent, mentions);

    setNewCommentContent("");
    setSelectedMentions([]);
  }, [newCommentContent, cellKey, onAddComment, availableUsers, parseMentions]);

  /**
   * コメント編集開始
   */
  const handleStartEditComment = useCallback((comment: CellComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }, []);

  /**
   * コメント編集保存
   */
  const handleSaveEditComment = useCallback(() => {
    if (!editingCommentId || !editingContent.trim()) return;

    const mentions = parseMentions(editingContent, availableUsers);
    onUpdateComment(editingCommentId, editingContent, mentions);

    setEditingCommentId(null);
    setEditingContent("");
  }, [
    editingCommentId,
    editingContent,
    onUpdateComment,
    availableUsers,
    parseMentions,
  ]);

  /**
   * コメント編集キャンセル
   */
  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingContent("");
  }, []);

  /**
   * 返信開始
   */
  const handleStartReply = useCallback((parentCommentId: string) => {
    setReplyingToCommentId(parentCommentId);
    setReplyContent("");
    setReplyMentions([]);
  }, []);

  /**
   * 返信保存
   */
  const handleSaveReply = useCallback(() => {
    if (!replyingToCommentId || !replyContent.trim()) return;

    const mentions = parseMentions(replyContent, availableUsers);
    onReplyComment(replyingToCommentId, replyContent, mentions);

    setReplyingToCommentId(null);
    setReplyContent("");
    setReplyMentions([]);
  }, [
    replyingToCommentId,
    replyContent,
    onReplyComment,
    availableUsers,
    parseMentions,
  ]);

  /**
   * 返信キャンセル
   */
  const handleCancelReply = useCallback(() => {
    setReplyingToCommentId(null);
    setReplyContent("");
    setReplyMentions([]);
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {staffName} - {date}日のコメント
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          {/* 既存コメント一覧 */}
          {comments.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: "auto", mb: 2 }}>
              {comments.map((comment) => (
                <React.Fragment key={comment.id}>
                  <ListItem sx={{ alignItems: "flex-start", py: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: comment.userColor,
                        width: 32,
                        height: 32,
                        mr: 1,
                        fontSize: "0.75rem",
                      }}
                    >
                      {comment.userName[0]}
                    </Avatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {comment.userName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ ml: 1, color: "text.secondary" }}
                          >
                            {new Date(comment.createdAt).toLocaleString(
                              "ja-JP",
                            )}
                          </Typography>
                          {comment.isEdited && (
                            <Typography
                              variant="caption"
                              sx={{ ml: 0.5, color: "text.secondary" }}
                            >
                              (編集済み)
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        editingCommentId === comment.id ? (
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              size="small"
                              variant="outlined"
                            />
                            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={handleSaveEditComment}
                              >
                                保存
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancelEditComment}
                              >
                                キャンセル
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              mt: 0.5,
                            }}
                          >
                            {comment.content}
                          </Typography>
                        )
                      }
                    />

                    {editingCommentId !== comment.id &&
                      currentUserId === comment.userId && (
                        <ListItemSecondaryAction>
                          <Tooltip title="編集">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleStartEditComment(comment)}
                              sx={{ mr: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="削除">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      )}
                  </ListItem>

                  {/* 返信コメント */}
                  {comment.replies && comment.replies.length > 0 && (
                    <Box
                      sx={{ ml: 4, borderLeft: "2px solid #e0e0e0", pl: 1.5 }}
                    >
                      {comment.replies.map((reply) => (
                        <ListItem
                          key={reply.id}
                          sx={{ alignItems: "flex-start", py: 1 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: reply.userColor,
                              width: 28,
                              height: 28,
                              mr: 1,
                              fontSize: "0.65rem",
                            }}
                          >
                            {reply.userName[0]}
                          </Avatar>

                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle2"
                                sx={{ fontSize: "0.875rem" }}
                              >
                                {reply.userName}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.8125rem",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {reply.content}
                              </Typography>
                            }
                          />

                          {currentUserId === reply.userId && (
                            <ListItemSecondaryAction>
                              <Tooltip title="削除">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() =>
                                    onDeleteReply(comment.id, reply.id)
                                  }
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                    </Box>
                  )}

                  {/* 返信ボタン */}
                  {replyingToCommentId !== comment.id && (
                    <Box sx={{ ml: 4, mt: 0.5, mb: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleStartReply(comment.id)}
                        sx={{ textTransform: "none", fontSize: "0.8125rem" }}
                      >
                        返信
                      </Button>
                    </Box>
                  )}

                  {/* 返信入力フォーム */}
                  {replyingToCommentId === comment.id && (
                    <Paper
                      sx={{
                        ml: 4,
                        p: 1.5,
                        bgcolor: "background.default",
                        mb: 1.5,
                      }}
                    >
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="返信を入力..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        size="small"
                        variant="outlined"
                      />
                      <Autocomplete
                        multiple
                        options={userNames}
                        value={replyMentions.map((m) => m.userName)}
                        onChange={(_, newValues) => {
                          const newMentions = newValues.map((name) => {
                            const user = availableUsers.find(
                              (u) => u.userName === name,
                            );
                            return user || { userId: "", userName: name };
                          });
                          setReplyMentions(
                            newMentions as {
                              userId: string;
                              userName: string;
                            }[],
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="メンション"
                            placeholder="メンションを選択"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={`@${option}`}
                              {...getTagProps({ index })}
                              key={option}
                              size="small"
                            />
                          ))
                        }
                      />
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveReply}
                        >
                          返信
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCancelReply}
                        >
                          キャンセル
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              コメントはまだありません
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 新規コメント入力 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              コメントを追加
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="コメントを入力... (@ユーザー名 でメンション可)"
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Autocomplete
              multiple
              options={userNames}
              value={selectedMentions.map((m) => m.userName)}
              onChange={(_, newValues) => {
                const newMentions = newValues.map((name) => {
                  const user = availableUsers.find((u) => u.userName === name);
                  return user || { userId: "", userName: name };
                });
                setSelectedMentions(
                  newMentions as { userId: string; userName: string }[],
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="メンション"
                  placeholder="メンションを選択"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`@${option}`}
                    {...getTagProps({ index })}
                    key={option}
                    size="small"
                  />
                ))
              }
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleAddComment}
          disabled={!newCommentContent.trim()}
        >
          コメント追加
        </Button>
      </DialogActions>
    </Dialog>
  );
};
