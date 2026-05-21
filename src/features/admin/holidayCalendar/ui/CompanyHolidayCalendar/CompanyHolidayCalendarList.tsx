import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  type UpdateCompanyHolidayCalendarPayload,
  useBulkCreateCompanyHolidayCalendarsMutation,
  useCreateCompanyHolidayCalendarMutation,
  useDeleteCompanyHolidayCalendarMutation,
  useGetCompanyHolidayCalendarsQuery,
  useUpdateCompanyHolidayCalendarMutation,
} from "@entities/calendar/api/calendarApi";
import { useHolidayCalendarList } from "@features/admin/holidayCalendar/model/useHolidayCalendarList";
import CreatedAtTableCell from "@features/admin/holidayCalendar/ui/components/CreatedAtTableCell";
import HolidayCalendarListScaffold from "@features/admin/holidayCalendar/ui/components/HolidayCalendarListScaffold";
import { TableCell } from "@mui/material";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { CompanyHolidayCalendar } from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
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
  const {
    data: companyHolidayCalendars = [],
    isLoading: isCompanyHolidayCalendarsLoading,
    isFetching: isCompanyHolidayCalendarsFetching,
    error: companyHolidayCalendarsError,
  } = useGetCompanyHolidayCalendarsQuery();
  const [createCompanyHolidayCalendarMutation] =
    useCreateCompanyHolidayCalendarMutation();
  const [updateCompanyHolidayCalendarMutation] =
    useUpdateCompanyHolidayCalendarMutation();
  const [deleteCompanyHolidayCalendarMutation] =
    useDeleteCompanyHolidayCalendarMutation();
  const [bulkCreateCompanyHolidayCalendarsMutation] =
    useBulkCreateCompanyHolidayCalendarsMutation();

  const createCompanyHolidayCalendar = useCallback(
    async (input: Parameters<typeof createCompanyHolidayCalendarMutation>[0]) =>
      createCompanyHolidayCalendarMutation(input).unwrap(),
    [createCompanyHolidayCalendarMutation],
  );

  const updateCompanyHolidayCalendar = useCallback(
    async (input: CompanyHolidayCalendar) =>
      updateCompanyHolidayCalendarMutation({
        input: {
          id: input.id,
          holidayDate: input.holidayDate,
          name: input.name,
          version: getNextVersion(input.version),
        },
        condition: buildVersionOrUpdatedAtCondition(input.version, input.updatedAt),
      } satisfies UpdateCompanyHolidayCalendarPayload).unwrap(),
    [updateCompanyHolidayCalendarMutation],
  );

  const deleteCompanyHolidayCalendar = useCallback(
    async (input: Parameters<typeof deleteCompanyHolidayCalendarMutation>[0]) =>
      deleteCompanyHolidayCalendarMutation(input).unwrap(),
    [deleteCompanyHolidayCalendarMutation],
  );

  const bulkCreateCompanyHolidayCalendar = useCallback(
    async (
      input: Parameters<typeof bulkCreateCompanyHolidayCalendarsMutation>[0],
    ) => bulkCreateCompanyHolidayCalendarsMutation(input).unwrap(),
    [bulkCreateCompanyHolidayCalendarsMutation],
  );

  const calendarLoading =
    isCompanyHolidayCalendarsLoading || isCompanyHolidayCalendarsFetching;

  useEffect(() => {
    if (companyHolidayCalendarsError) {
      console.error(companyHolidayCalendarsError);
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E00001,
        }),
      );
    }
  }, [companyHolidayCalendarsError, dispatch]);

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
  } = useHolidayCalendarList<CompanyHolidayCalendar>(companyHolidayCalendars, {
    initialRowsPerPage: 20,
    yearRange: YEAR_RANGE,
    yearOffset: YEAR_OFFSET,
  });

  if (calendarLoading) {
    return <ProgressBar className="w-full" />;
  }

  const handleDelete = async (companyHolidayCalendar: CompanyHolidayCalendar) => {
    const beDeleteDate = dayjs(companyHolidayCalendar.holidayDate).format(
      AttendanceDate.DisplayFormat,
    );
    const beDeleteName = companyHolidayCalendar.name;
    const message = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\n削除したデータは元に戻せません。`;
    const confirm = window.confirm(message);

    if (!confirm) {
      return;
    }

    const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();
    await deleteCompanyHolidayCalendar({ id: companyHolidayCalendar.id })
      .then(() =>
        dispatch(
          pushNotification({
            tone: "success",
            message: companyHolidayCalendarMessage.delete(MessageStatus.SUCCESS),
          }),
        ),
      )
      .catch(() =>
        dispatch(
          pushNotification({
            tone: "error",
            message: companyHolidayCalendarMessage.delete(MessageStatus.ERROR),
          }),
        ),
      );
  };

  return (
    <HolidayCalendarListScaffold
      actions={
        <>
          <AddCompanyHolidayCalendar
            createCompanyHolidayCalendar={createCompanyHolidayCalendar}
            bulkCreateCompanyHolidayCalendar={bulkCreateCompanyHolidayCalendar}
          />
          <ExcelFilePicker
            bulkCreateCompanyHolidayCalendar={bulkCreateCompanyHolidayCalendar}
          />
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
      filterIdPrefix="company"
      getRowKey={(holidayCalendar, index) => holidayCalendar.id ?? index}
      renderActionButtons={(holidayCalendar) => (
        <>
          <CompanyHolidayCalendarEdit
            holidayCalendar={holidayCalendar}
            updateCompanyHolidayCalendar={updateCompanyHolidayCalendar}
          />
          <CompanyHolidayCalendarCopy
            companyHolidayCalendar={holidayCalendar}
            createCompanyHolidayCalendar={createCompanyHolidayCalendar}
          />
          <AppDeleteIconButton onClick={() => handleDelete(holidayCalendar)} />
        </>
      )}
      renderDataCells={(holidayCalendar) => (
        <>
          <TableCell>
            {dayjs(holidayCalendar.holidayDate).format(AttendanceDate.DisplayFormat)}
          </TableCell>
          <TableCell>{holidayCalendar.name}</TableCell>
          <CreatedAtTableCell holidayCalendar={holidayCalendar} />
        </>
      )}
    />
  );
}
