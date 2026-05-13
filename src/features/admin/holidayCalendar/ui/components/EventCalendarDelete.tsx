import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  DeleteEventCalendarInput,
  EventCalendar,
} from "@shared/api/graphql/types";
import { useDeleteWithConfirm } from "@shared/lib/hooks/useDeleteWithConfirm";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
import dayjs from "dayjs";

export default function EventCalendarDelete({
  eventCalendar,
  deleteEventCalendar,
}: {
  eventCalendar: EventCalendar;
  deleteEventCalendar: (input: DeleteEventCalendarInput) => Promise<void>;
}) {
  const eventCalendarMessage = EventCalendarMessage();
  const onDelete = useDeleteWithConfirm<DeleteEventCalendarInput>(
    `「${dayjs(eventCalendar.eventDate).format(AttendanceDate.DisplayFormat)}(${eventCalendar.name})」を削除しますか？\nこの操作は取り消せません。`,
    deleteEventCalendar,
    eventCalendarMessage.delete(MessageStatus.SUCCESS),
    eventCalendarMessage.delete(MessageStatus.ERROR),
  );
  return (
    <AppDeleteIconButton onClick={() => onDelete({ id: eventCalendar.id })} />
  );
}
