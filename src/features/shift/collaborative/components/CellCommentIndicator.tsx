import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import { Badge, Box, IconButton, Tooltip } from "@mui/material";
import React from "react";

interface CellCommentIndicatorProps {
  commentCount: number;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * セルコメントインジケーター
 * コメント有無とコメント数を表示
 */
export const CellCommentIndicator: React.FC<CellCommentIndicatorProps> = ({
  commentCount,
  onClick,
  disabled = false,
}) => {
  const hasComments = commentCount > 0;

  return (
    <Tooltip
      title={hasComments ? `${commentCount}件のコメント` : "コメントを追加"}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          opacity: hasComments ? 1 : 0.4,
        }}
      >
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            p: 0.5,
            "&:hover": {
              bgcolor: "action.hover",
              opacity: 1,
            },
          }}
        >
          <Badge
            badgeContent={commentCount}
            color="primary"
            overlap="circular"
            variant="standard"
          >
            <MessageOutlinedIcon
              fontSize="small"
              sx={{ color: "primary.main" }}
            />
          </Badge>
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default CellCommentIndicator;
