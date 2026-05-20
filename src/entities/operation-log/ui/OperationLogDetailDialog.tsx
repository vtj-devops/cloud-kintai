import {
  formatOperationLogInlineValue,
  getOperationLogDisplaySummary,
  getOperationLogResourceDisplay,
} from "@entities/operation-log/lib/operationLogDisplay";
import { getOperationLogLabel } from "@entities/operation-log/lib/operationLogLabels";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type { OperationLog, Staff } from "@shared/api/graphql/types";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";

import { OperationLogJsonDetails } from "./OperationLogJsonDetails";

interface OperationLogDetailDialogProps {
  log: OperationLog | null;
  open: boolean;
  onClose: () => void;
  staffMap: Record<string, Staff | null>;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function staffLabel(
  prefix: string,
  id: unknown,
  staffMap: Record<string, Staff | null>,
) {
  const idText = formatOperationLogInlineValue(id);
  if (!idText) return `${prefix}: -`;
  if (!isNonEmptyString(id)) return `${prefix}: ${idText}`;
  if (!(id in staffMap)) return `${prefix}: ${idText}`;
  const entry = staffMap[id];
  if (!entry) return `${prefix}: ${idText}`;
  return `${prefix}: ${`${entry.familyName ?? ""} ${entry.givenName ?? ""}`.trim()}`;
}

export function OperationLogDetailDialog({
  log,
  open,
  onClose,
  staffMap,
}: OperationLogDetailDialogProps) {
  if (!log) return null;

  const resourceLabel = getOperationLogResourceDisplay({
    resource: log.resource as unknown,
    resourceId: log.resourceId as unknown,
    resourceKey: log.resourceKey as unknown,
  });
  const summary = getOperationLogDisplaySummary(log);
  const actorText = staffLabel("操作者", log.staffId as unknown, staffMap);
  const targetText = staffLabel(
    "対象スタッフ",
    log.targetStaffId as unknown,
    staffMap,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {log.timestamp
            ? dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss")
            : "-"}
        </Typography>
        <Chip size="small" label={getOperationLogLabel(log.action)} />
        <AppIconButton
          aria-label="閉じる"
          onClick={onClose}
          style={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon fontSize="small" />
        </AppIconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Actor / Target */}
          <Box>
            <Typography variant="body2">{actorText}</Typography>
            <Typography variant="body2">{targetText}</Typography>
          </Box>

          <Divider />

          {/* Resource + Summary */}
          <Box>
            <Typography variant="subtitle2">{resourceLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              {summary}
            </Typography>
          </Box>

          {/* IP / UserAgent */}
          {(isNonEmptyString(log.ipAddress) ||
            isNonEmptyString(log.userAgent)) && (
            <>
              <Divider />
              <Box>
                {isNonEmptyString(log.ipAddress) && (
                  <Typography variant="caption" display="block">
                    IPアドレス: {log.ipAddress}
                  </Typography>
                )}
                {isNonEmptyString(log.userAgent) && (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{
                      fontFamily: "monospace", // User agent string display - monospace for readability
                      wordBreak: "break-all",
                    }}
                  >
                    ユーザーエージェント: {log.userAgent}
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* JSON sections */}
          <OperationLogJsonDetails log={log} className="flex flex-col gap-2" />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
