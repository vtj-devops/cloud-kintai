import { Redo as RedoIcon, Undo as UndoIcon } from "@mui/icons-material";
import { IconButton, Paper, Tooltip, Typography } from "@mui/material";
import React from "react";

/**
 * 取り消し/やり直しインジケーターのProps
 */
export interface UndoRedoIndicatorProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastUndoDescription?: string;
  lastRedoDescription?: string;
}

/**
 * 取り消し/やり直しインジケーター
 * 編集操作の取り消し・やり直しボタンを表示
 */
export const UndoRedoIndicator: React.FC<UndoRedoIndicatorProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastUndoDescription,
  lastRedoDescription,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        backgroundColor: "background.paper",
        zIndex: 1000,
      }}
    >
      <Tooltip
        title={
          canUndo
            ? lastUndoDescription || "操作を取り消す (Ctrl/Cmd + Z)"
            : "取り消せる操作はありません"
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={onUndo}
            disabled={!canUndo}
            color="primary"
            aria-label="undo"
          >
            <UndoIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Typography variant="caption" color="text.secondary">
        操作履歴
      </Typography>

      <Tooltip
        title={
          canRedo
            ? lastRedoDescription || "操作をやり直す (Ctrl/Cmd + Shift + Z)"
            : "やり直せる操作はありません"
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={onRedo}
            disabled={!canRedo}
            color="primary"
            aria-label="redo"
          >
            <RedoIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
};
