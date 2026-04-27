import {
  formatOperationLogInlineValue,
  getOperationLogDisplaySummary,
  getOperationLogResourceDisplay,
} from "@entities/operation-log/lib/operationLogDisplay";
import { getOperationLogLabel } from "@entities/operation-log/lib/operationLogLabels";
import useAdminOperationLogs from "@entities/operation-log/model/useAdminOperationLogs";
import { OperationLogDetailDialog } from "@entities/operation-log/ui/OperationLogDetailDialog";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import fetchStaffs from "@entities/staff/model/useStaffs/fetchStaffs";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ModelOperationLogFilterInput,
  OperationLog,
  Staff,
} from "@shared/api/graphql/types";
import { AppIconButton } from "@shared/ui/button";
import { PageContent } from "@shared/ui/layout";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

type StaffOption = {
  label: string;
  value: string;
};

const resolveStaffDisplay = (
  id: unknown,
  staffMap: Record<string, Staff | null>,
) => {
  const idText = formatOperationLogInlineValue(id);

  if (!idText) {
    return "-";
  }

  if (!isNonEmptyString(id)) {
    return idText;
  }

  if (!(id in staffMap)) {
    return "読み込み中...";
  }

  const entry = staffMap[id];
  if (entry === null) {
    return idText;
  }

  const fullName =
    `${entry?.familyName ?? ""} ${entry?.givenName ?? ""}`.trim();
  return fullName || idText;
};

export default function AdminLogsClean() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [resourceFilter, setResourceFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffListLoading, setStaffListLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchStaffs()
      .then((staffs) => {
        if (!active) {
          return;
        }

        setStaffList(staffs);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setStaffListLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const staffOptions = useMemo<StaffOption[]>(
    () =>
      staffList
        .filter((staff) => isNonEmptyString(staff.cognitoUserId))
        .map((staff) => {
          const fullName =
            `${staff.familyName ?? ""} ${staff.givenName ?? ""}`.trim();

          return {
            label: fullName || staff.cognitoUserId,
            value: staff.cognitoUserId,
          };
        }),
    [staffList],
  );

  const operationLogFilter =
    useMemo<ModelOperationLogFilterInput | null>(() => {
      const filter: ModelOperationLogFilterInput = {};

      if (resourceFilter.trim()) {
        filter.resource = { eq: resourceFilter.trim() };
      }

      if (actorFilter.trim()) {
        filter.staffId = { eq: actorFilter.trim() };
      }

      if (targetFilter.trim()) {
        filter.targetStaffId = { eq: targetFilter.trim() };
      }

      if (actionFilter.trim()) {
        filter.action = { contains: actionFilter.trim() };
      }

      if (fromDate || toDate) {
        const from = fromDate
          ? dayjs(fromDate).startOf("day").toISOString()
          : "1970-01-01T00:00:00.000Z";
        const to = toDate
          ? dayjs(toDate).endOf("day").toISOString()
          : "9999-12-31T23:59:59.999Z";
        filter.timestamp = { between: [from, to] };
      }

      return Object.keys(filter).length > 0 ? filter : null;
    }, [
      actionFilter,
      actorFilter,
      fromDate,
      resourceFilter,
      targetFilter,
      toDate,
    ]);
  const {
    logs,
    excludedInvalidRecords,
    excludedInvalidRecordCount,
    loading,
    error,
    nextToken,
    loadInitial,
    loadMore,
  } = useAdminOperationLogs(30, operationLogFilter);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadInitial().catch(() => {});
  }, [loadInitial]);

  const [staffMap, setStaffMap] = useState<Record<string, Staff | null>>({});
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        logs
          .flatMap((log) => [log.staffId, log.targetStaffId])
          .filter(isNonEmptyString),
      ),
    );
    const missing = ids.filter((id) => !(id in staffMap));
    if (missing.length === 0) return;

    (async () => {
      try {
        const results = await Promise.allSettled(
          missing.map((id) => fetchStaff(id)),
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
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [nextToken, loadMore, loading]);

  const logRows = useMemo(
    () =>
      logs.map((log, index) => ({
        rowKey: `${log.id}-${log.timestamp ?? ""}-${index}`,
        log,
        timestampDisplay: log.timestamp
          ? dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss")
          : "-",
        actionLabel: getOperationLogLabel(log.action),
        actorDisplay: resolveStaffDisplay(log.staffId as unknown, staffMap),
        targetDisplay: resolveStaffDisplay(
          log.targetStaffId as unknown,
          staffMap,
        ),
        resourceDisplay: getOperationLogResourceDisplay({
          resource: log.resource as unknown,
          resourceId: log.resourceId as unknown,
          resourceKey: log.resourceKey as unknown,
        }),
        summaryDisplay: getOperationLogDisplaySummary(log),
      })),
    [logs, staffMap],
  );

  return (
    <PageContent width="full">
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Stack spacing={1}>
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                label="リソース"
                value={resourceFilter}
                onChange={(event) => setResourceFilter(event.target.value)}
              />
              <Autocomplete
                size="small"
                options={staffOptions}
                value={
                  staffOptions.find((option) => option.value === actorFilter) ??
                  null
                }
                loading={staffListLoading}
                onChange={(_, newValue) =>
                  setActorFilter(newValue?.value ?? "")
                }
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                getOptionLabel={(option) => option.label}
                sx={{ minWidth: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="操作者"
                    placeholder="スタッフ名で検索"
                  />
                )}
              />
              <Autocomplete
                size="small"
                options={staffOptions}
                value={
                  staffOptions.find(
                    (option) => option.value === targetFilter,
                  ) ?? null
                }
                loading={staffListLoading}
                onChange={(_, newValue) =>
                  setTargetFilter(newValue?.value ?? "")
                }
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                getOptionLabel={(option) => option.label}
                sx={{ minWidth: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="対象者"
                    placeholder="スタッフ名で検索"
                  />
                )}
              />
              <TextField
                size="small"
                label="アクション"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label="開始日"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="終了日"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Typography variant="body2" sx={{ mb: 2 }}>
              新形式ログを新しい順に表示します。詳細は各行の JSON
              パネルから確認できます。
            </Typography>

            {excludedInvalidRecords && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                一部の無効なログレコードを除外して表示しています
                {excludedInvalidRecordCount > 0
                  ? `（少なくとも ${excludedInvalidRecordCount} 件）`
                  : "。"}
              </Typography>
            )}

            {isMobile ? (
              <List sx={{ py: 0 }}>
                {logRows.map((row) => (
                  <ListItem
                    key={row.rowKey}
                    divider
                    alignItems="flex-start"
                    sx={{ px: 0, py: 1.5 }}
                  >
                    <Stack spacing={1} sx={{ width: "100%" }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Typography variant="caption" color="text.secondary">
                          {row.timestampDisplay}
                        </Typography>
                        <Chip size="small" label={row.actionLabel} />
                      </Stack>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          操作者
                        </Typography>
                        <Typography variant="body2">
                          {row.actorDisplay}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          対象者
                        </Typography>
                        <Typography variant="body2">
                          {row.targetDisplay}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          対象
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {row.resourceDisplay}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          概要
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.summaryDisplay}
                        </Typography>
                      </Box>

                      <Box sx={{ alignSelf: "flex-end" }}>
                        <Tooltip title="詳細を表示">
                          <AppIconButton
                            aria-label="詳細を表示"
                            onClick={() => setSelectedLog(row.log)}
                          >
                            <InfoOutlinedIcon fontSize="small" />
                          </AppIconButton>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <TableContainer>
                <Table
                  aria-label="operation-log-table"
                  size="small"
                  sx={{ tableLayout: "fixed" }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 180 }}>日時</TableCell>
                      <TableCell sx={{ width: 120 }}>アクション</TableCell>
                      <TableCell sx={{ width: 170 }}>操作者</TableCell>
                      <TableCell sx={{ width: 170 }}>対象者</TableCell>
                      <TableCell sx={{ width: 240 }}>対象</TableCell>
                      <TableCell>概要</TableCell>
                      <TableCell align="center" sx={{ width: 72 }}>
                        詳細
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logRows.map((row) => (
                      <TableRow key={row.rowKey} hover>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Typography variant="caption" color="text.secondary">
                            {row.timestampDisplay}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Chip size="small" label={row.actionLabel} />
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Tooltip title={row.actorDisplay}>
                            <Typography variant="body2" noWrap>
                              {row.actorDisplay}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Tooltip title={row.targetDisplay}>
                            <Typography variant="body2" noWrap>
                              {row.targetDisplay}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Tooltip title={row.resourceDisplay}>
                            <Typography variant="subtitle2" noWrap>
                              {row.resourceDisplay}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>
                          <Tooltip title={row.summaryDisplay}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {row.summaryDisplay}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ verticalAlign: "top" }}>
                          <Tooltip title="詳細を表示">
                            <AppIconButton
                              aria-label="詳細を表示"
                              onClick={() => setSelectedLog(row.log)}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </AppIconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

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

          <OperationLogDetailDialog
            log={selectedLog}
            open={selectedLog !== null}
            onClose={() => setSelectedLog(null)}
            staffMap={staffMap}
          />
        </Stack>
      </Stack>
    </PageContent>
  );
}
