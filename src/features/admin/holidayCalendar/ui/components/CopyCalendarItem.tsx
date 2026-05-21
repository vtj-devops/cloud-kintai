import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import type { MessageGenerator } from "@shared/lib/message/Message";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import { AppCopyIconButton } from "@shared/ui/button/AppActionIconButton";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { type ReactNode, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type BaseCopyInputs = {
  date: string;
  name: string;
  description: string;
};

const defaultValues: BaseCopyInputs = {
  date: "",
  name: "",
  description: "",
};

type CopyCalendarItemProps<TItem, TInput> = {
  item: TItem;
  dialogTitle: string;
  dialogDescription: string;
  nameLabel: string;
  submitLabel?: string;
  messageFactory: MessageGenerator;
  getDate: (item: TItem) => string;
  getName: (item: TItem) => string;
  getDescription?: (item: TItem) => string;
  serializeDate?: (date: dayjs.Dayjs) => string;
  showDatePickerError?: boolean;
  buildCreateInput: (data: BaseCopyInputs) => TInput;
  createItem: (input: TInput) => Promise<unknown>;
  renderExtraFields?: (
    register: ReturnType<typeof useForm<BaseCopyInputs>>["register"],
  ) => ReactNode;
};

export function CopyCalendarItem<TItem, TInput>({
  item,
  dialogTitle,
  dialogDescription,
  nameLabel,
  submitLabel = "登録",
  messageFactory,
  getDate,
  getName,
  getDescription,
  serializeDate,
  showDatePickerError = false,
  buildCreateInput,
  createItem,
  renderExtraFields,
}: CopyCalendarItemProps<TItem, TInput>) {
  const dispatch = useAppDispatchV2();
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<BaseCopyInputs>({ mode: "onChange", defaultValues });

  const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
    isDirty,
    isBusy: isSubmitting,
    onClose: () => {
      reset(defaultValues);
      setOpen(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    setValue("date", getDate(item) ?? "");
    setValue("name", getName(item) ?? "");
    setValue("description", getDescription ? (getDescription(item) ?? "") : "");
  }, [open, item, setValue]);

  const serialize = serializeDate ?? ((d: dayjs.Dayjs) => d.toISOString());

  const onSubmit = async (data: BaseCopyInputs) => {
    await createItem(buildCreateInput(data))
      .then(() => {
        dispatch(
          pushNotification({
            tone: "success",
            message: messageFactory.create(MessageStatus.SUCCESS),
          }),
        );
        closeWithoutGuard();
      })
      .catch(() => {
        dispatch(
          pushNotification({
            tone: "error",
            message: messageFactory.create(MessageStatus.ERROR),
          }),
        );
      });
  };

  return (
    <>
      <AppCopyIconButton onClick={() => setOpen(true)} />
      {dialog}
      <AppDialog
        open={open}
        onClose={requestClose}
        title={dialogTitle}
        description={dialogDescription}
        actions={
          <>
            <AppButton variant="outline" tone="neutral" onClick={requestClose}>
              キャンセル
            </AppButton>
            <AppButton
              disabled={!isValid || !isDirty || isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {submitLabel}
            </AppButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="date"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => {
              const { ref, value, onChange, name, onBlur, ...rest } = field;
              return (
                <DatePicker
                  {...rest}
                  label="日付"
                  format={AttendanceDate.DisplayFormat}
                  value={value ? dayjs(value) : null}
                  onChange={(date) => onChange(date ? serialize(date) : "")}
                  slotProps={{
                    textField: {
                      required: true,
                      inputRef: ref,
                      name,
                      onBlur,
                      ...(showDatePickerError && {
                        error: Boolean(fieldState.error),
                        helperText: fieldState.error?.message,
                      }),
                    },
                  }}
                />
              );
            }}
          />
          <TextField
            label={nameLabel}
            required
            {...register("name", { required: true })}
          />
          {renderExtraFields?.(register)}
        </Stack>
      </AppDialog>
    </>
  );
}
