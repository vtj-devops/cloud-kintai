import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  buildHolidayDateRange,
  HolidayDateRangeError,
  MAX_HOLIDAY_RANGE_DAYS,
} from "@features/admin/holidayCalendar/lib/buildHolidayDateRange";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Inputs = {
  startDate: string;
  endDate: string;
  name: string;
};
const defaultValues: Inputs = {
  startDate: "",
  endDate: "",
  name: "",
};
export default function AddCompanyHolidayCalendar({
  createCompanyHolidayCalendar,
  bulkCreateCompanyHolidayCalendar,
}: {
  createCompanyHolidayCalendar: (
    input: CreateCompanyHolidayCalendarInput,
  ) => Promise<CompanyHolidayCalendar>;
  bulkCreateCompanyHolidayCalendar: (
    inputs: CreateCompanyHolidayCalendarInput[],
  ) => Promise<CompanyHolidayCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const startDateValue = watch("startDate");
  const onSubmit = async ({ startDate, endDate, name }: Inputs) => {
    const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();
    const isRangeSubmission = Boolean(endDate);
    try {
      if (isRangeSubmission) {
        const range = buildHolidayDateRange(startDate, endDate);
        const inputs = range.map((holidayDate) => ({ holidayDate, name }));
        await bulkCreateCompanyHolidayCalendar(inputs);
        const successMessage = `${companyHolidayCalendarMessage.getCategoryName()}を${range.length}件作成しました`;
        dispatch(
          pushNotification({
            tone: "success",
            message: successMessage,
          }),
        );
      } else {
        const [holidayDate] = buildHolidayDateRange(startDate);
        await createCompanyHolidayCalendar({ holidayDate, name });
        dispatch(
          pushNotification({
            tone: "success",
            message: companyHolidayCalendarMessage.create(
              MessageStatus.SUCCESS,
            ),
          }),
        );
      }
      reset(defaultValues);
      closeWithoutGuard();
    } catch (error) {
      if (error instanceof HolidayDateRangeError) {
        dispatch(
          pushNotification({
            tone: "error",
            message: error.message,
          }),
        );
        return;
      }
      dispatch(
        pushNotification({
          tone: "error",
          message: companyHolidayCalendarMessage.create(MessageStatus.ERROR),
        }),
      );
    }
  };
  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddCircleOutlineOutlinedIcon />}
        onClick={() => {
          setOpen(true);
        }}
      >
        休日を追加
      </Button>
      {dialog}
      <Dialog open={open} onClose={requestClose}>
        <DialogTitle>会社休日を追加</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              休日としたい日付と休日名を入力してください。
            </DialogContentText>
            <DialogContentText>
              {`開始日のみ入力した場合は単日登録、終了日を指定すると開始日から終了日までをまとめて登録します（最大${MAX_HOLIDAY_RANGE_DAYS}日）。`}
            </DialogContentText>
            <Controller
              name="startDate"
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
                    onChange={(date) =>
                      onChange(
                        date ? date.format(AttendanceDate.DataFormat) : "",
                      )
                    }
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
              name="endDate"
              control={control}
              rules={{
                validate: (value) => {
                  if (!value) {
                    return true;
                  }
                  if (!startDateValue) {
                    return "開始日を先に入力してください。";
                  }
                  const start = dayjs(
                    startDateValue,
                    AttendanceDate.DataFormat,
                    true,
                  );
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
                    onChange={(date) =>
                      onChange(
                        date ? date.format(AttendanceDate.DataFormat) : "",
                      )
                    }
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
            <TextField
              label="休日名"
              required
              {...register("name", {
                required: true,
              })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose}>キャンセル</Button>
          <Button
            disabled={!isValid || !isDirty || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            登録
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
