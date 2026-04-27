import { useAppDispatchV2 } from "@app/hooks";
import { type UpdateEventCalendarPayload, useBulkCreateEventCalendarsMutation, useCreateEventCalendarMutation, useDeleteEventCalendarMutation, useGetEventCalendarsQuery, useUpdateEventCalendarMutation, } from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import CreatedAtTableCell from "@features/admin/holidayCalendar/ui/components/CreatedAtTableCell";
import EventCalendarDelete from "@features/admin/holidayCalendar/ui/components/EventCalendarDelete";
import EventDateTableCell from "@features/admin/holidayCalendar/ui/components/EventDateTableCell";
import EventNameTableCell from "@features/admin/holidayCalendar/ui/components/EventNameTableCell";
import { FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TextField, Typography, } from "@mui/material";
import { buildVersionOrUpdatedAtCondition, getNextVersion, } from "@shared/api/graphql/concurrency";
import { EventCalendar } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { useCallback, useEffect } from "react";

import * as MESSAGE_CODE from "@/errors";

import { AddEventCalendar } from "./AddEventCalendar";
import { CSVFilePicker } from "./CSVFilePicker";
import EventCalendarCopy from "./EventCalendarCopy";
import EventCalendarEdit from "./EventCalendarEdit";

export default function EventCalendarList() {
    const dispatch = useAppDispatchV2();
    const { data: eventCalendars = [], isLoading: isEventCalendarsLoading, isFetching: isEventCalendarsFetching, error: eventCalendarsError, } = useGetEventCalendarsQuery();
    const [createEventCalendarMutation] = useCreateEventCalendarMutation();
    const [bulkCreateEventCalendarsMutation] = useBulkCreateEventCalendarsMutation();
    const [updateEventCalendarMutation] = useUpdateEventCalendarMutation();
    const [deleteEventCalendarMutation] = useDeleteEventCalendarMutation();
    const createEventCalendar = useCallback(async (input: Parameters<typeof createEventCalendarMutation>[0]) => createEventCalendarMutation(input).unwrap(), [createEventCalendarMutation]);
    const bulkCreateEventCalendar = useCallback(async (inputs: Parameters<typeof bulkCreateEventCalendarsMutation>[0]) => bulkCreateEventCalendarsMutation(inputs).unwrap(), [bulkCreateEventCalendarsMutation]);
    const updateEventCalendar = useCallback(async (input: EventCalendar) => updateEventCalendarMutation({
        input: {
            id: input.id,
            eventDate: input.eventDate,
            name: input.name,
            description: input.description ?? undefined,
            version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
    } satisfies UpdateEventCalendarPayload).unwrap(), [updateEventCalendarMutation]);
    const deleteEventCalendar = useCallback(async (input: Parameters<typeof deleteEventCalendarMutation>[0]) => {
        await deleteEventCalendarMutation(input).unwrap();
    }, [deleteEventCalendarMutation]);
    const calendarLoading = isEventCalendarsLoading || isEventCalendarsFetching;
    useEffect(() => {
        if (eventCalendarsError) {
            console.error(eventCalendarsError);
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
        }
    }, [eventCalendarsError, dispatch]);
    const { page, rowsPerPage, years, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, nameFilter, setNameFilter, 
    /* yearMonthFilter intentionally unused */
    applyYearMonthFilter, filtered, paginated, handleChangePage, handleChangeRowsPerPage, clearFilters, } = useHolidayCalendarList<EventCalendar>(eventCalendars, {
        initialRowsPerPage: 20,
        yearRange: 7,
        yearOffset: 5,
    });
    if (calendarLoading) {
        return <LinearProgress sx={{ width: "100%" }}/>;
    }
    return (<>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AddEventCalendar createEventCalendar={createEventCalendar} bulkCreateEventCalendar={bulkCreateEventCalendar}/>
          <CSVFilePicker bulkCreateEventCalendar={bulkCreateEventCalendar}/>
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
            <TextField label="イベント名で検索" size="small" value={nameFilter} onChange={(e) => {
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
            {paginated.map((eventCalendar, index) => (<TableRow key={eventCalendar.id ?? index}>
                <TableCell>
                  <Stack direction="row" spacing={0}>
                    <EventCalendarEdit eventCalendar={eventCalendar} updateEventCalendar={updateEventCalendar}/>
                    <EventCalendarCopy eventCalendar={eventCalendar} createEventCalendar={createEventCalendar}/>
                    <EventCalendarDelete eventCalendar={eventCalendar} deleteEventCalendar={deleteEventCalendar}/>
                  </Stack>
                </TableCell>
                <EventDateTableCell eventCalendar={eventCalendar}/>
                <EventNameTableCell eventCalendar={eventCalendar}/>
                <CreatedAtTableCell holidayCalendar={eventCalendar}/>
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
