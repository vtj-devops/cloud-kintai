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
import { CompanyHolidayCalendar, } from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useDialogCloseGuard } from "@/hooks/useDialogCloseGuard";

type Inputs = {
    id: string | null;
    holidayDate: dayjs.Dayjs | null;
    name: string;
};
const defaultValues: Inputs = {
    id: null,
    holidayDate: null,
    name: "",
};
export default function CompanyHolidayCalendarEdit({ holidayCalendar, updateCompanyHolidayCalendar, }: {
    holidayCalendar: CompanyHolidayCalendar;
    updateCompanyHolidayCalendar: (input: CompanyHolidayCalendar) => Promise<CompanyHolidayCalendar>;
}) {
    const dispatch = useAppDispatchV2();
    const [editRow, setEditRow] = useState<CompanyHolidayCalendar | null>(null);
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
        setValue("holidayDate", dayjs(editRow.holidayDate));
        setValue("name", editRow.name);
    }, [editRow]);
    const onClose = () => {
        setEditRow(null);
    };
    const onSubmit = async (data: Inputs) => {
        const { id, holidayDate } = data;
        if (!id || !holidayDate)
            return;
        const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();
        await updateCompanyHolidayCalendar({
            ...holidayCalendar,
            id,
            holidayDate: holidayDate.format(AttendanceDate.DataFormat),
            name: data.name,
        })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: companyHolidayCalendarMessage.update(MessageStatus.SUCCESS)
            }));
            closeWithoutGuard();
        })
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: companyHolidayCalendarMessage.update(MessageStatus.ERROR)
        })));
    };
    return (<>
      <AppIconButton onClick={() => {
            setEditRow(holidayCalendar);
        }} aria-label="編集">
        <EditIcon fontSize="small"/>
      </AppIconButton>
      {dialog}
      <Dialog open={Boolean(editRow)} onClose={requestClose}>
        <DialogTitle>会社休日を編集</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              休日としたい日付と休日名を入力してください。
            </DialogContentText>
            <Controller name="holidayDate" control={control} rules={{ required: true }} render={({ field }) => (<DatePicker label="日付" format={AttendanceDate.DisplayFormat} {...field} slotProps={{
                textField: {
                    required: true,
                },
            }} onChange={(date) => field.onChange(date)}/>)}/>
            <TextField label="休日名" required {...register("name", {
        required: true,
    })}/>
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
