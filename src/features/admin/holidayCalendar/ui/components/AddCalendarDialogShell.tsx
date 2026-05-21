import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { type ReactNode, useState } from "react";
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  useForm,
  type UseFormRegister,
  useWatch,
} from "react-hook-form";

type DateRangeFormValues = {
  startDate: string;
  endDate: string;
};

type AddCalendarDialogShellProps<TForm extends FieldValues & DateRangeFormValues> = {
  addButtonLabel: string;
  addButtonProps?: {
    variant?: "solid" | "outline" | "ghost";
    tone?: "primary" | "secondary" | "danger" | "neutral";
    size?: "sm" | "md" | "lg";
  };
  dialogTitle: string;
  dialogDescription: ReactNode;
  defaultValues: DefaultValues<TForm>;
  onSubmit: (values: TForm) => Promise<boolean>;
  renderFields: (props: { register: UseFormRegister<TForm> }) => ReactNode;
};

export function AddCalendarDialogShell<TForm extends FieldValues & DateRangeFormValues>({
  addButtonLabel,
  addButtonProps,
  dialogTitle,
  dialogDescription,
  defaultValues,
  onSubmit,
  renderFields,
}: AddCalendarDialogShellProps<TForm>) {
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<TForm>({
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

  const startDateValue = useWatch({
    control,
    name: "startDate" as Path<TForm>,
  });

  const submitAndCloseOnSuccess = async (values: TForm) => {
    const succeeded = await onSubmit(values);
    if (!succeeded) {
      return;
    }

    reset(defaultValues);
    closeWithoutGuard();
  };

  return (
    <>
      <AppButton
        startIcon={<AddCircleOutlineOutlinedIcon />}
        onClick={() => {
          setOpen(true);
        }}
        variant={addButtonProps?.variant}
        tone={addButtonProps?.tone}
        size={addButtonProps?.size}
      >
        {addButtonLabel}
      </AppButton>
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
            <AppButton disabled={!isValid || !isDirty || isSubmitting} onClick={handleSubmit(submitAndCloseOnSuccess)}>
              登録
            </AppButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Controller
            name={"startDate" as Path<TForm>}
            control={control}
            rules={{ required: "開始日は必須項目です。" }}
            render={({ field, fieldState }) => {
              const { ref, value, onChange, name, onBlur, ...rest } = field;

              return (
                <DatePicker
                  {...rest}
                  label="開始日"
                  format={AttendanceDate.DisplayFormat}
                  value={value ? dayjs(value) : null}
                  onChange={(date) => onChange(date ? date.format(AttendanceDate.DataFormat) : "")}
                  slotProps={{
                    textField: {
                      required: true,
                      inputRef: ref,
                      name,
                      onBlur,
                      error: Boolean(fieldState.error),
                      helperText: fieldState.error?.message,
                    },
                  }}
                />
              );
            }}
          />
          <Controller
            name={"endDate" as Path<TForm>}
            control={control}
            rules={{
              validate: (value) => {
                if (!value) {
                  return true;
                }

                if (!startDateValue) {
                  return "開始日を先に入力してください。";
                }

                const start = dayjs(startDateValue, AttendanceDate.DataFormat, true);
                const end = dayjs(value, AttendanceDate.DataFormat, true);

                if (!start.isValid()) {
                  return "開始日はYYYY-MM-DD形式で入力してください。";
                }

                if (!end.isValid()) {
                  return "終了日はYYYY-MM-DD形式で入力してください。";
                }

                if (end.isBefore(start)) {
                  return "終了日は開始日以降の日付を指定してください。";
                }

                return true;
              },
            }}
            render={({ field, fieldState }) => {
              const { ref, value, onChange, name, onBlur, ...rest } = field;

              return (
                <DatePicker
                  {...rest}
                  label="終了日 (任意)"
                  format={AttendanceDate.DisplayFormat}
                  value={value ? dayjs(value) : null}
                  onChange={(date) => onChange(date ? date.format(AttendanceDate.DataFormat) : "")}
                  slotProps={{
                    textField: {
                      inputRef: ref,
                      name,
                      onBlur,
                      error: Boolean(fieldState.error),
                      helperText: fieldState.error?.message,
                    },
                  }}
                />
              );
            }}
          />
          {renderFields({ register })}
        </Stack>
      </AppDialog>
    </>
  );
}
