import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  DeleteHolidayCalendarInput,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import { useDeleteWithConfirm } from "@shared/lib/hooks/useDeleteWithConfirm";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
import dayjs from "dayjs";

export default function HolidayCalendarDelete({
  holidayCalendar,
  deleteHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  deleteHolidayCalendar: (input: DeleteHolidayCalendarInput) => Promise<void>;
}) {
  const holidayCalendarMessage = HolidayCalendarMessage();
  const onDelete = useDeleteWithConfirm<DeleteHolidayCalendarInput>(
    `「${dayjs(holidayCalendar.holidayDate).format(AttendanceDate.DisplayFormat)}(${holidayCalendar.name})」を削除しますか？\nこの操作は取り消せません。`,
    deleteHolidayCalendar,
    holidayCalendarMessage.delete(MessageStatus.SUCCESS),
    holidayCalendarMessage.delete(MessageStatus.ERROR),
  );
  return (
    <AppDeleteIconButton onClick={() => onDelete({ id: holidayCalendar.id })} />
  );
}
