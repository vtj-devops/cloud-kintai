import { useAppDispatchV2 } from "@app/hooks";
import {
  type UpdateHolidayCalendarPayload,
  useBulkCreateHolidayCalendarsMutation,
  useCreateHolidayCalendarMutation,
  useDeleteHolidayCalendarMutation,
  useGetHolidayCalendarsQuery,
  useUpdateHolidayCalendarMutation,
} from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import CreatedAtTableCell from "@features/admin/holidayCalendar/ui/components/CreatedAtTableCell";
import HolidayCalendarDelete from "@features/admin/holidayCalendar/ui/components/HolidayCalendarDelete";
import HolidayCalendarListScaffold from "@features/admin/holidayCalendar/ui/components/HolidayCalendarListScaffold";
import HolidayDateTableCell from "@features/admin/holidayCalendar/ui/components/HolidayDateTableCell";
import HolidayNameTableCell from "@features/admin/holidayCalendar/ui/components/HolidayNameTableCell";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { HolidayCalendar } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { ProgressBar } from "@shared/ui/feedback";
import { useCallback, useEffect } from "react";

import * as MESSAGE_CODE from "@/errors";

import { AddHolidayCalendar } from "./AddHolidayCalendar";
import { CSVFilePicker } from "./CSVFilePicker";
import HolidayCalendarCopy from "./HolidayCalendarCopy";
import HolidayCalendarEdit from "./HolidayCalendarEdit";

export default function HolidayCalendarList() {
  const dispatch = useAppDispatchV2();
  const {
    data: holidayCalendars = [],
    isLoading: isHolidayCalendarsLoading,
    isFetching: isHolidayCalendarsFetching,
    error: holidayCalendarsError,
  } = useGetHolidayCalendarsQuery();
  const [createHolidayCalendarMutation] = useCreateHolidayCalendarMutation();
  const [bulkCreateHolidayCalendarsMutation] =
    useBulkCreateHolidayCalendarsMutation();
  const [updateHolidayCalendarMutation] = useUpdateHolidayCalendarMutation();
  const [deleteHolidayCalendarMutation] = useDeleteHolidayCalendarMutation();

  const createHolidayCalendar = useCallback(
    async (input: Parameters<typeof createHolidayCalendarMutation>[0]) =>
      createHolidayCalendarMutation(input).unwrap(),
    [createHolidayCalendarMutation],
  );

  const bulkCreateHolidayCalendar = useCallback(
    async (inputs: Parameters<typeof bulkCreateHolidayCalendarsMutation>[0]) =>
      bulkCreateHolidayCalendarsMutation(inputs).unwrap(),
    [bulkCreateHolidayCalendarsMutation],
  );

  const updateHolidayCalendar = useCallback(
    async (input: HolidayCalendar) =>
      updateHolidayCalendarMutation({
        input: {
          id: input.id,
          holidayDate: input.holidayDate,
          name: input.name,
          version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
      } satisfies UpdateHolidayCalendarPayload).unwrap(),
    [updateHolidayCalendarMutation],
  );

  const deleteHolidayCalendar = useCallback(
    async (input: Parameters<typeof deleteHolidayCalendarMutation>[0]) => {
      await deleteHolidayCalendarMutation(input).unwrap();
    },
    [deleteHolidayCalendarMutation],
  );

  const calendarLoading = isHolidayCalendarsLoading || isHolidayCalendarsFetching;

  useEffect(() => {
    if (holidayCalendarsError) {
      console.error(holidayCalendarsError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [holidayCalendarsError, dispatch]);

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
  } = useHolidayCalendarList<HolidayCalendar>(holidayCalendars, {
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
          <AddHolidayCalendar
            createHolidayCalendar={createHolidayCalendar}
            bulkCreateHolidayCalendar={bulkCreateHolidayCalendar}
          />
          <CSVFilePicker bulkCreateHolidayCalendar={bulkCreateHolidayCalendar} />
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
      nameFilterLabel="休日名で検索"
      filterIdPrefix="holiday"
      actionRowAlignItems="center"
      getRowKey={(holidayCalendar, index) => holidayCalendar.id ?? index}
      renderActionButtons={(holidayCalendar) => (
        <>
          <HolidayCalendarEdit
            holidayCalendar={holidayCalendar}
            updateHolidayCalendar={updateHolidayCalendar}
          />
          <HolidayCalendarCopy
            holidayCalendar={holidayCalendar}
            createHolidayCalendar={createHolidayCalendar}
          />
          <HolidayCalendarDelete
            holidayCalendar={holidayCalendar}
            deleteHolidayCalendar={deleteHolidayCalendar}
          />
        </>
      )}
      renderDataCells={(holidayCalendar) => (
        <>
          <HolidayDateTableCell holidayCalendar={holidayCalendar} />
          <HolidayNameTableCell holidayCalendar={holidayCalendar} />
          <CreatedAtTableCell holidayCalendar={holidayCalendar} />
        </>
      )}
    />
  );
}
