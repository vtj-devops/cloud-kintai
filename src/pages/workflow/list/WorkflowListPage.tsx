import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowClassNameParams,
  type GridRowParams,
  type GridValueFormatter,
} from "@mui/x-data-grid";
import { WorkflowStatus } from "@shared/api/graphql/types";
import StatusChip from "@shared/ui/chips/StatusChip";
import Page from "@shared/ui/page/Page";
import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { STATUS_LABELS } from "@/entities/workflow/lib/workflowLabels";
import {
  useWorkflowListViewModel,
  type WorkflowListViewModel,
} from "@/features/workflow/list/useWorkflowListViewModel";
import type { WorkflowListItem } from "@/features/workflow/list/workflowListModel";
import { designTokenVar } from "@/shared/designSystem";
import { dashboardInnerSurfaceSx, PageSection } from "@/shared/ui/layout";

import WorkflowListFilters, {
  type WorkflowListFiltersHandle,
  WorkflowListFiltersPanel,
} from "./components/WorkflowListFilters";

const CANCELLED_LABEL = STATUS_LABELS[WorkflowStatus.CANCELLED];

const LOADING_SECTION_MIN_HEIGHT = `calc(${designTokenVar(
  "spacing.xxl",
  "32px"
)} * 7.5)`;
const FILTER_ACTION_GAP = `calc(${designTokenVar("spacing.md", "12px")} * 0.5)`;
const EMPTY_STATE_PADDING_Y = designTokenVar("spacing.lg", "16px");
const DATA_GRID_HEIGHT_SPACING_UNITS = 130;
const DATA_GRID_ROW_HEIGHT_SPACING_UNITS = 14;
const MOBILE_CARD_GAP = designTokenVar("spacing.md", "12px");
const MOBILE_CARD_PADDING = designTokenVar("spacing.lg", "16px");
const MOBILE_CARD_RADIUS = designTokenVar("radius.lg", "16px");
const MOBILE_META_GAP = designTokenVar("spacing.xs", "4px");
const MOBILE_ACTION_GAP = designTokenVar("spacing.sm", "8px");
const MOBILE_EMPTY_PADDING = designTokenVar("spacing.xl", "24px");
const MOBILE_FILTER_RADIUS = designTokenVar("radius.lg", "16px");
const MOBILE_FILTER_PADDING_X = designTokenVar("spacing.md", "12px");
const MOBILE_FILTER_PADDING_Y = designTokenVar("spacing.sm", "8px");
const MOBILE_FILTER_BADGE_PADDING = designTokenVar("spacing.xs", "4px");
const MOBILE_FILTER_BADGE_RADIUS = designTokenVar("radius.md", "12px");

const formatWorkflowDateValue = (value?: string) => value ?? "-";

const formatWorkflowDate: GridValueFormatter<
  WorkflowListItem,
  string | undefined,
  string,
  string | undefined
> = (value) => formatWorkflowDateValue(value);

export default function WorkflowListPage() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const spacingToNumber = useCallback(
    (units: number) => parseFloat(theme.spacing(units)),
    [theme]
  );
  const dataGridContainerHeight = useMemo(
    () => theme.spacing(DATA_GRID_HEIGHT_SPACING_UNITS),
    [theme]
  );
  const dataGridRowHeight = useMemo(
    () => spacingToNumber(DATA_GRID_ROW_HEIGHT_SPACING_UNITS),
    [spacingToNumber]
  );
  const navigate = useNavigate();

  const {
    isAuthenticated,
    currentStaffId,
    loading,
    error,
    filteredItems,
    filters,
    anyFilterActive,
    setFilter,
    clearFilters,
  }: WorkflowListViewModel = useWorkflowListViewModel();
  const filterRowRef = useRef<WorkflowListFiltersHandle>(null);

  const columns = useMemo<GridColDef<WorkflowListItem>[]>(
    () => [
      {
        field: "category",
        headerName: "種別",
        flex: 1,
        minWidth: 140,
        sortable: false,
      },
      {
        field: "applicationDate",
        headerName: "申請日",
        flex: 1,
        minWidth: 160,
        sortable: false,
        valueFormatter: formatWorkflowDate,
      },
      {
        field: "status",
        headerName: "ステータス",
        flex: 1,
        minWidth: 160,
        sortable: false,
        renderCell: (
          params: GridRenderCellParams<WorkflowListItem, string | undefined>
        ) => <StatusChip status={params.row.rawStatus || params.value || ""} />,
      },
      {
        field: "createdAt",
        headerName: "作成日",
        flex: 1,
        minWidth: 160,
        sortable: false,
      },
    ],
    []
  );

  const resolveWorkflowKey = useCallback((row: WorkflowListItem) => {
    return row.rawId ? row.rawId : `${row.name}-${row.createdAt}`;
  }, []);

  const handleRowClick = useCallback(
    (params: GridRowParams<WorkflowListItem>) => {
      navigate(`/workflow/${encodeURIComponent(resolveWorkflowKey(params.row))}`);
    },
    [navigate, resolveWorkflowKey]
  );

  const handleCardClick = useCallback(
    (row: WorkflowListItem) => {
      navigate(`/workflow/${encodeURIComponent(resolveWorkflowKey(row))}`);
    },
    [navigate, resolveWorkflowKey]
  );

  const getRowClassName = useCallback(
    (params: GridRowClassNameParams<WorkflowListItem>) =>
      params.row.rawStatus === WorkflowStatus.CANCELLED ||
      params.row.status === CANCELLED_LABEL
        ? "status-cancelled"
        : "",
    []
  );

  const getRowId = useCallback(
    (row: WorkflowListItem) => resolveWorkflowKey(row),
    [resolveWorkflowKey]
  );

  if (!isAuthenticated) {
    return (
      <Page title="ワークフロー" maxWidth="lg" showDefaultHeader={false}>
        <PageSection layoutVariant="dashboard">
          <Box
            sx={{
              ...dashboardInnerSurfaceSx,
              display: "flex",
              minHeight: LOADING_SECTION_MIN_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page title="ワークフロー" maxWidth="lg" showDefaultHeader={false}>
      <PageSection layoutVariant="dashboard">
        <Box sx={dashboardInnerSurfaceSx}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: FILTER_ACTION_GAP,
                    alignItems: "center",
                  }}
                >
                  {anyFilterActive && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon fontSize="small" />}
                      onClick={() => {
                        clearFilters();
                        filterRowRef.current?.closeAllPopovers();
                      }}
                    >
                      すべてのフィルターをクリア
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "stretch", md: "flex-end" },
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/workflow/new")}
                    fullWidth={isCompact}
                  >
                    新規作成
                  </Button>
                </Box>
              </Stack>
            </Stack>

            {currentStaffId ? (
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {isCompact ? (
                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{
                      borderRadius: MOBILE_FILTER_RADIUS,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        px: MOBILE_FILTER_PADDING_X,
                        py: MOBILE_FILTER_PADDING_Y,
                        "& .MuiAccordionSummary-expandIconWrapper": {
                          color: "text.secondary",
                        },
                        "& .MuiAccordionSummary-content": { my: 0 },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ width: "100%", justifyContent: "space-between" }}
                      >
                        <Typography variant="subtitle2">フィルター</Typography>
                        {anyFilterActive && (
                          <Box
                            sx={{
                              px: MOBILE_FILTER_BADGE_PADDING,
                              py: 0,
                              borderRadius: MOBILE_FILTER_BADGE_RADIUS,
                              bgcolor: "action.selected",
                              color: "text.secondary",
                              fontSize: 12,
                              lineHeight: 1.6,
                            }}
                          >
                            適用中
                          </Box>
                        )}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: MOBILE_FILTER_PADDING_X }}>
                      <WorkflowListFiltersPanel
                        ref={filterRowRef}
                        filters={filters}
                        setFilter={setFilter}
                      />
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  <Table size="small" sx={{ tableLayout: "fixed" }} aria-hidden>
                    <TableHead>
                      <TableRow>
                        <TableCell>種別</TableCell>
                        <TableCell>申請日</TableCell>
                        <TableCell>ステータス</TableCell>
                        <TableCell>作成日</TableCell>
                      </TableRow>
                      <WorkflowListFilters
                        ref={filterRowRef}
                        filters={filters}
                        setFilter={setFilter}
                      />
                    </TableHead>
                  </Table>
                )}
                {isCompact ? (
                  <Box>
                    {loading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: MOBILE_EMPTY_PADDING,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : filteredItems.length === 0 ? (
                      <Alert severity="info">該当するワークフローがありません。</Alert>
                    ) : (
                      <Stack spacing={MOBILE_CARD_GAP}>
                        {filteredItems.map((item) => {
                          const key = getRowId(item);
                          return (
                            <ButtonBase
                              key={key}
                              onClick={() => handleCardClick(item)}
                              sx={{
                                width: "100%",
                                textAlign: "left",
                                borderRadius: MOBILE_CARD_RADIUS,
                              }}
                            >
                              <Paper
                                sx={{
                                  width: "100%",
                                  p: MOBILE_CARD_PADDING,
                                  borderRadius: MOBILE_CARD_RADIUS,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  bgcolor: "background.paper",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: MOBILE_ACTION_GAP,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={MOBILE_ACTION_GAP}
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {item.category || "-"}
                                  </Typography>
                                  <StatusChip
                                    status={item.rawStatus || item.status || ""}
                                  />
                                </Stack>
                                <Stack spacing={MOBILE_META_GAP}>
                                  <Typography variant="caption" color="text.secondary">
                                    申請日
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatWorkflowDateValue(item.applicationDate)}
                                  </Typography>
                                </Stack>
                                <Stack
                                  direction="row"
                                  spacing={MOBILE_ACTION_GAP}
                                  justifyContent="space-between"
                                >
                                  <Stack spacing={MOBILE_META_GAP}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      作成日
                                    </Typography>
                                    <Typography variant="body2">
                                      {item.createdAt || "-"}
                                    </Typography>
                                  </Stack>
                                  <Stack spacing={MOBILE_META_GAP} alignItems="flex-end">
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      ステータス
                                    </Typography>
                                    <Typography variant="body2">
                                      {item.status || "-"}
                                    </Typography>
                                  </Stack>
                                </Stack>
                              </Paper>
                            </ButtonBase>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ height: dataGridContainerHeight, width: "100%" }}>
                    <DataGrid
                      rows={filteredItems}
                      columns={columns}
                      getRowId={getRowId}
                      disableColumnMenu
                      disableColumnSelector
                      disableDensitySelector
                      disableRowSelectionOnClick
                      hideFooter
                      loading={loading}
                      onRowClick={handleRowClick}
                      rowHeight={dataGridRowHeight}
                      columnHeaderHeight={0}
                      getRowClassName={getRowClassName}
                      sx={{
                        "& .MuiDataGrid-columnHeaders": { display: "none" },
                        "& .status-cancelled .MuiDataGrid-cell": {
                          color: "text.disabled",
                        },
                        "& .MuiDataGrid-row": {
                          cursor: "pointer",
                        },
                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within":
                          {
                            outline: "none",
                          },
                      }}
                    />
                  </Box>
                )}
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: EMPTY_STATE_PADDING_Y,
                }}
              >
                {loading ? (
                  <CircularProgress />
                ) : (
                  <Alert severity="info">
                    ログイン中のアカウントに紐づくスタッフ情報が見つからないため、一覧を表示できません。
                    <br />
                    スタッフアカウントが未登録の場合は管理者にお問い合わせください。
                  </Alert>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </PageSection>
    </Page>
  );
}
