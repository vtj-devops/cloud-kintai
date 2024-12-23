import { TextField } from "@mui/material";
import { UseFormRegister } from "react-hook-form";

import { AttendanceEditInputs } from "../common";

export default function RemarksInput({
  register,
}: {
  register: UseFormRegister<AttendanceEditInputs>;
}) {
  return (
    <TextField
      multiline
      minRows={2}
      fullWidth
      placeholder="備考欄：客先名やイベント名などを記載"
      sx={{ width: 1 }}
      {...register("remarks")}
    />
  );
}
