import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Chip,
  IconButton,
  List,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useMemo } from "react";

import { CellComment, CommentsMap } from "../types/collaborative.types";

interface CommentsListProps {
  allComments: CommentsMap;
  currentUserId: string;
  onCommentClick?: (cellKey: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditComment?: (comment: CellComment) => void;
  maxHeight?: string | number;
}

/**
 * コメント一覧パネル
 * 全セルのコメントを一覧表示
 */
export const CommentsList: React.FC<CommentsListProps> = ({
  allComments,
  currentUserId,
  onCommentClick,
  onDeleteComment,
  onEditComment,
  maxHeight = 500,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  /**
   * フラット化されたコメント一覧
   */
  const flattenedComments = useMemo(() => {
    const comments: Array<CellComment & { cellKey: string }> = [];
    allComments.forEach((cellComments, cellKey) => {
      cellComments.forEach((comment) => {
        comments.push({
          ...comment,
          cellKey,
        });
        // 返信も追加
        if (comment.replies) {
          comment.replies.forEach((reply) => {
            comments.push({
              ...reply,
              cellKey,
            });
          });
        }
      });
    });
    return comments;
  }, [allComments]);

  /**
   * フィルタリング
   */
  const filteredComments = useMemo(() => {
    if (!searchQuery.trim()) {
      return flattenedComments;
    }

    const query = searchQuery.toLowerCase();
    return flattenedComments.filter(
      (comment) =>
        comment.content.toLowerCase().includes(query) ||
        comment.userName.toLowerCase().includes(query) ||
        comment.cellKey.toLowerCase().includes(query),
    );
  }, [flattenedComments, searchQuery]);

  const totalCommentCount = flattenedComments.length;

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="コメント一覧"
        subheader={`全 ${totalCommentCount} 件`}
        action={
          <Chip
            label={`${totalCommentCount}`}
            variant="outlined"
            size="small"
            color={totalCommentCount > 0 ? "primary" : "default"}
          />
        }
      />

      <Box
        sx={{
          px: 2,
          pb: 1,
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          size="small"
          placeholder="コメント検索..."
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          maxHeight,
          overflow: "auto",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        {filteredComments.length > 0 ? (
          <List sx={{ p: 1 }}>
            {filteredComments.map((comment) => (
              <Paper
                key={`${comment.id}-${comment.cellKey}`}
                elevation={0}
                sx={{
                  mb: 1,
                  p: 1.5,
                  bgcolor: "background.default",
                  border: "1px solid #e0e0e0",
                  cursor: onCommentClick ? "pointer" : "default",
                  "&:hover": onCommentClick
                    ? {
                        bgcolor: "action.hover",
                        borderColor: "primary.main",
                      }
                    : {},
                }}
                onClick={() => onCommentClick?.(comment.cellKey)}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Avatar
                    sx={{
                      bgcolor: comment.userColor,
                      width: 32,
                      height: 32,
                      mr: 1,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    {comment.userName[0]}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* ヘッダー */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comment.cellKey}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString("ja-JP")}
                      </Typography>
                    </Box>

                    {/* コンテンツ */}
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        mb: 0.5,
                      }}
                    >
                      {comment.content}
                    </Typography>

                    {/* メンション */}
                    {comment.mentions && comment.mentions.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                          mt: 0.5,
                        }}
                      >
                        {comment.mentions.map((mention) => (
                          <Chip
                            key={mention.userId}
                            label={`@${mention.userName}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* アクション */}
                  {currentUserId === comment.userId && (
                    <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                      {onEditComment && (
                        <Tooltip title="編集">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditComment(comment);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDeleteComment && (
                        <Tooltip title="削除">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteComment(comment.id);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? "コメントが見つかりません"
                : "コメントはまだありません"}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default CommentsList;
