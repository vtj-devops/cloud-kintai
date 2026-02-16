import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Staff } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

import { getOperationLogLabel } from "@/entities/operation-log/lib/operationLogLabels";
import useAdminOperationLogs from "@/hooks/useAdminOperationLogs/useAdminOperationLogs";

export default function AdminLogsClean() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { logs, loading, error, nextToken, loadInitial, loadMore } =
    useAdminOperationLogs(30);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadInitial().catch(() => {});
  }, [loadInitial]);

  const [staffMap, setStaffMap] = useState<Record<string, Staff | null>>({});

  useEffect(() => {
    const ids = Array.from(
      new Set(logs.map((l) => l.staffId).filter((id): id is string => !!id))
    );
    const missing = ids.filter((id) => !(id in staffMap));
    if (missing.length === 0) return;

    (async () => {
      try {
        const results = await Promise.allSettled(
          missing.map((id) => fetchStaff(id))
        );
        const updates: Record<string, Staff | null> = {};
        results.forEach((r, idx) => {
          const id = missing[idx];
          if (r.status === "fulfilled" && r.value) {
            updates[id] = r.value as Staff;
          } else {
            // treat fulfilled-but-empty and rejected results as null
            updates[id] = null;
          }
        });
        setStaffMap((prev) => ({ ...prev, ...updates }));
      } catch {
        // ignore; best-effort
      }
    })();
  }, [logs]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && nextToken && !loading) {
            loadMore().catch(() => {});
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [nextToken, loadMore, loading]);

  return (
    <Container maxWidth="xl">
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Stack spacing={1}>
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              最新の 30
              件を表示します。スクロールで過去のログを順次読み込みます。
            </Typography>

            <List>
              {logs.map((log) => (
                <ListItem
                  key={log.id}
                  divider
                  alignItems="flex-start"
                  sx={{
                    py: 1.5,
                    px: { xs: 0, sm: 1 },
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  {/* 日時 + アクション */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      width: { xs: "100%", sm: 320 },
                      minWidth: { xs: 0, sm: 320 },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: { xs: 0.5, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap={!isMobile}
                      title={
                        log.timestamp
                          ? dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss")
                          : undefined
                      }
                      sx={{ display: "block" }}
                    >
                      {log.timestamp
                        ? dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss")
                        : "-"}
                    </Typography>
                    <Chip
                      size="small"
                      label={getOperationLogLabel(log.action)}
                      sx={{ ml: { xs: 0, sm: 1 } }}
                    />
                  </Box>

                  {/* スタッフ名を独立列として表示 */}
                  <Box
                    sx={{
                      width: { xs: "100%", sm: 240 },
                      minWidth: { xs: 0, sm: 240 },
                      ml: { xs: 0, sm: 2 },
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {(() => {
                        if (!log.staffId) return "スタッフ情報なし";
                        // key exists in map means we've attempted to fetch (may be null on failure)
                        if (!(log.staffId in staffMap)) return "読み込み中...";
                        const entry = staffMap[log.staffId];
                        if (entry === null) return `スタッフ: ${log.staffId}`;
                        return `${entry!.familyName ?? ""} ${
                          entry!.givenName ?? ""
                        }`.trim();
                      })()}
                    </Typography>
                  </Box>

                  {/* リソース情報 */}
                  <Box sx={{ flex: 1, ml: { xs: 0, sm: 2 }, width: { xs: "100%", sm: "auto" } }}>
                    <Typography variant="subtitle2" sx={{ wordBreak: "break-word" }}>
                      {log.resource ?? "(no resource)"} {log.resourceId ?? ""}
                    </Typography>
                  </Box>

                  {/* 詳細 */}
                  <Box
                    sx={{
                      width: { xs: "100%", sm: "40%" },
                      minWidth: { xs: 0, sm: 240 },
                      ml: { xs: 0, sm: 2 },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {log.details ?? ""}
                    </Typography>

                    {log.userAgent && (
                      <Tooltip title={log.userAgent} placement="top-start">
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            mt: 1,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: { xs: "normal", sm: "nowrap" },
                            wordBreak: "break-word",
                          }}
                        >
                          {log.userAgent.length > 140
                            ? `${log.userAgent.slice(0, 137)}...`
                            : log.userAgent}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && <Typography color="error">{error.message}</Typography>}

            {/* sentinel for infinite scroll */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {!nextToken && !loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                これ以上ログはありません。
              </Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
