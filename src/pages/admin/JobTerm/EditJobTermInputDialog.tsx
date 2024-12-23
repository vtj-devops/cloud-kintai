import { Autocomplete, Box, Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { CloseDate, UpdateCloseDateInput } from "../../../API";
import { useAppDispatchV2 } from "../../../app/hooks";
import * as MESSAGE_CODE from "../../../errors";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../lib/reducers/snackbarReducer";
import { defaultValues, Inputs } from "./common";

export default function EditJobTermInputDialog({
  targetData,
  open,
  onClose,
  candidateCloseDates,
  updateCloseDate,
}: {
  targetData: CloseDate | null;
  open: boolean;
  onClose: () => void;
  candidateCloseDates: dayjs.Dayjs[];
  updateCloseDate: (input: UpdateCloseDateInput) => Promise<void>;
}) {
  const dispatch = useAppDispatchV2();

  const {
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = (data: Inputs) => {
    if (
      !targetData?.id ||
      !data.closeDate ||
      !data.startDate ||
      !data.endDate
    ) {
      return;
    }

    updateCloseDate({
      id: targetData.id,
      closeDate: data.closeDate.toISOString(),
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
    })
      .then(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.S09003));
        onClose();
      })
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E09003)));
  };

  useEffect(() => {
    if (!targetData) {
      reset(defaultValues);
      return;
    }

    setValue("closeDate", dayjs(targetData.closeDate));
    setValue("startDate", dayjs(targetData.startDate));
    setValue("endDate", dayjs(targetData.endDate));
  }, [targetData]);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>集計対象月を変更</DialogTitle>
        <DialogContent>
          <DialogContentText>
            変更する集計対象月の情報を入力してください。
          </DialogContentText>
          <Stack spacing={2}>
            <Box>
              <Controller
                name="closeDate"
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    options={candidateCloseDates}
                    value={value}
                    getOptionLabel={(option) => option.format("YYYY/MM")}
                    onChange={(e, v) => {
                      if (!v) return;
                      onChange(v);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="集計対象月" />
                    )}
                  />
                )}
              />
            </Box>
            <Box>
              <Stack spacing={2} direction="row" alignItems="center">
                <Box>
                  <Controller
                    name="startDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        label="開始日"
                        format={AttendanceDate.DisplayFormat}
                        {...field}
                      />
                    )}
                  />
                </Box>
                <Box>〜</Box>
                <Box>
                  <Controller
                    name="endDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        label="終了日"
                        format={AttendanceDate.DisplayFormat}
                        {...field}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button
            disabled={!isValid || !isDirty || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            変更
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
