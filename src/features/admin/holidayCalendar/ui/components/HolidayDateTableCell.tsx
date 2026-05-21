import { CalendarDateTableCell } from "./CalendarTableCells";
import { HolidayCalendar } from "@shared/api/graphql/types";

export default function HolidayDateTableCell({
  holidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
}) {
  return <CalendarDateTableCell date={holidayCalendar.holidayDate} />;
}

