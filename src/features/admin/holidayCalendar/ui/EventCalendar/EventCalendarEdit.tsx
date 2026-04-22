import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import EditIcon from "@mui/icons-material/Edit";
import { Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import { EventCalendar, } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Inputs = {
    id: string | null;
    eventDate: dayjs.Dayjs | null;
    name: string;
    description: string;
};
const defaultValues: Inputs = {
    id: null,
    eventDate: null,
    name: "",
    description: "",
};
export default function EventCalendarEdit({ eventCalendar, updateEventCalendar, }: {
    eventCalendar: EventCalendar;
    updateEventCalendar: (input: EventCalendar) => Promise<EventCalendar>;
}) {
    const dispatch = useAppDispatchV2();
    const [editRow, setEditRow] = useState<EventCalendar | null>(null);
    const { register, control, handleSubmit, reset, setValue, formState: { isValid, isDirty, isSubmitting }, } = useForm<Inputs>({
        mode: "onChange",
        defaultValues,
    });
    const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
        isDirty,
        isBusy: isSubmitting,
        onClose: () => {
            reset(defaultValues);
            onClose();
        },
    });
    useEffect(() => {
        if (!editRow)
            return;
        setValue("id", editRow.id);
        setValue("eventDate", dayjs(editRow.eventDate));
        setValue("name", editRow.name);
        setValue("description", editRow.description ?? "");
    }, [editRow]);
    const onClose = () => {
        setEditRow(null);
    };
    const onSubmit = async (data: Inputs) => {
        const { id, eventDate, name, description } = data;
        if (!id || !eventDate)
            return;
        const eventCalendarMessage = EventCalendarMessage();
        await updateEventCalendar({
            ...eventCalendar,
            eventDate: eventDate.toISOString(),
            name,
            description: description || undefined,
        })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: eventCalendarMessage.update(MessageStatus.SUCCESS)
            }));
            closeWithoutGuard();
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "error",
                message: eventCalendarMessage.update(MessageStatus.ERROR)
            }));
        });
    };
    return (<>
      <AppIconButton onClick={() => {
            setEditRow(eventCalendar);
        }} aria-label="編集">
        <EditIcon fontSize="small"/>
      </AppIconButton>
      {dialog}
      <Dialog open={Boolean(editRow)} onClose={requestClose}>
        <DialogTitle>イベントを編集</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              イベント日と名前、詳細（任意）を入力してください。
            </DialogContentText>
            <Controller name="eventDate" control={control} rules={{ required: true }} render={({ field }) => (<DatePicker label="日付" format={AttendanceDate.DisplayFormat} {...field} slotProps={{
                textField: {
                    required: true,
                },
            }} onChange={(date) => field.onChange(date)}/>)}/>
            <TextField label="イベント名" required {...register("name", {
        required: true,
    })}/>
            <TextField label="詳細 (任意)" multiline rows={3} {...register("description")}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose}>
            キャンセル
          </Button>
          <Button disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(onSubmit)}>
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>);
}
