import {
  DeleteHolidayCalendarInput,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { CalendarItemDelete } from "./CalendarItemDelete";

export default function HolidayCalendarDelete({
  holidayCalendar,
  deleteHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  deleteHolidayCalendar: (input: DeleteHolidayCalendarInput) => Promise<void>;
}) {
  return (
    <CalendarItemDelete
      date={holidayCalendar.holidayDate}
      name={holidayCalendar.name}
      deleteInput={{ id: holidayCalendar.id }}
      messageFactory={HolidayCalendarMessage()}
      onDelete={deleteHolidayCalendar}
    />
  );
}

