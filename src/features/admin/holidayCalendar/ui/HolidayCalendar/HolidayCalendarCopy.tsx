import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Stack, TextField, } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { CreateHolidayCalendarInput, HolidayCalendar, } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton, AppIconButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Inputs = {
    holidayDate: string;
    name: string;
};
const defaultValues: Inputs = {
    holidayDate: "",
    name: "",
};
export default function HolidayCalendarCopy({ holidayCalendar, createHolidayCalendar, }: {
    holidayCalendar: HolidayCalendar;
    createHolidayCalendar: (input: CreateHolidayCalendarInput) => Promise<void | HolidayCalendar>;
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
        setValue("holidayDate", holidayCalendar.holidayDate ?? "");
        setValue("name", holidayCalendar.name ?? "");
    }, [open, holidayCalendar, setValue]);
    const onSubmit = async (data: Inputs) => {
        const holidayCalendarMessage = HolidayCalendarMessage();
        await createHolidayCalendar(data)
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: holidayCalendarMessage.create(MessageStatus.SUCCESS)
            }));
            closeWithoutGuard();
        })
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: holidayCalendarMessage.create(MessageStatus.ERROR)
        })));
    };
    return (<>
      <AppIconButton onClick={() => setOpen(true)} aria-label="コピー">
        <ContentCopyIcon fontSize="small"/>
      </AppIconButton>
      {dialog}
      <AppDialog open={open} onClose={requestClose} title="会社休日をコピーして新規作成" description="コピー元の内容を編集してから登録してください。" actions={<>
          <AppButton variant="outline" tone="neutral" onClick={requestClose}>キャンセル</AppButton>
          <AppButton disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(onSubmit)}>登録</AppButton>
        </>}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller name="holidayDate" control={control} rules={{ required: true }} render={({ field }) => (<DatePicker label="日付" format={AttendanceDate.DisplayFormat} value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.toISOString() ?? "")} slotProps={{
              textField: {
                  required: true,
              },
          }}/>)}/>
          <TextField label="休日名" required {...register("name", { required: true })}/>
        </Stack>
      </AppDialog>
    </>);
}
