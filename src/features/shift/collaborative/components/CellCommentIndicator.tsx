import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import { Badge, Box } from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
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
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        opacity: hasComments ? 1 : 0.4,
      }}
    >
      <AppIconButton
        size="sm"
        aria-label="コメント"
        tooltip={hasComments ? `${commentCount}件のコメント` : "コメントを追加"}
        onClick={onClick}
        disabled={disabled}
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
      </AppIconButton>
    </Box>
  );
};

export default CellCommentIndicator;
