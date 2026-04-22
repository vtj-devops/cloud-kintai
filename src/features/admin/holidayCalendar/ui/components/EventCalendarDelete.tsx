import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import DeleteIcon from "@mui/icons-material/Delete";
import { DeleteEventCalendarInput, EventCalendar, } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";

export default function EventCalendarDelete({ eventCalendar, deleteEventCalendar, }: {
    eventCalendar: EventCalendar;
    deleteEventCalendar: (input: DeleteEventCalendarInput) => Promise<void>;
}) {
    const dispatch = useAppDispatchV2();
    const onSubmit = async () => {
        const beDeleteDate = dayjs(eventCalendar.eventDate).format(AttendanceDate.DisplayFormat);
        const beDeleteName = eventCalendar.name;
        const formattedDeleteMessage = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\nこの操作は取り消せません。`;
        const confirmed = window.confirm(formattedDeleteMessage);
        if (!confirmed) {
            return;
        }
        const eventCalendarMessage = EventCalendarMessage();
        await deleteEventCalendar({ id: eventCalendar.id })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: eventCalendarMessage.delete(MessageStatus.SUCCESS)
            }));
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "error",
                message: eventCalendarMessage.delete(MessageStatus.ERROR)
            }));
        });
    };
    return (<AppIconButton onClick={onSubmit} aria-label="削除" tone="danger">
      <DeleteIcon fontSize="small"/>
    </AppIconButton>);
}
