import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

import { ConflictInfo, MergeStrategy } from "../hooks/useOfflineSync";

interface ConflictResolutionDialogProps {
  open: boolean;
  conflicts: ConflictInfo[];
  onResolve: (
    changeId: string,
    strategy: MergeStrategy,
  ) => Promise<void> | void;
  onClose: () => void;
}

/**
 * コンフリクト解決ダイアログ
 * オフライン中の変更とサーバーのデータが競合した場合に表示
 */
export const ConflictResolutionDialog: React.FC<
  ConflictResolutionDialogProps
> = ({ open, conflicts, onResolve, onClose }) => {
  const [resolving, setResolving] = React.useState(false);

  const handleResolve = async (changeId: string, strategy: MergeStrategy) => {
    setResolving(true);
    try {
      await onResolve(changeId, strategy);
    } finally {
      setResolving(false);
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <WarningIcon color="warning" />
          <Typography variant="h6">コンフリクトが発生しました</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            オフライン中に変更した内容がサーバーのデータと競合しています。
            どの版を優先するかを選択してください。
          </Typography>

          {conflicts.map((conflict, index) => (
            <Paper key={conflict.changeId} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight="bold">
                  コンフリクト {index + 1}
                </Typography>

                {/* ローカル版 */}
                <Box>
                  <Chip
                    label="ローカル版（あなたの変更）"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                  <Box
                    sx={{
                      bgcolor: "action.hover",
                      p: 1,
                      borderRadius: 1,
                      fontSize: "0.875rem",
                    }}
                  >
                    <Typography variant="caption">
                      スタッフID: {conflict.localUpdate.staffId}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      日付: {conflict.localUpdate.date}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      状態: {conflict.localUpdate.newState || "変更なし"}
                    </Typography>
                  </Box>
                </Box>

                {/* リモート版 */}
                {conflict.remoteUpdate && (
                  <Box>
                    <Chip
                      label="サーバー版（他のユーザーの変更）"
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ mb: 0.5 }}
                    />
                    <Box
                      sx={{
                        bgcolor: "action.hover",
                        p: 1,
                        borderRadius: 1,
                        fontSize: "0.875rem",
                      }}
                    >
                      <Typography variant="caption">
                        スタッフID: {conflict.remoteUpdate.staffId}
                      </Typography>
                      <br />
                      <Typography variant="caption">
                        日付: {conflict.remoteUpdate.date}
                      </Typography>
                      <br />
                      <Typography variant="caption">
                        状態: {conflict.remoteUpdate.newState || "変更なし"}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* アクション */}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={resolving}
                    onClick={() => handleResolve(conflict.changeId, "local")}
                    fullWidth
                  >
                    ローカル版を採用
                  </Button>
                  {conflict.remoteUpdate && (
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={resolving}
                      onClick={() => handleResolve(conflict.changeId, "remote")}
                      fullWidth
                    >
                      サーバー版を採用
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={resolving}>
          後で解決
        </Button>
      </DialogActions>
    </Dialog>
  );
};
