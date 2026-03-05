import useAppConfig from "@entities/app-config/model/useAppConfig";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Button,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import StatusChip from "@shared/ui/chips/StatusChip";
import {
  ComponentType,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import {
  CATEGORY_LABELS,
  getWorkflowCategoryLabel,
  STATUS_LABELS,
} from "@/entities/workflow/lib/workflowLabels";
import { useSplitView } from "@/features/splitView";

import WorkflowCarouselDialog from "./components/WorkflowCarouselDialog";
import WorkflowDetailPanel from "./components/WorkflowDetailPanel";

const STATUS_ALL_VALUE = "__ALL__";
const STATUS_EXCLUDED_FROM_DEFAULT: WorkflowStatus[] = [
  WorkflowStatus.CANCELLED,
  WorkflowStatus.APPROVED,
];

export default function AdminWorkflow() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { workflows, loading, error, fetchWorkflows } = useWorkflows({
    isAuthenticated,
  });
  const { config, getAbsentEnabled, getWorkflowCategoryOrder } = useAppConfig();
  const {
    staffs,
    loading: staffLoading,
    error: staffError,
  } = useStaffs({ isAuthenticated });
  const { enableSplitMode, setRightPanel } = useSplitView();
  const navigate = useNavigate();

  // フィルター/ページネーション state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [statusInitialized, setStatusInitialized] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );

  const categories = useMemo(
    () =>
      getWorkflowCategoryOrder()
        .filter((item) => item.enabled)
        .filter(
          (item) =>
            item.category !== WorkflowCategory.ABSENCE || getAbsentEnabled(),
        ),
    [config, getAbsentEnabled, getWorkflowCategoryOrder],
  );

  // 利用可能なステータスをワークフローから抽出
  const statuses = Array.from(
    new Set((workflows || []).map((w) => w.status).filter(Boolean)),
  ) as Array<WorkflowStatus>;

  useEffect(() => {
    if (statusInitialized) return;
    if (statuses.length === 0) return;

    const initialStatuses = statuses.filter(
      (s) => !STATUS_EXCLUDED_FROM_DEFAULT.includes(s),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter(initialStatuses);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusInitialized(true);
  }, [statuses, statusInitialized]);

  // フィルタ適用
  const filteredWorkflows = (workflows || []).filter((w) => {
    if (categoryFilter && w.category !== categoryFilter) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(w.status))
      return false;
    return true;
  });

  // 作成日で降順にソートしてからページネーションを適用
  const sortedWorkflows = filteredWorkflows.toSorted((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at; // 降順
  });

  const paginatedWorkflows = sortedWorkflows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const workflowsById = new Map(
    sortedWorkflows.map((workflow) => [workflow.id, workflow]),
  );

  const staffNamesById = useMemo(
    () =>
      new Map(
        staffs.map((staff) => [
          staff.id,
          `${staff.familyName || ""}${staff.givenName || ""}` || "不明",
        ]),
      ),
    [staffs],
  );

  const filteredWorkflowIds = sortedWorkflows.map((workflow) => workflow.id);

  // ページングリセット: フィルター変更時にページを先頭に戻す
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [categoryFilter, statusFilter]);

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextValue = typeof value === "string" ? value.split(",") : value;

    if (nextValue.includes(STATUS_ALL_VALUE)) {
      setStatusFilter([]);
      return;
    }

    setStatusFilter(nextValue);
  };

  const createWorkflowPanelComponent = useCallback(
    (workflowId: string): ComponentType<{ panelId: string }> => {
      const WorkflowPanel = () => (
        <WorkflowDetailPanel workflowId={workflowId} />
      );
      WorkflowPanel.displayName = `WorkflowPanel_${workflowId}`;
      return WorkflowPanel;
    },
    [],
  );

  const handleOpenInRightPanel = (workflowId: string) => {
    const workflow = workflowsById.get(workflowId);
    enableSplitMode();
    setRightPanel({
      id: `workflow-${workflowId}`,
      title: `申請内容 - ${workflow?.createdAt?.split("T")[0] ?? workflowId}`,
      component: createWorkflowPanelComponent(workflowId),
    });
  };

  const handleOpenCarousel = () => {
    if (filteredWorkflowIds.length === 0) return;
    setSelectedWorkflowId(filteredWorkflowIds[0]);
    setIsCarouselOpen(true);
  };

  if (loading || staffLoading) return <LinearProgress />;
  if (error || staffError)
    return (
      <Typography>
        データ取得中に問題が発生しました。管理者に連絡してください。
      </Typography>
    );

  return (
    <Container maxWidth="xl" sx={{ height: 1, pt: 2 }}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          ワークフローの一覧を表示します。管理者用の画面です。
        </Typography>

        {/* フィルター */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
            <InputLabel id="category-filter-label">種別</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              label="種別"
              onChange={(e) => setCategoryFilter(String(e.target.value))}
            >
              <MenuItem value="">すべて</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.category} value={c.category}>
                  {CATEGORY_LABELS[c.category] || c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { sm: 160 } }}>
            <InputLabel id="status-filter-label">ステータス</InputLabel>
            <Select
              labelId="status-filter-label"
              multiple
              value={statusFilter}
              label="ステータス"
              onChange={handleStatusChange}
              renderValue={(selected) =>
                selected.length === 0
                  ? "すべて"
                  : selected
                      .map(
                        (s) =>
                          STATUS_LABELS[String(s) as WorkflowStatus] ||
                          String(s),
                      )
                      .join("、")
              }
            >
              <MenuItem value={STATUS_ALL_VALUE}>すべて</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={String(s)} value={String(s)}>
                  {STATUS_LABELS[String(s) as WorkflowStatus] || String(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            mb={2}
          >
            <Typography variant="body2" color="text.secondary">
              {filteredWorkflows.length} 件の申請
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenCarousel}
              disabled={filteredWorkflowIds.length === 0}
            >
              まとめて確認
            </Button>
          </Stack>

          {isMobile ? (
            <Stack spacing={1.5}>
              {paginatedWorkflows.map((w) => {
                const staff = staffs.find((s) => s.id === w.staffId);
                const staffName = staff
                  ? `${staff.familyName || ""}${staff.givenName || ""}`
                  : w.staffId || "不明";
                const categoryLabel = getWorkflowCategoryLabel(w);

                return (
                  <Paper
                    key={w.id}
                    variant="outlined"
                    onClick={() => navigate(`/admin/workflow/${w.id}`)}
                    sx={{ p: 1.5, cursor: "pointer" }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">
                          {categoryLabel}
                        </Typography>
                        <Tooltip title="右側で開く">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenInRightPanel(w.id);
                            }}
                          >
                            <OpenInNewOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <Typography variant="body2">{staffName}</Typography>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <StatusChip status={w.status} />
                        <Typography variant="caption" color="text.secondary">
                          {w.createdAt ? w.createdAt.split("T")[0] : ""}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "50px" }} />
                    <TableCell>種別</TableCell>
                    <TableCell>申請者</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>作成日</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedWorkflows.map((w) => {
                    const staff = staffs.find((s) => s.id === w.staffId);
                    const staffName = staff
                      ? `${staff.familyName || ""}${staff.givenName || ""}`
                      : w.staffId || "不明";
                    const categoryLabel = getWorkflowCategoryLabel(w);

                    return (
                      <TableRow
                        key={w.id}
                        hover
                        onClick={() => navigate(`/admin/workflow/${w.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell
                          sx={{ width: "50px", padding: "8px 4px" }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title="右側で開く">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenInRightPanel(w.id)}
                            >
                              <OpenInNewOutlinedIcon
                                sx={{ fontSize: "18px" }}
                              />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{categoryLabel}</TableCell>
                        <TableCell>{staffName}</TableCell>
                        <TableCell>
                          <StatusChip status={w.status} />
                        </TableCell>
                        <TableCell>
                          {w.createdAt ? w.createdAt.split("T")[0] : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={filteredWorkflows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={isMobile ? [10] : [10, 25, 50]}
          />
        </Paper>

        {selectedWorkflowId && (
          <WorkflowCarouselDialog
            open={isCarouselOpen}
            onClose={() => {
              setIsCarouselOpen(false);
              setSelectedWorkflowId(null);
            }}
            selectedWorkflowId={selectedWorkflowId}
            filteredWorkflowIds={filteredWorkflowIds}
            workflowsById={workflowsById}
            staffNamesById={staffNamesById}
            onOpenInRightPanel={(workflowId) => {
              handleOpenInRightPanel(workflowId);
              setIsCarouselOpen(false);
            }}
            enableApprovalActions
            onWorkflowActionCompleted={fetchWorkflows}
          />
        )}
      </Stack>
    </Container>
  );
}
