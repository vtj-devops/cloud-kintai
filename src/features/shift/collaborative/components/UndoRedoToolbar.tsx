import {
  HelpOutline as HelpOutlineIcon,
  History as HistoryIcon,
  Redo as RedoIcon,
  Undo as UndoIcon,
} from "@mui/icons-material";
import PrintIcon from "@mui/icons-material/Print";
import { Divider, IconButton, Paper, Stack, Tooltip } from "@mui/material";
import React from "react";

/**
 * 取り消し/やり直しツールバーのProps
 */
export interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastUndoDescription?: string;
  lastRedoDescription?: string;
  showHistory: boolean;
  onToggleHistory: () => void;
  onShowHelp?: () => void;
  onPrint?: () => void;
}

/**
 * 取り消し/やり直しツールバー
 * 見出しの下に配置するツールバー
 */
export const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastUndoDescription,
  lastRedoDescription,
  showHistory,
  onToggleHistory,
  onShowHelp,
  onPrint,
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        mb: 2,
        p: 1,
      }}
    >
      <Stack direction="row" spacing={0} alignItems="center">
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

        <Tooltip title={showHistory ? "変更履歴を非表示" : "変更履歴を表示"}>
          <IconButton
            size="small"
            onClick={onToggleHistory}
            color={showHistory ? "primary" : "default"}
            aria-label="toggle history"
            sx={{ ml: 1 }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>

        {onPrint && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
            <Tooltip title="シフト調整表を印刷">
              <IconButton
                size="small"
                onClick={onPrint}
                color="primary"
                aria-label="print"
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {onShowHelp && (
          <Tooltip title="ヘルプ">
            <IconButton
              size="small"
              onClick={onShowHelp}
              color="default"
              aria-label="show help"
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};
