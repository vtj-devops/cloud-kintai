import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { HolidayCalenderMessage } from "@/lib/message/HolidayCalenderMessage";
import { MessageStatus } from "@/lib/message/Message";

import { CreateHolidayCalendarInput, HolidayCalendar } from "../../../../API";
import { useAppDispatchV2 } from "../../../../app/hooks";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../../lib/reducers/snackbarReducer";

type Inputs = {
  holidayDate: string;
  name: string;
};

const defaultValues: Inputs = {
  holidayDate: "",
  name: "",
};

export function AddHolidayCalendar({
  createHolidayCalendar,
}: {
  createHolidayCalendar: (
    input: CreateHolidayCalendarInput
  ) => Promise<void | HolidayCalendar>;
}) {
  const dispatch = useAppDispatchV2();
  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = async (data: Inputs) => {
    const holidayCalenderMessage = new HolidayCalenderMessage();
    await createHolidayCalendar(data)
      .then(() => {
        dispatch(
          setSnackbarSuccess(
            holidayCalenderMessage.create(MessageStatus.SUCCESS)
          )
        );
        setOpen(false);
      })
      .catch(() =>
        dispatch(
          setSnackbarError(holidayCalenderMessage.create(MessageStatus.ERROR))
        )
      );
  };

  return (
    <>
      <Button
        variant="outlined"
        size="medium"
        startIcon={<AddCircleOutlineOutlinedIcon />}
        onClick={() => setOpen(true)}
      >
        休日を追加
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          reset(defaultValues);
          handleClose();
        }}
      >
        <DialogTitle>会社休日を追加</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              休日としたい日付と休日名を入力してください。
            </DialogContentText>
            <Controller
              name="holidayDate"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <DatePicker
                  label="日付"
                  format={AttendanceDate.DisplayFormat}
                  {...field}
                  slotProps={{
                    textField: {
                      required: true,
                    },
                  }}
                  onChange={(date) => field.onChange(date)}
                />
              )}
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
          <Button
            onClick={() => {
              reset(defaultValues);
              handleClose();
            }}
          >
            キャンセル
          </Button>
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
