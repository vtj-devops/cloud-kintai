import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DatePicker } from "@mui/x-date-pickers";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";
import {
  forwardRef,
  type Ref,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

import { CATEGORY_LABELS, STATUS_LABELS } from "@/entities/workflow/lib/workflowLabels";
import type { UseWorkflowListFiltersResult } from "@/features/workflow/list/useWorkflowListFilters";
import { designTokenVar } from "@/shared/designSystem";

export type WorkflowListFiltersHandle = {
  closeAllPopovers: () => void;
};

type WorkflowListFiltersProps = {
  filters: UseWorkflowListFiltersResult["filters"];
  setFilter: UseWorkflowListFiltersResult["setFilter"];
};

const DISPLAY_LABEL_APPLICATION = "申請日で絞込";
const DISPLAY_LABEL_CREATED = "作成日で絞込";
const STATUS_ALL_VALUE = "__ALL__";
const SELECT_SX = {
  width: "100%",
  ".MuiSelect-select": {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
} as const;

const FILTER_PANEL_PADDING = designTokenVar("spacing.lg", "16px");
const FILTER_PANEL_GAP = designTokenVar("spacing.md", "12px");
const FILTER_PANEL_BUTTON_GAP = designTokenVar("spacing.sm", "8px");
const FILTER_FIELD_GAP = designTokenVar("spacing.xs", "4px");
const FILTER_SECTION_GAP = designTokenVar("spacing.md", "12px");
const FILTER_PANEL_RADIUS = designTokenVar("radius.lg", "16px");

const FIELD_LABELS = {
  category: "種別",
  application: "申請日",
  status: "ステータス",
  created: "作成日",
} as const;

type WorkflowListFiltersStateProps = {
  filters: WorkflowListFiltersProps["filters"];
  setFilter: WorkflowListFiltersProps["setFilter"];
};

const useWorkflowListFiltersState = ({
  filters,
  setFilter,
}: WorkflowListFiltersStateProps) => {
  const {
    category: categoryFilter,
    status: statusFilter,
    applicationFrom,
    applicationTo,
    createdFrom,
    createdTo,
  } = filters;

  const [applicationAnchorEl, setApplicationAnchorEl] =
    useState<HTMLElement | null>(null);
  const [createdAnchorEl, setCreatedAnchorEl] = useState<HTMLElement | null>(
    null
  );

  const closeAllPopovers = useCallback(() => {
    setApplicationAnchorEl(null);
    setCreatedAnchorEl(null);
  }, []);

  const handleDateChange = useCallback(
    (
      key: "applicationFrom" | "applicationTo" | "createdFrom" | "createdTo",
      value: Dayjs | null
    ) => {
      const str = value ? value.format("YYYY-MM-DD") : "";
      setFilter(key, str);
    },
    [setFilter]
  );

  const handleApplicationFieldClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setApplicationAnchorEl(event.currentTarget);
  };

  const handleCreatedFieldClick = (event: React.MouseEvent<HTMLElement>) => {
    setCreatedAnchorEl(event.currentTarget);
  };

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextValue = typeof value === "string" ? value.split(",") : value;

    if (nextValue.includes(STATUS_ALL_VALUE)) {
      setFilter("status", []);
      return;
    }

    setFilter("status", nextValue);
  };

  return {
    categoryFilter,
    statusFilter,
    applicationFrom,
    applicationTo,
    createdFrom,
    createdTo,
    applicationAnchorEl,
    createdAnchorEl,
    closeAllPopovers,
    handleDateChange,
    handleApplicationFieldClick,
    handleCreatedFieldClick,
    handleStatusChange,
    setApplicationAnchorEl,
    setCreatedAnchorEl,
  };
};

type DateFieldProps = {
  displayValue: string;
  anchorEl: HTMLElement | null;
  onOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  fromValue: string | undefined;
  toValue: string | undefined;
  onChange: (
    key: "applicationFrom" | "applicationTo" | "createdFrom" | "createdTo",
    value: Dayjs | null
  ) => void;
  fromKey: "applicationFrom" | "createdFrom";
  toKey: "applicationTo" | "createdTo";
  onClear: () => void;
  isCompact: boolean;
};

const DateRangeField = ({
  displayValue,
  anchorEl,
  onOpen,
  onClose,
  fromValue,
  toValue,
  onChange,
  fromKey,
  toKey,
  onClear,
  isCompact,
}: DateFieldProps) => (
  <Box>
    <TextField
      size="small"
      fullWidth
      value={displayValue}
      onClick={onOpen}
      InputProps={{ readOnly: true }}
    />
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Box
        sx={{
          p: FILTER_PANEL_PADDING,
          display: "flex",
          gap: FILTER_PANEL_GAP,
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "stretch" : "center",
        }}
      >
        <DatePicker
          label="From"
          value={fromValue ? dayjs(fromValue) : null}
          onChange={(v) => onChange(fromKey, v)}
          slotProps={{ textField: { size: "small" } }}
        />
        <DatePicker
          label="To"
          value={toValue ? dayjs(toValue) : null}
          onChange={(v) => onChange(toKey, v)}
          slotProps={{ textField: { size: "small" } }}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: isCompact ? "row" : "column",
            justifyContent: "flex-end",
            gap: FILTER_PANEL_BUTTON_GAP,
          }}
        >
      <Button size="small" onClick={onClear}>
        クリア
      </Button>
    </Box>
  </Box>
</Popover>
  </Box>
);

function WorkflowListFilters(
  { filters, setFilter }: WorkflowListFiltersProps,
  ref: Ref<WorkflowListFiltersHandle>
) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    categoryFilter,
    statusFilter,
    applicationFrom,
    applicationTo,
    createdFrom,
    createdTo,
    applicationAnchorEl,
    createdAnchorEl,
    closeAllPopovers,
    handleDateChange,
    handleApplicationFieldClick,
    handleCreatedFieldClick,
    handleStatusChange,
    setApplicationAnchorEl,
    setCreatedAnchorEl,
  } = useWorkflowListFiltersState({ filters, setFilter });

  useImperativeHandle(
    ref,
    () => ({
      closeAllPopovers,
    }),
    [closeAllPopovers]
  );

  return (
    <TableRow>
      <TableCell>
        <Select
          size="small"
          sx={SELECT_SX}
          displayEmpty
          value={categoryFilter}
          onChange={(e) => setFilter("category", e.target.value)}
        >
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value={WorkflowCategory.PAID_LEAVE}>
            {CATEGORY_LABELS[WorkflowCategory.PAID_LEAVE]}
          </MenuItem>
          <MenuItem value={WorkflowCategory.ABSENCE}>
            {CATEGORY_LABELS[WorkflowCategory.ABSENCE]}
          </MenuItem>
          <MenuItem value={WorkflowCategory.OVERTIME}>
            {CATEGORY_LABELS[WorkflowCategory.OVERTIME]}
          </MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        <DateRangeField
          displayValue={
            applicationFrom && applicationTo
              ? `${applicationFrom} → ${applicationTo}`
              : DISPLAY_LABEL_APPLICATION
          }
          anchorEl={applicationAnchorEl}
          onOpen={handleApplicationFieldClick}
          onClose={() => setApplicationAnchorEl(null)}
          fromValue={applicationFrom}
          toValue={applicationTo}
          onChange={handleDateChange}
          fromKey="applicationFrom"
          toKey="applicationTo"
          onClear={() => {
            setFilter("applicationFrom", "");
            setFilter("applicationTo", "");
            setApplicationAnchorEl(null);
          }}
          isCompact={isCompact}
        />
      </TableCell>
      <TableCell>
        <Select
          size="small"
          multiple
          sx={SELECT_SX}
          displayEmpty
          value={statusFilter ?? []}
          onChange={handleStatusChange}
          renderValue={(selected) =>
            selected.length === 0
              ? "すべて"
              : selected
                  .map(
                    (status) =>
                      STATUS_LABELS[status as WorkflowStatus] || String(status)
                  )
                  .join("、")
          }
        >
          <MenuItem value={STATUS_ALL_VALUE}>すべて</MenuItem>
          <MenuItem value={WorkflowStatus.DRAFT}>
            {STATUS_LABELS[WorkflowStatus.DRAFT]}
          </MenuItem>
          <MenuItem value={WorkflowStatus.SUBMITTED}>
            {STATUS_LABELS[WorkflowStatus.SUBMITTED]}
          </MenuItem>
          <MenuItem value={WorkflowStatus.PENDING}>
            {STATUS_LABELS[WorkflowStatus.PENDING]}
          </MenuItem>
          <MenuItem value={WorkflowStatus.APPROVED}>
            {STATUS_LABELS[WorkflowStatus.APPROVED]}
          </MenuItem>
          <MenuItem value={WorkflowStatus.REJECTED}>
            {STATUS_LABELS[WorkflowStatus.REJECTED]}
          </MenuItem>
          <MenuItem value={WorkflowStatus.CANCELLED}>
            {STATUS_LABELS[WorkflowStatus.CANCELLED]}
          </MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        <DateRangeField
          displayValue={
            createdFrom && createdTo
              ? `${createdFrom} → ${createdTo}`
              : DISPLAY_LABEL_CREATED
          }
          anchorEl={createdAnchorEl}
          onOpen={handleCreatedFieldClick}
          onClose={() => setCreatedAnchorEl(null)}
          fromValue={createdFrom}
          toValue={createdTo}
          onChange={handleDateChange}
          fromKey="createdFrom"
          toKey="createdTo"
          onClear={() => {
            setFilter("createdFrom", "");
            setFilter("createdTo", "");
            setCreatedAnchorEl(null);
          }}
          isCompact={isCompact}
        />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

export const WorkflowListFiltersPanel = forwardRef(
  (
    { filters, setFilter }: WorkflowListFiltersProps,
    ref: Ref<WorkflowListFiltersHandle>
  ) => {
    const theme = useTheme();
    const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
    const {
      categoryFilter,
      statusFilter,
      applicationFrom,
      applicationTo,
      createdFrom,
      createdTo,
      applicationAnchorEl,
      createdAnchorEl,
      closeAllPopovers,
      handleDateChange,
      handleApplicationFieldClick,
      handleCreatedFieldClick,
      handleStatusChange,
      setApplicationAnchorEl,
      setCreatedAnchorEl,
    } = useWorkflowListFiltersState({ filters, setFilter });

    useImperativeHandle(
      ref,
      () => ({
        closeAllPopovers,
      }),
      [closeAllPopovers]
    );

    return (
      <Box
        sx={{
          p: FILTER_PANEL_PADDING,
          borderRadius: FILTER_PANEL_RADIUS,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={FILTER_SECTION_GAP}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: FILTER_FIELD_GAP }}>
            <Typography variant="caption" color="text.secondary">
              {FIELD_LABELS.category}
            </Typography>
            <Select
              size="small"
              sx={SELECT_SX}
              displayEmpty
              value={categoryFilter}
              onChange={(e) => setFilter("category", e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value={WorkflowCategory.PAID_LEAVE}>
                {CATEGORY_LABELS[WorkflowCategory.PAID_LEAVE]}
              </MenuItem>
              <MenuItem value={WorkflowCategory.ABSENCE}>
                {CATEGORY_LABELS[WorkflowCategory.ABSENCE]}
              </MenuItem>
              <MenuItem value={WorkflowCategory.OVERTIME}>
                {CATEGORY_LABELS[WorkflowCategory.OVERTIME]}
              </MenuItem>
            </Select>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: FILTER_FIELD_GAP }}>
            <Typography variant="caption" color="text.secondary">
              {FIELD_LABELS.application}
            </Typography>
            <DateRangeField
              displayValue={
                applicationFrom && applicationTo
                  ? `${applicationFrom} → ${applicationTo}`
                  : DISPLAY_LABEL_APPLICATION
              }
              anchorEl={applicationAnchorEl}
              onOpen={handleApplicationFieldClick}
              onClose={() => setApplicationAnchorEl(null)}
              fromValue={applicationFrom}
              toValue={applicationTo}
              onChange={handleDateChange}
              fromKey="applicationFrom"
              toKey="applicationTo"
              onClear={() => {
                setFilter("applicationFrom", "");
                setFilter("applicationTo", "");
                setApplicationAnchorEl(null);
              }}
              isCompact={isCompact}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: FILTER_FIELD_GAP }}>
            <Typography variant="caption" color="text.secondary">
              {FIELD_LABELS.status}
            </Typography>
            <Select
              size="small"
              multiple
              sx={SELECT_SX}
              displayEmpty
              value={statusFilter ?? []}
              onChange={handleStatusChange}
              renderValue={(selected) =>
                selected.length === 0
                  ? "すべて"
                  : selected
                      .map(
                        (status) =>
                          STATUS_LABELS[status as WorkflowStatus] || String(status)
                      )
                      .join("、")
              }
            >
              <MenuItem value={STATUS_ALL_VALUE}>すべて</MenuItem>
              <MenuItem value={WorkflowStatus.DRAFT}>
                {STATUS_LABELS[WorkflowStatus.DRAFT]}
              </MenuItem>
              <MenuItem value={WorkflowStatus.SUBMITTED}>
                {STATUS_LABELS[WorkflowStatus.SUBMITTED]}
              </MenuItem>
              <MenuItem value={WorkflowStatus.PENDING}>
                {STATUS_LABELS[WorkflowStatus.PENDING]}
              </MenuItem>
              <MenuItem value={WorkflowStatus.APPROVED}>
                {STATUS_LABELS[WorkflowStatus.APPROVED]}
              </MenuItem>
              <MenuItem value={WorkflowStatus.REJECTED}>
                {STATUS_LABELS[WorkflowStatus.REJECTED]}
              </MenuItem>
              <MenuItem value={WorkflowStatus.CANCELLED}>
                {STATUS_LABELS[WorkflowStatus.CANCELLED]}
              </MenuItem>
            </Select>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: FILTER_FIELD_GAP }}>
            <Typography variant="caption" color="text.secondary">
              {FIELD_LABELS.created}
            </Typography>
            <DateRangeField
              displayValue={
                createdFrom && createdTo
                  ? `${createdFrom} → ${createdTo}`
                  : DISPLAY_LABEL_CREATED
              }
              anchorEl={createdAnchorEl}
              onOpen={handleCreatedFieldClick}
              onClose={() => setCreatedAnchorEl(null)}
              fromValue={createdFrom}
              toValue={createdTo}
              onChange={handleDateChange}
              fromKey="createdFrom"
              toKey="createdTo"
              onClear={() => {
                setFilter("createdFrom", "");
                setFilter("createdTo", "");
                setCreatedAnchorEl(null);
              }}
              isCompact={isCompact}
            />
          </Box>
        </Stack>
      </Box>
    );
  }
);

WorkflowListFiltersPanel.displayName = "WorkflowListFiltersPanel";

const WorkflowListFiltersWithRef = forwardRef(WorkflowListFilters);
WorkflowListFiltersWithRef.displayName = "WorkflowListFilters";

export default WorkflowListFiltersWithRef;
