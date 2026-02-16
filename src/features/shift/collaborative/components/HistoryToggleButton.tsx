import { HistoryToggleOff as HistoryIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";

/**
 * 変更履歴表示トグルボタンのProps
 */
export interface HistoryToggleButtonProps {
  showHistory: boolean;
  onToggle: () => void;
}

/**
 * 変更履歴表示トグルボタン
 * ツールバー内に配置して履歴パネルの表示/非表示を切り替える
 */
export const HistoryToggleButton: React.FC<HistoryToggleButtonProps> = ({
  showHistory,
  onToggle,
}) => {
  return (
    <Tooltip title={showHistory ? "変更履歴を非表示" : "変更履歴を表示"}>
      <IconButton
        size="small"
        onClick={onToggle}
        color={showHistory ? "primary" : "default"}
        aria-label="toggle history"
      >
        <HistoryIcon />
      </IconButton>
    </Tooltip>
  );
};
