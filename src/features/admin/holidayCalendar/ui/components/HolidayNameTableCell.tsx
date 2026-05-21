import { CalendarNameTableCell } from "./CalendarTableCells";
import { HolidayCalendar } from "@shared/api/graphql/types";

export default function HolidayNameTableCell({
  holidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
}) {
  return <CalendarNameTableCell name={holidayCalendar.name} />;
}

