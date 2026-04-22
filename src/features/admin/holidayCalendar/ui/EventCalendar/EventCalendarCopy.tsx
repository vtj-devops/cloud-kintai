import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { CreateEventCalendarInput, EventCalendar, } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useDialogCloseGuard } from "@/hooks/useDialogCloseGuard";

type Inputs = {
    eventDate: string;
    name: string;
    description: string;
};
const defaultValues: Inputs = {
    eventDate: "",
    name: "",
    description: "",
};
export default function EventCalendarCopy({ eventCalendar, createEventCalendar, }: {
    eventCalendar: EventCalendar;
    createEventCalendar: (input: CreateEventCalendarInput) => Promise<void | EventCalendar>;
}) {
    const dispatch = useAppDispatchV2();
    const [open, setOpen] = useState(false);
    const { register, control, handleSubmit, reset, setValue, formState: { isValid, isDirty, isSubmitting }, } = useForm<Inputs>({
        mode: "onChange",
        defaultValues,
    });
    const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
        isDirty,
        isBusy: isSubmitting,
        onClose: () => {
            reset(defaultValues);
            setOpen(false);
        },
    });
    useEffect(() => {
        if (!open)
            return;
        // prefill the form when opening
        setValue("eventDate", eventCalendar.eventDate ?? "");
        setValue("name", eventCalendar.name ?? "");
        setValue("description", eventCalendar.description ?? "");
    }, [open, eventCalendar, setValue]);
    const onSubmit = async (data: Inputs) => {
        const eventCalendarMessage = EventCalendarMessage();
        const { description, ...rest } = data;
        const input: CreateEventCalendarInput = {
            ...rest,
            description: description || undefined,
        };
        await createEventCalendar(input)
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: eventCalendarMessage.create(MessageStatus.SUCCESS)
            }));
            closeWithoutGuard();
        })
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: eventCalendarMessage.create(MessageStatus.ERROR)
        })));
    };
    return (<>
      <AppIconButton onClick={() => setOpen(true)} aria-label="コピー">
        <ContentCopyIcon fontSize="small"/>
      </AppIconButton>
      {dialog}
      <Dialog open={open} onClose={requestClose}>
        <DialogTitle>イベントをコピー</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              コピー元のイベント情報が入力されています。必要に応じて変更してください。
            </DialogContentText>
            <Controller name="eventDate" control={control} rules={{ required: "日付は必須項目です。" }} render={({ field, fieldState }) => {
            const { ref, value, onChange, name, onBlur, ...rest } = field;
            return (<DatePicker {...rest} label="日付" format={AttendanceDate.DisplayFormat} value={value ? dayjs(value) : null} onChange={(date) => onChange(date ? date.format(AttendanceDate.DataFormat) : "")} slotProps={{
                    textField: {
                        required: true,
                        inputRef: ref,
                        name,
                        onBlur,
                        error: Boolean(fieldState.error),
                        helperText: fieldState.error?.message,
                    },
                }}/>);
        }}/>
            <TextField label="イベント名" required {...register("name", {
        required: true,
    })}/>
            <TextField label="詳細 (任意)" multiline rows={3} {...register("description")}/>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose}>キャンセル</Button>
          <Button disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(onSubmit)}>
            コピーして作成
          </Button>
        </DialogActions>
      </Dialog>
    </>);
}
