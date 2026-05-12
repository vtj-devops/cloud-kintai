import { useAppDispatchV2 } from "@app/hooks";
import { type UpdateHolidayCalendarPayload, useBulkCreateHolidayCalendarsMutation, useCreateHolidayCalendarMutation, useDeleteHolidayCalendarMutation, useGetHolidayCalendarsQuery, useUpdateHolidayCalendarMutation, } from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import CreatedAtTableCell from "@features/admin/holidayCalendar/ui/components/CreatedAtTableCell";
import HolidayCalendarDelete from "@features/admin/holidayCalendar/ui/components/HolidayCalendarDelete";
import HolidayDateTableCell from "@features/admin/holidayCalendar/ui/components/HolidayDateTableCell";
import HolidayNameTableCell from "@features/admin/holidayCalendar/ui/components/HolidayNameTableCell";
import { FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TextField, Typography, } from "@mui/material";
import { buildVersionOrUpdatedAtCondition, getNextVersion, } from "@shared/api/graphql/concurrency";
import { HolidayCalendar } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { ProgressBar } from "@shared/ui/feedback";
import { useCallback, useEffect } from "react";

import * as MESSAGE_CODE from "@/errors";

import { AddHolidayCalendar } from "./AddHolidayCalendar";
import { CSVFilePicker } from "./CSVFilePicker";
import HolidayCalendarCopy from "./HolidayCalendarCopy";
import HolidayCalendarEdit from "./HolidayCalendarEdit";

export default function HolidayCalendarList() {
    const dispatch = useAppDispatchV2();
    const { data: holidayCalendars = [], isLoading: isHolidayCalendarsLoading, isFetching: isHolidayCalendarsFetching, error: holidayCalendarsError, } = useGetHolidayCalendarsQuery();
    const [createHolidayCalendarMutation] = useCreateHolidayCalendarMutation();
    const [bulkCreateHolidayCalendarsMutation] = useBulkCreateHolidayCalendarsMutation();
    const [updateHolidayCalendarMutation] = useUpdateHolidayCalendarMutation();
    const [deleteHolidayCalendarMutation] = useDeleteHolidayCalendarMutation();
    const createHolidayCalendar = useCallback(async (input: Parameters<typeof createHolidayCalendarMutation>[0]) => createHolidayCalendarMutation(input).unwrap(), [createHolidayCalendarMutation]);
    const bulkCreateHolidayCalendar = useCallback(async (inputs: Parameters<typeof bulkCreateHolidayCalendarsMutation>[0]) => bulkCreateHolidayCalendarsMutation(inputs).unwrap(), [bulkCreateHolidayCalendarsMutation]);
    const updateHolidayCalendar = useCallback(async (input: HolidayCalendar) => updateHolidayCalendarMutation({
        input: {
            id: input.id,
            holidayDate: input.holidayDate,
            name: input.name,
            version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
    } satisfies UpdateHolidayCalendarPayload).unwrap(), [updateHolidayCalendarMutation]);
    const deleteHolidayCalendar = useCallback(async (input: Parameters<typeof deleteHolidayCalendarMutation>[0]) => {
        await deleteHolidayCalendarMutation(input).unwrap();
    }, [deleteHolidayCalendarMutation]);
    const calendarLoading = isHolidayCalendarsLoading || isHolidayCalendarsFetching;
    useEffect(() => {
        if (holidayCalendarsError) {
            console.error(holidayCalendarsError);
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
        }
    }, [holidayCalendarsError, dispatch]);
    const { page, rowsPerPage, years, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, nameFilter, setNameFilter, 
    /* yearMonthFilter intentionally unused */
    applyYearMonthFilter, filtered, paginated, handleChangePage, handleChangeRowsPerPage, clearFilters, } = useHolidayCalendarList<HolidayCalendar>(holidayCalendars, {
        initialRowsPerPage: 20,
        yearRange: 7,
        yearOffset: 5,
    });
    if (calendarLoading) {
        return <ProgressBar className="w-full" />;
    }
    return (<>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AddHolidayCalendar createHolidayCalendar={createHolidayCalendar} bulkCreateHolidayCalendar={bulkCreateHolidayCalendar}/>
          <CSVFilePicker bulkCreateHolidayCalendar={bulkCreateHolidayCalendar}/>
        </Stack>
        <Paper variant="outlined" sx={{ p: 1, width: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            フィルター
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel id="select-year-label">年</InputLabel>
              <Select labelId="select-year-label" value={selectedYear} label="年" onChange={(e) => {
            const y = e.target.value as number | "";
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
              <InputLabel id="select-month-label">月</InputLabel>
              <Select labelId="select-month-label" value={selectedMonth} label="月" onChange={(e) => {
            const m = e.target.value as number | "";
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
                    <HolidayCalendarEdit holidayCalendar={holidayCalendar} updateHolidayCalendar={updateHolidayCalendar}/>
                    <HolidayCalendarCopy holidayCalendar={holidayCalendar} createHolidayCalendar={createHolidayCalendar}/>
                    <HolidayCalendarDelete holidayCalendar={holidayCalendar} deleteHolidayCalendar={deleteHolidayCalendar}/>
                  </Stack>
                </TableCell>
                <HolidayDateTableCell holidayCalendar={holidayCalendar}/>
                <HolidayNameTableCell holidayCalendar={holidayCalendar}/>
                <CreatedAtTableCell holidayCalendar={holidayCalendar}/>
                <TableCell />
              </TableRow>))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination rowsPerPageOptions={[10, 20, 50, 100]} colSpan={5} count={filtered.length} rowsPerPage={rowsPerPage} page={page} labelRowsPerPage="表示件数" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count === -1 ? `以上` : `${count}`} 件`} slotProps={{
            select: {
                inputProps: {
                    "aria-label": "rows per page",
                },
                native: false,
            },
        }} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>);
}
