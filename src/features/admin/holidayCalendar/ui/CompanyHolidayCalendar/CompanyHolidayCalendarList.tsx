import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { type UpdateCompanyHolidayCalendarPayload, useBulkCreateCompanyHolidayCalendarsMutation, useCreateCompanyHolidayCalendarMutation, useDeleteCompanyHolidayCalendarMutation, useGetCompanyHolidayCalendarsQuery, useUpdateCompanyHolidayCalendarMutation, } from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import DeleteIcon from "@mui/icons-material/Delete";
import { FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TextField, Typography, } from "@mui/material";
import { buildVersionOrUpdatedAtCondition, getNextVersion, } from "@shared/api/graphql/concurrency";
import { CompanyHolidayCalendar } from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { ProgressBar } from "@shared/ui/feedback";
import dayjs from "dayjs";
import { useCallback, useEffect } from "react";

import * as MESSAGE_CODE from "@/errors";

import { ExcelFilePicker } from "../HolidayCalendar/ExcelFilePicker";
import AddCompanyHolidayCalendar from "./AddCompanyHolidayCalendar";
import CompanyHolidayCalendarCopy from "./CompanyHolidayCalendarCopy";
import CompanyHolidayCalendarEdit from "./CompanyHolidayCalendarEdit";

const YEAR_RANGE = 5;
const YEAR_OFFSET = 4;
export default function CompanyHolidayCalendarList() {
    const dispatch = useAppDispatchV2();
    const { data: companyHolidayCalendars = [], isLoading: isCompanyHolidayCalendarsLoading, isFetching: isCompanyHolidayCalendarsFetching, error: companyHolidayCalendarsError, } = useGetCompanyHolidayCalendarsQuery();
    const [createCompanyHolidayCalendarMutation] = useCreateCompanyHolidayCalendarMutation();
    const [updateCompanyHolidayCalendarMutation] = useUpdateCompanyHolidayCalendarMutation();
    const [deleteCompanyHolidayCalendarMutation] = useDeleteCompanyHolidayCalendarMutation();
    const [bulkCreateCompanyHolidayCalendarsMutation] = useBulkCreateCompanyHolidayCalendarsMutation();
    const createCompanyHolidayCalendar = useCallback(async (input: Parameters<typeof createCompanyHolidayCalendarMutation>[0]) => createCompanyHolidayCalendarMutation(input).unwrap(), [createCompanyHolidayCalendarMutation]);
    const updateCompanyHolidayCalendar = useCallback(async (input: CompanyHolidayCalendar) => updateCompanyHolidayCalendarMutation({
        input: {
            id: input.id,
            holidayDate: input.holidayDate,
            name: input.name,
            version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
    } satisfies UpdateCompanyHolidayCalendarPayload).unwrap(), [updateCompanyHolidayCalendarMutation]);
    const deleteCompanyHolidayCalendar = useCallback(async (input: Parameters<typeof deleteCompanyHolidayCalendarMutation>[0]) => deleteCompanyHolidayCalendarMutation(input).unwrap(), [deleteCompanyHolidayCalendarMutation]);
    const bulkCreateCompanyHolidayCalendar = useCallback(async (input: Parameters<typeof bulkCreateCompanyHolidayCalendarsMutation>[0]) => bulkCreateCompanyHolidayCalendarsMutation(input).unwrap(), [bulkCreateCompanyHolidayCalendarsMutation]);
    const calendarLoading = isCompanyHolidayCalendarsLoading || isCompanyHolidayCalendarsFetching;
    useEffect(() => {
        if (companyHolidayCalendarsError) {
            console.error(companyHolidayCalendarsError);
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
        }
    }, [companyHolidayCalendarsError, dispatch]);
    const { page, rowsPerPage, years, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, nameFilter, setNameFilter, 
    /* yearMonthFilter intentionally unused */
    applyYearMonthFilter, filtered, paginated, handleChangePage, handleChangeRowsPerPage, clearFilters, } = useHolidayCalendarList<CompanyHolidayCalendar>(companyHolidayCalendars, {
        initialRowsPerPage: 20,
        yearRange: YEAR_RANGE,
        yearOffset: YEAR_OFFSET,
    });
    if (calendarLoading) {
        return <ProgressBar className="w-full" />;
    }
    const handleDelete = async (companyHolidayCalendar: CompanyHolidayCalendar) => {
        // eslint-disable-next-line no-alert
        const beDeleteDate = dayjs(companyHolidayCalendar.holidayDate).format(AttendanceDate.DisplayFormat);
        const beDeleteName = companyHolidayCalendar.name;
        const message = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\n削除したデータは元に戻せません。`;
        const confirm = window.confirm(message);
        if (!confirm) {
            return;
        }
        const id = companyHolidayCalendar.id;
        const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();
        await deleteCompanyHolidayCalendar({ id })
            .then(() => dispatch(pushNotification({
            tone: "success",
            message: companyHolidayCalendarMessage.delete(MessageStatus.SUCCESS)
        })))
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: companyHolidayCalendarMessage.delete(MessageStatus.ERROR)
        })));
    };
    return (<>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={1}>
          <AddCompanyHolidayCalendar createCompanyHolidayCalendar={createCompanyHolidayCalendar} bulkCreateCompanyHolidayCalendar={bulkCreateCompanyHolidayCalendar}/>
          <ExcelFilePicker bulkCreateCompanyHolidayCalendar={bulkCreateCompanyHolidayCalendar}/>
        </Stack>
        <Paper variant="outlined" sx={{ p: 1, width: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            フィルター
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id="company-select-year-label">年</InputLabel>
              <Select labelId="company-select-year-label" value={selectedYear} label="年" onChange={(e) => {
            const y = e.target.value as number;
            setSelectedYear(y);
            applyYearMonthFilter(y, selectedMonth);
        }}>
                <MenuItem value="">-</MenuItem>
                {years.map((y) => (<MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel id="company-select-month-label">月</InputLabel>
              <Select labelId="company-select-month-label" value={selectedMonth} label="月" onChange={(e) => {
            const m = e.target.value as number;
            setSelectedMonth(m);
            applyYearMonthFilter(selectedYear, m);
        }}>
                <MenuItem value="">-</MenuItem>
                {Array.from({ length: 12 }).map((_, i) => (<MenuItem key={i + 1} value={i + 1}>
                    {i + 1}月
                  </MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="休日名で検索" size="small" value={nameFilter} onChange={(e) => {
            setNameFilter(e.target.value);
        }} sx={{ minWidth: 200 }}/>
            <AppButton size="sm" variant="ghost" onClick={() => {
            clearFilters();
        }}>
              クリア
            </AppButton>
          </Stack>
        </Paper>
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }}/>
              <TableCell sx={{ width: 100 }}>日付</TableCell>
              <TableCell sx={{ width: 200 }}>名前</TableCell>
              <TableCell sx={{ width: 100 }}>作成日</TableCell>
              <TableCell sx={{ flexGrow: 1 }}/>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((holidayCalendar, index) => (<TableRow key={holidayCalendar.id ?? index}>
                <TableCell>
                  <Stack direction="row" spacing={0}>
                    <CompanyHolidayCalendarEdit holidayCalendar={holidayCalendar} updateCompanyHolidayCalendar={updateCompanyHolidayCalendar}/>
                    <CompanyHolidayCalendarCopy companyHolidayCalendar={holidayCalendar} createCompanyHolidayCalendar={createCompanyHolidayCalendar}/>
                    <AppIconButton onClick={() => handleDelete(holidayCalendar)} aria-label="削除" tone="danger">
                      <DeleteIcon fontSize="small"/>
                    </AppIconButton>
                  </Stack>
                </TableCell>
                <TableCell>
                  {(() => {
                const date = dayjs(holidayCalendar.holidayDate);
                return date.format(AttendanceDate.DisplayFormat);
            })()}
                </TableCell>
                <TableCell>{holidayCalendar.name}</TableCell>
                <TableCell>
                  {(() => {
                const date = dayjs(holidayCalendar.createdAt);
                return date.format(AttendanceDate.DisplayFormat);
            })()}
                </TableCell>
                <TableCell />
              </TableRow>))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination rowsPerPageOptions={[10, 20, 50, 100]} colSpan={5} count={filtered.length} rowsPerPage={rowsPerPage} page={page} labelRowsPerPage="表示件数" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count === -1 ? `以上` : `${count}`} 件`} SelectProps={{
            inputProps: { "aria-label": "rows per page" },
            native: false,
        }} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>);
}
