import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { HolidayCalenderMessage } from "@/lib/message/HolidayCalenderMessage";
import { MessageStatus } from "@/lib/message/Message";

import { HolidayCalendar, UpdateHolidayCalendarInput } from "../../../../API";
import { useAppDispatchV2 } from "../../../../app/hooks";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../../lib/reducers/snackbarReducer";

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

export default function HolidayCalendarEdit({
  holidayCalendar,
  updateHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  updateHolidayCalendar: (
    input: UpdateHolidayCalendarInput
  ) => Promise<HolidayCalendar>;
}) {
  const dispatch = useAppDispatchV2();

  const [editRow, setEditRow] = useState<HolidayCalendar | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!editRow) return;

    setValue("id", editRow.id);
    setValue("holidayDate", dayjs(editRow.holidayDate));
    setValue("name", editRow.name);
  }, [editRow]);

  const onClose = () => {
    setEditRow(null);
  };

  const onSubmit = async (data: Inputs) => {
    const { id, holidayDate, name } = data;

    if (!id || !holidayDate) return;

    const holidayCalenderMessage = new HolidayCalenderMessage();
    await updateHolidayCalendar({
      id: holidayCalendar.id,
      holidayDate: holidayDate.toISOString(),
      name,
    })
      .then(() => {
        dispatch(
          setSnackbarSuccess(
            holidayCalenderMessage.update(MessageStatus.SUCCESS)
          )
        );
        onClose();
      })
      .catch(() => {
        dispatch(
          setSnackbarError(holidayCalenderMessage.update(MessageStatus.ERROR))
        );
      });
  };

  return (
    <>
      <IconButton
        onClick={() => {
          setEditRow(holidayCalendar);
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <Dialog
        open={Boolean(editRow)}
        onClose={() => {
          reset(defaultValues);
          onClose();
        }}
      >
        <DialogTitle>法定休日を編集</DialogTitle>
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
              onClose();
            }}
          >
            キャンセル
          </Button>
          <Button
            disabled={!isValid || !isDirty || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
