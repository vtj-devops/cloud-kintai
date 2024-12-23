import { Box, Stack, styled, TextField, Typography } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "../AttendanceEditProvider";

const Label = styled(Typography)(() => ({
  width: "150px",
  fontWeight: "bold",
}));

export default function RemarksInput() {
  const { register, changeRequests } = useContext(AttendanceEditContext);

  if (!register) {
    return null;
  }

  return (
    <Stack direction="row" alignItems={"center"}>
      <Label>備考</Label>
      <Box sx={{ flexGrow: 2 }}>
        <TextField
          multiline
          minRows={2}
          fullWidth
          placeholder="備考欄：客先名やイベント名などを記載"
          sx={{ width: 1 }}
          disabled={changeRequests.length > 0}
          {...register("remarks")}
        />
      </Box>
    </Stack>
  );
}
