import { Stack, styled, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useState } from "react";
import { Controller } from "react-hook-form";

import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import { AttendanceEditContext } from "@/features/attendance/edit/model/AttendanceEditProvider";

const Label = styled(Typography)(() => ({
  width: "150px",
  fontWeight: "bold",
}));

export function SubstituteHolidayDateInput() {
  const { control, setValue, restReplace, changeRequests, readOnly } =
    useContext(AttendanceEditContext);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);

  if (!control || !setValue || !restReplace) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0} alignItems={"center"}>
      <Label variant="body1">振替休日</Label>
      <Controller
        name="substituteHolidayDate"
        control={control}
        render={({ field, fieldState }) => {
          const { value, onChange, ...restField } = field;

          return (
            <>
              <DatePicker
                {...restField}
                label="勤務した日"
                format={AttendanceDate.DisplayFormat}
                value={value ? dayjs(value) : null}
                slotProps={{
                  textField: {
                    size: "small",
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                    sx: {
                      "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor: "divider",
                        },
                      "& .MuiOutlinedInput-root.Mui-error:hover .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor: "divider",
                        },
                      "& .MuiOutlinedInput-root.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor: "divider",
                        },
                    },
                  },
                }}
                disabled={changeRequests.length > 0 || !!readOnly}
                onChange={(date) => {
                  // ピッカー内で一時的に Dayjs が渡されるのを防ぎ、明示的なクリアのみ即時反映
                  if (!date) {
                    onChange(null);
                  }
                }}
                onAccept={(date) => {
                  if (readOnly) return;
                  // 新しい日付が設定された場合は確認ダイアログを表示し、
                  // ユーザーが承認したときのみフォーム値とフラグをクリアする
                  if (date) {
                    setPendingDate(date);
                    setConfirmOpen(true);
                  } else {
                    // クリアした場合はそのまま反映
                    onChange(null);
                  }
                }}
              />

              <Dialog
                open={confirmOpen}
                onClose={() => {
                  setConfirmOpen(false);
                  setPendingDate(null);
                }}
                aria-labelledby="confirm-clear-dialog"
              >
                <DialogTitle id="confirm-clear-dialog">
                  一部の入力内容をクリアします
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    振替休日を設定すると、以下の入力内容がクリアされます。
                    <ul>
                      <li>勤務開始・終了時刻</li>
                      <li>休憩時間</li>
                      <li>有給フラグ</li>
                      <li>直行フラグ</li>
                      <li>直帰フラグ</li>
                    </ul>
                    よろしいですか？
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      if (pendingDate) {
                        onChange(pendingDate.format(AttendanceDate.DataFormat));
                      }

                      setConfirmOpen(false);
                      setPendingDate(null);
                    }}
                  >
                    クリアせず設定
                  </Button>
                  <Button
                    onClick={() => {
                      if (readOnly) {
                        setConfirmOpen(false);
                        setPendingDate(null);
                        return;
                      }

                      if (pendingDate) {
                        onChange(pendingDate.format(AttendanceDate.DataFormat));

                        setValue("paidHolidayFlag", false);
                        setValue("goDirectlyFlag", false);
                        setValue("returnDirectlyFlag", false);
                        setValue("startTime", null);
                        setValue("endTime", null);
                        restReplace([]);
                      }

                      setConfirmOpen(false);
                      setPendingDate(null);
                    }}
                    autoFocus
                  >
                    クリアして設定
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          );
        }}
      />
    </Stack>
  );
}
