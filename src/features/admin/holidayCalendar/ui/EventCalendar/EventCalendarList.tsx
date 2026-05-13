import { useAppDispatchV2 } from "@app/hooks";
import {
  type UpdateEventCalendarPayload,
  useBulkCreateEventCalendarsMutation,
  useCreateEventCalendarMutation,
  useDeleteEventCalendarMutation,
  useGetEventCalendarsQuery,
  useUpdateEventCalendarMutation,
} from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import CreatedAtTableCell from "@features/admin/holidayCalendar/ui/components/CreatedAtTableCell";
import EventCalendarDelete from "@features/admin/holidayCalendar/ui/components/EventCalendarDelete";
import EventDateTableCell from "@features/admin/holidayCalendar/ui/components/EventDateTableCell";
import EventNameTableCell from "@features/admin/holidayCalendar/ui/components/EventNameTableCell";
import HolidayCalendarListScaffold from "@features/admin/holidayCalendar/ui/components/HolidayCalendarListScaffold";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { EventCalendar } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { ProgressBar } from "@shared/ui/feedback";
import { useCallback, useEffect } from "react";

import * as MESSAGE_CODE from "@/errors";

import { AddEventCalendar } from "./AddEventCalendar";
import { CSVFilePicker } from "./CSVFilePicker";
import EventCalendarCopy from "./EventCalendarCopy";
import EventCalendarEdit from "./EventCalendarEdit";

export default function EventCalendarList() {
  const dispatch = useAppDispatchV2();
  const {
    data: eventCalendars = [],
    isLoading: isEventCalendarsLoading,
    isFetching: isEventCalendarsFetching,
    error: eventCalendarsError,
  } = useGetEventCalendarsQuery();
  const [createEventCalendarMutation] = useCreateEventCalendarMutation();
  const [bulkCreateEventCalendarsMutation] = useBulkCreateEventCalendarsMutation();
  const [updateEventCalendarMutation] = useUpdateEventCalendarMutation();
  const [deleteEventCalendarMutation] = useDeleteEventCalendarMutation();

  const createEventCalendar = useCallback(
    async (input: Parameters<typeof createEventCalendarMutation>[0]) =>
      createEventCalendarMutation(input).unwrap(),
    [createEventCalendarMutation],
  );

  const bulkCreateEventCalendar = useCallback(
    async (inputs: Parameters<typeof bulkCreateEventCalendarsMutation>[0]) =>
      bulkCreateEventCalendarsMutation(inputs).unwrap(),
    [bulkCreateEventCalendarsMutation],
  );

  const updateEventCalendar = useCallback(
    async (input: EventCalendar) =>
      updateEventCalendarMutation({
        input: {
          id: input.id,
          eventDate: input.eventDate,
          name: input.name,
          description: input.description ?? undefined,
          version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
      } satisfies UpdateEventCalendarPayload).unwrap(),
    [updateEventCalendarMutation],
  );

  const deleteEventCalendar = useCallback(
    async (input: Parameters<typeof deleteEventCalendarMutation>[0]) => {
      await deleteEventCalendarMutation(input).unwrap();
    },
    [deleteEventCalendarMutation],
  );

  const calendarLoading = isEventCalendarsLoading || isEventCalendarsFetching;

  useEffect(() => {
    if (eventCalendarsError) {
      console.error(eventCalendarsError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [eventCalendarsError, dispatch]);

  const {
    page,
    rowsPerPage,
    years,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    nameFilter,
    setNameFilter,
    applyYearMonthFilter,
    filtered,
    paginated,
    handleChangePage,
    handleChangeRowsPerPage,
    clearFilters,
  } = useHolidayCalendarList<EventCalendar>(eventCalendars, {
    initialRowsPerPage: 20,
    yearRange: 7,
    yearOffset: 5,
  });

  if (calendarLoading) {
    return <ProgressBar className="w-full" />;
  }

  return (
    <HolidayCalendarListScaffold
      actions={
        <>
          <AddEventCalendar
            createEventCalendar={createEventCalendar}
            bulkCreateEventCalendar={bulkCreateEventCalendar}
          />
          <CSVFilePicker bulkCreateEventCalendar={bulkCreateEventCalendar} />
        </>
      }
      paginated={paginated}
      filteredCount={filtered.length}
      page={page}
      rowsPerPage={rowsPerPage}
      years={years}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      onYearChange={(year) => {
        setSelectedYear(year);
        applyYearMonthFilter(year, selectedMonth);
      }}
      onMonthChange={(month) => {
        setSelectedMonth(month);
        applyYearMonthFilter(selectedYear, month);
      }}
      nameFilter={nameFilter}
      onNameFilterChange={setNameFilter}
      onClearFilters={clearFilters}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      nameFilterLabel="イベント名で検索"
      filterIdPrefix="event"
      actionRowAlignItems="center"
      getRowKey={(eventCalendar, index) => eventCalendar.id ?? index}
      renderActionButtons={(eventCalendar) => (
        <>
          <EventCalendarEdit
            eventCalendar={eventCalendar}
            updateEventCalendar={updateEventCalendar}
          />
          <EventCalendarCopy
            eventCalendar={eventCalendar}
            createEventCalendar={createEventCalendar}
          />
          <EventCalendarDelete
            eventCalendar={eventCalendar}
            deleteEventCalendar={deleteEventCalendar}
          />
        </>
      )}
      renderDataCells={(eventCalendar) => (
        <>
          <EventDateTableCell eventCalendar={eventCalendar} />
          <EventNameTableCell eventCalendar={eventCalendar} />
          <CreatedAtTableCell holidayCalendar={eventCalendar} />
        </>
      )}
    />
  );
}
