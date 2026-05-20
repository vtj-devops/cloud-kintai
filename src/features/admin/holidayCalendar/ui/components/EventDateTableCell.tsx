import { CalendarDateTableCell } from "./CalendarTableCells";
import { EventCalendar } from "@shared/api/graphql/types";

export default function EventDateTableCell({
  eventCalendar,
}: {
  eventCalendar: EventCalendar;
}) {
  return <CalendarDateTableCell date={eventCalendar.eventDate} />;
}

