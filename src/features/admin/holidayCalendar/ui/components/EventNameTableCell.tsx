import { CalendarNameTableCell } from "./CalendarTableCells";
import { EventCalendar } from "@shared/api/graphql/types";

export default function EventNameTableCell({
  eventCalendar,
}: {
  eventCalendar: EventCalendar;
}) {
  return <CalendarNameTableCell name={eventCalendar.name} />;
}

