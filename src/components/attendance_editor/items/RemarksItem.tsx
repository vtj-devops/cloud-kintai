import { Box, Stack, TextField } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function RemarksItem() {
  const { register } = useContext(AttendanceEditContext);

  if (!register) {
    return null;
  }

  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>備考</Box>
      <Box sx={{ flexGrow: 2 }}>
        <TextField
          multiline
          minRows={2}
          fullWidth
          placeholder="備考欄：客先名やイベント名などを記載"
          sx={{ width: 1 }}
          {...register("remarks")}
        />
      </Box>
    </Stack>
  );
}
