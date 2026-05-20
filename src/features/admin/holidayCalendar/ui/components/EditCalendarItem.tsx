import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { Stack, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import type { MessageGenerator } from "@shared/lib/message/Message";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { AppEditIconButton } from "@shared/ui/button/AppActionIconButton";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { type ReactNode, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type BaseInputs = {
  id: string | null;
  date: dayjs.Dayjs | null;
  name: string;
  description: string;
};

const defaultValues: BaseInputs = {
  id: null,
  date: null,
  name: "",
  description: "",
};

type EditCalendarItemProps<TItem> = {
  item: TItem;
  dialogTitle: string;
  dialogDescription: string;
  nameLabel: string;
  messageFactory: MessageGenerator;
  getDate: (item: TItem) => string;
  getName: (item: TItem) => string;
  getDescription?: (item: TItem) => string;
  buildUpdatePayload: (item: TItem, data: BaseInputs) => TItem;
  updateItem: (input: TItem) => Promise<TItem>;
  renderExtraFields?: (
    register: ReturnType<typeof useForm<BaseInputs>>["register"],
  ) => ReactNode;
};

export function EditCalendarItem<TItem extends { id: string }>({
  item,
  dialogTitle,
  dialogDescription,
  nameLabel,
  messageFactory,
  getDate,
  getName,
  getDescription,
  buildUpdatePayload,
  updateItem,
  renderExtraFields,
}: EditCalendarItemProps<TItem>) {
  const dispatch = useAppDispatchV2();
  const [editRow, setEditRow] = useState<TItem | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<BaseInputs>({ mode: "onChange", defaultValues });

  const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
    isDirty,
    isBusy: isSubmitting,
    onClose: () => {
      reset(defaultValues);
      setEditRow(null);
    },
  });

  useEffect(() => {
    if (!editRow) return;
    setValue("id", editRow.id);
    setValue("date", dayjs(getDate(editRow)));
    setValue("name", getName(editRow));
    setValue("description", getDescription ? getDescription(editRow) : "");
  }, [editRow]);

  const onSubmit = async (data: BaseInputs) => {
    if (!data.id || !data.date) return;
    await updateItem(buildUpdatePayload(item, data))
      .then(() => {
        dispatch(
          pushNotification({
            tone: "success",
            message: messageFactory.update(MessageStatus.SUCCESS),
          }),
        );
        closeWithoutGuard();
      })
      .catch(() => {
        dispatch(
          pushNotification({
            tone: "error",
            message: messageFactory.update(MessageStatus.ERROR),
          }),
        );
      });
  };

  return (
    <>
      <AppEditIconButton onClick={() => setEditRow(item)} />
      {dialog}
      <Dialog open={Boolean(editRow)} onClose={requestClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>{dialogDescription}</DialogContentText>
            <Controller
              name="date"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <DatePicker
                  label="日付"
                  format={AttendanceDate.DisplayFormat}
                  {...field}
                  slotProps={{ textField: { required: true } }}
                  onChange={(date) => field.onChange(date)}
                />
              )}
            />
            <TextField
              label={nameLabel}
              required
              {...register("name", { required: true })}
            />
            {renderExtraFields?.(register)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <AppButton variant="outline" tone="neutral" onClick={requestClose}>
            キャンセル
          </AppButton>
          <AppButton
            disabled={!isValid || !isDirty || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            更新
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
