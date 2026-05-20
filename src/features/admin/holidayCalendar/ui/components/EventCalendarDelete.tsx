import {
  DeleteEventCalendarInput,
  EventCalendar,
} from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { CalendarItemDelete } from "./CalendarItemDelete";

export default function EventCalendarDelete({
  eventCalendar,
  deleteEventCalendar,
}: {
  eventCalendar: EventCalendar;
  deleteEventCalendar: (input: DeleteEventCalendarInput) => Promise<void>;
}) {
  return (
    <CalendarItemDelete
      date={eventCalendar.eventDate}
      name={eventCalendar.name}
      deleteInput={{ id: eventCalendar.id }}
      messageFactory={EventCalendarMessage()}
      onDelete={deleteEventCalendar}
    />
  );
}

