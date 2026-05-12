import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import {
  Attendance,
  CloseDate,
  CompanyHolidayCalendar,
  HolidayCalendar,
  Staff,
} from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

import {
  buildHolidayLabels,
  getCalendarDaySurfaceState,
  getHolidayNames,
  getStatus,
} from "../../lib/attendanceStatusUtils";
import { useOptionalAttendanceListContext } from "../AttendanceListContext";
import { MobileCalendarUIProvider } from "./mobileCalendarContext";
import { SelectedDateDetails } from "./MobileCalendarDetails";
import { MobileCalendarHeader, MonthlyTermChips } from "./MobileCalendarHeader";
import {
  CalendarContainer,
  CalendarDayCell,
  CalendarGrid,
  DayNumber,
  DayOfWeekCell,
  DayOfWeekHeader,
  HolidayName,
} from "./MobileCalendarPrimitives";
import {
  buildAttendanceMap,
  createCalendarDays,
  formatDateKey,
  getDayCellMeta,
  getHolidayInfoByDate,
  resolveMonthlyTerms,
  statusLabelMap,
  statusTextColorMap,
} from "./mobileCalendarUtils";

const MONTH_QUERY_KEY = "month";

interface MobileCalendarProps {
  attendances?: Attendance[];
  holidayCalendars?: HolidayCalendar[];
  companyHolidayCalendars?: CompanyHolidayCalendar[];
  staff?: Staff | null | undefined;
  currentMonth?: Dayjs;
  onMonthChange?: (newMonth: Dayjs) => void;
  closeDates?: CloseDate[];
  buildNavigatePath?: (formattedWorkDate: string) => string;
  navigate?: (path: string) => void;
}

export default function MobileCalendar({
  attendances: attendancesProp,
  holidayCalendars: holidayCalendarsProp,
  companyHolidayCalendars: companyHolidayCalendarsProp,
  staff: staffProp,
  currentMonth: currentMonthProp,
  onMonthChange: onMonthChangeProp,
  closeDates: closeDatesProp,
  buildNavigatePath,
  navigate: navigateProp,
}: MobileCalendarProps) {
  const context = useOptionalAttendanceListContext();
  const attendances = attendancesProp ?? context?.attendances ?? [];
  const holidayCalendars =
    holidayCalendarsProp ?? context?.holidayCalendars ?? [];
  const companyHolidayCalendars =
    companyHolidayCalendarsProp ?? context?.companyHolidayCalendars ?? [];
  const staff = staffProp ?? context?.staff;
  const currentMonth =
    currentMonthProp ?? context?.currentMonth ?? dayjs().startOf("month");
  const onMonthChange = onMonthChangeProp ?? context?.onMonthChange;
  const closeDates = closeDatesProp ?? context?.closeDates ?? [];
  const navigate = navigateProp ?? context?.navigate;
  const [selectedByMonth, setSelectedByMonth] = useState<
    Record<string, string | null>
  >({});

  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");
  const monthKey = currentMonth.format("YYYY-MM");
  const today = dayjs();
  const defaultTodayForMonth = today.isSame(currentMonth, "month")
    ? formatDateKey(today)
    : null;
  const selectedDate = Object.prototype.hasOwnProperty.call(
    selectedByMonth,
    monthKey,
  )
    ? (selectedByMonth[monthKey] ?? null)
    : defaultTodayForMonth;
  const attendanceMap = buildAttendanceMap(attendances);

  const termPalette = [
    "var(--mui-palette-info-main)",
    "var(--mui-palette-success-main)",
    "var(--mui-palette-warning-main)",
    "var(--mui-palette-secondary-main)",
  ];

  const monthlyTerms = resolveMonthlyTerms(
    currentMonth,
    closeDates,
    termPalette,
  );

  const days = createCalendarDays(monthStart, monthEnd);

  const handleDateClick = (date: Dayjs) => {
    const dateKey = formatDateKey(date);
    setSelectedByMonth((prev) => ({
      ...prev,
      [monthKey]: selectedDate === dateKey ? null : dateKey,
    }));
  };

  const handleEdit = (date: string) => {
    if (!navigate) return;
    const dateStr = dayjs(date).format(AttendanceDate.QueryParamFormat);
    const path = buildNavigatePath
      ? buildNavigatePath(dateStr)
      : `/attendance/${dateStr}/edit`;
    const monthQuery = new URLSearchParams({
      [MONTH_QUERY_KEY]: currentMonth.startOf("month").format("YYYY-MM"),
    }).toString();
    navigate(`${path}?${monthQuery}`);
  };

  const getHolidayInfo = (date: Dayjs) =>
    getHolidayInfoByDate(date, holidayCalendars, companyHolidayCalendars);

  const selectedAttendance = selectedDate
    ? (attendanceMap.get(selectedDate) ?? null)
    : null;
  const selectedDateStatus = selectedDate
    ? getStatus(
        selectedAttendance ?? undefined,
        staff,
        holidayCalendars,
        companyHolidayCalendars,
        dayjs(selectedDate),
      )
    : AttendanceStatus.None;

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
  const selectedDateHandlers = {
    onEditSelectedDate: () => selectedDate && handleEdit(selectedDate),
    onCloseSelectedDate: () =>
      setSelectedByMonth((prev) => ({
        ...prev,
        [monthKey]: null,
      })),
  };

  return (
    <MobileCalendarUIProvider
      value={{
        currentMonth,
        onPrevMonth: () => onMonthChange?.(currentMonth.subtract(1, "month")),
        onNextMonth: () => onMonthChange?.(currentMonth.add(1, "month")),
        onToday: () => onMonthChange?.(dayjs()),
        monthlyTerms,
        selectedDate,
        selectedAttendance,
        selectedDateStatus,
        getHolidayInfo,
        ...selectedDateHandlers,
      }}
    >
      <CalendarContainer>
        <MobileCalendarHeader />

        <MonthlyTermChips />

        <DayOfWeekHeader>
          {weekDays.map((day, index) => (
            <DayOfWeekCell key={`dow-${index}`}>{day}</DayOfWeekCell>
          ))}
        </DayOfWeekHeader>

        <CalendarGrid>
          {days.map((day) => {
            const dateKey = formatDateKey(day.date);
            const attendance = attendanceMap.get(dateKey);
            const { status, hasError, termColor } = getDayCellMeta({
              date: day.date,
              attendance,
              staff,
              holidayCalendars,
              companyHolidayCalendars,
              monthlyTerms,
            });
            const { holidayLike } = getCalendarDaySurfaceState({
              date: day.date,
              staff,
              holidayCalendars,
              companyHolidayCalendars,
            });
            const { holidayName, companyHolidayName } = getHolidayNames(
              day.date,
              holidayCalendars,
              companyHolidayCalendars,
            );
            const holidayLabels = buildHolidayLabels({
              holidayName,
              companyHolidayName,
              attendance,
              includeCompanyHolidayPrefix: false,
            });

            return (
              <CalendarDayCell
                key={`day-${dateKey}`}
                isCurrentMonth={day.isCurrentMonth}
                hasError={hasError}
                status={status}
                isSelected={selectedDate === dateKey}
                isHolidayLike={holidayLike}
                termColor={termColor}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
              >
                <div className="mobile-calendar__day-content">
                  <DayNumber>{day.date.format("D")}</DayNumber>
                  {status !== undefined && status !== AttendanceStatus.None && (
                    <p
                      className="mobile-calendar__day-status"
                      style={{ color: statusTextColorMap[status] }}
                    >
                      {statusLabelMap[status]}
                    </p>
                  )}
                  {holidayLabels.map((label, index) => (
                    <HolidayName key={`${dateKey}-${label}-${index}`}>
                      {label}
                    </HolidayName>
                  ))}
                </div>
              </CalendarDayCell>
            );
          })}
        </CalendarGrid>

        <SelectedDateDetails />
      </CalendarContainer>
    </MobileCalendarUIProvider>
  );
}
