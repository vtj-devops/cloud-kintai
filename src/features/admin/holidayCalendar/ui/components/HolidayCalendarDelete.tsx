import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import DeleteIcon from "@mui/icons-material/Delete";
import { DeleteHolidayCalendarInput, HolidayCalendar, } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";

export default function HolidayCalendarDelete({ holidayCalendar, deleteHolidayCalendar, }: {
    holidayCalendar: HolidayCalendar;
    deleteHolidayCalendar: (input: DeleteHolidayCalendarInput) => Promise<void>;
}) {
    const dispatch = useAppDispatchV2();
    const onSubmit = async () => {
        const beDeleteDate = dayjs(holidayCalendar.holidayDate).format(AttendanceDate.DisplayFormat);
        const beDeleteName = holidayCalendar.name;
        const formattedDeleteMessage = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\nこの操作は取り消せません。`;
        const confirmed = window.confirm(formattedDeleteMessage);
        if (!confirmed) {
            return;
        }
        const holidayCalendarMessage = HolidayCalendarMessage();
        await deleteHolidayCalendar({ id: holidayCalendar.id })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: holidayCalendarMessage.delete(MessageStatus.SUCCESS)
            }));
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "error",
                message: holidayCalendarMessage.delete(MessageStatus.ERROR)
            }));
        });
    };
    return (<AppIconButton onClick={onSubmit} aria-label="削除" tone="danger">
      <DeleteIcon fontSize="small"/>
    </AppIconButton>);
}
