import Box from "@mui/material/Box";
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
import { Label } from "@/features/attendance/edit/ui/mobile/Label";

export function SubstituteHolidayDateInput() {
  const { control, setValue, restReplace } = useContext(AttendanceEditContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null);

  if (!control || !setValue || !restReplace) {
    return null;
  }

  return (
    <>
      <Label variant="body1">振替休暇</Label>
      <Box sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>
        勤務した日を指定して振替休日を設定します。設定すると該当日は休暇扱いとなり、一部の入力がクリアされます。
      </Box>
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
                onChange={(date) => {
                  // ピッカー内で渡される Dayjs をそのまま保持しない。クリア時のみ即時反映。
                  if (!date) {
                    onChange(null);
                  }
                }}
                onAccept={(date) => {
                  // 新しい日付が設定された場合は確認ダイアログを表示し、
                  // ユーザーが承認したときのみフォーム値とフラグをクリアする
                  if (date) {
                    setPendingDate(date);
                    setConfirmOpen(true);
                  } else {
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
                aria-labelledby="confirm-clear-dialog-mobile"
              >
                <DialogTitle id="confirm-clear-dialog-mobile">
                  振替休日を設定します
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    以下の方法を選択してください。
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      setConfirmOpen(false);
                      setPendingDate(null);
                    }}
                  >
                    キャンセル
                  </Button>
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
    </>
  );
}
