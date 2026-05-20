import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  type StackProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppButton } from "@shared/ui/button";
import { type ChangeEvent, type ReactNode } from "react";

type YearMonthValue = number | "";

interface HolidayCalendarListScaffoldProps<T> {
  actions: ReactNode;
  paginated: T[];
  filteredCount: number;
  page: number;
  rowsPerPage: number;
  years: number[];
  selectedYear: YearMonthValue;
  selectedMonth: YearMonthValue;
  onYearChange: (year: YearMonthValue) => void;
  onMonthChange: (month: YearMonthValue) => void;
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  getRowKey?: (item: T, index: number) => string | number;
  renderActionButtons: (item: T) => ReactNode;
  renderDataCells: (item: T) => ReactNode;
  nameFilterLabel: string;
  filterIdPrefix?: string;
  actionRowAlignItems?: StackProps["alignItems"];
}

export default function HolidayCalendarListScaffold<T>({
  actions,
  paginated,
  filteredCount,
  page,
  rowsPerPage,
  years,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  nameFilter,
  onNameFilterChange,
  onClearFilters,
  onPageChange,
  onRowsPerPageChange,
  getRowKey,
  renderActionButtons,
  renderDataCells,
  nameFilterLabel,
  filterIdPrefix = "holiday-calendar",
  actionRowAlignItems,
}: HolidayCalendarListScaffoldProps<T>) {
  const yearLabelId = `${filterIdPrefix}-select-year-label`;
  const monthLabelId = `${filterIdPrefix}-select-month-label`;

  return (
    <>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={1} alignItems={actionRowAlignItems}>
          {actions}
        </Stack>
        <Paper variant="outlined" sx={{ p: 1, width: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            フィルター
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id={yearLabelId}>年</InputLabel>
              <Select
                labelId={yearLabelId}
                value={selectedYear}
                label="年"
                onChange={(event) => {
                  const year =
                    event.target.value === "" ? "" : Number(event.target.value);
                  onYearChange(year);
                }}
              >
                <MenuItem value="">-</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel id={monthLabelId}>月</InputLabel>
              <Select
                labelId={monthLabelId}
                value={selectedMonth}
                label="月"
                onChange={(event) => {
                  const month =
                    event.target.value === "" ? "" : Number(event.target.value);
                  onMonthChange(month);
                }}
              >
                <MenuItem value="">-</MenuItem>
                {Array.from({ length: 12 }).map((_, index) => (
                  <MenuItem key={index + 1} value={index + 1}>
                    {index + 1}月
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={nameFilterLabel}
              size="small"
              value={nameFilter}
              onChange={(event) => {
                onNameFilterChange(event.target.value);
              }}
              sx={{ minWidth: 200 }}
            />
            <AppButton size="sm" variant="ghost" onClick={onClearFilters}>
              クリア
            </AppButton>
          </Stack>
        </Paper>
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }} />
              <TableCell sx={{ width: 100 }}>日付</TableCell>
              <TableCell sx={{ width: 200 }}>名前</TableCell>
              <TableCell sx={{ width: 100 }}>作成日</TableCell>
              <TableCell sx={{ flexGrow: 1 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((item, index) => (
              <TableRow key={getRowKey?.(item, index) ?? index}>
                <TableCell>
                  <Stack direction="row" spacing={0}>
                    {renderActionButtons(item)}
                  </Stack>
                </TableCell>
                {renderDataCells(item)}
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50, 100]}
                colSpan={5}
                count={filteredCount}
                rowsPerPage={rowsPerPage}
                page={page}
                labelRowsPerPage="表示件数"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} / ${count === -1 ? "以上" : `${count}`} 件`
                }
                slotProps={{
                  select: {
                    inputProps: {
                      "aria-label": "rows per page",
                    },
                    native: false,
                  },
                }}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>
  );
}
