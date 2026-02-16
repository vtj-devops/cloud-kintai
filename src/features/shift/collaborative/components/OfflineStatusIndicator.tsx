import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Alert, Box, Chip, Snackbar } from "@mui/material";
import React, { useState } from "react";

import { useOfflineSync } from "../hooks/useOfflineSync";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface OfflineStatusIndicatorProps {
  showLabel?: boolean;
  maxRetries?: number;
}

/**
 * オフラインステータスインジケーターコンポーネント
 * ネットワーク状態と未送信変更の数を表示
 */
export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  showLabel = true,
  maxRetries = 3,
}) => {
  const isOnline = useOnlineStatus();
  const { hasPendingChanges, pendingChangesCount } = useOfflineSync({
    enabled: false, // UIの表示のみ使用
    onSyncPendingChanges: async () => ({ successful: [], conflicts: [] }),
    maxRetries,
  });

  const [showAlert, setShowAlert] = useState(!isOnline);

  return (
    <>
      {/* ステータスチップ */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {isOnline ? (
          hasPendingChanges ? (
            <Chip
              icon={<CloudUploadIcon />}
              label={showLabel ? `同期中 (${pendingChangesCount})` : undefined}
              color="warning"
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<CloudDoneIcon />}
              label={showLabel ? "オンライン" : undefined}
              color="success"
              size="small"
              variant="outlined"
            />
          )
        ) : (
          <Chip
            icon={<CloudOffIcon />}
            label={
              showLabel ? `オフライン (${pendingChangesCount}件)` : undefined
            }
            color="error"
            size="small"
            variant="filled"
          />
        )}
      </Box>

      {/* オフラインアラート */}
      <Snackbar
        open={!isOnline && showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setShowAlert(false)}
          severity="warning"
          sx={{ width: "100%" }}
        >
          インターネット接続がありません。変更内容は自動保存されます。
          {hasPendingChanges && <> ({pendingChangesCount}件の変更が待機中)</>}
        </Alert>
      </Snackbar>
    </>
  );
};
