import { Box, Stack, TextField } from "@mui/material";
import { useState } from "react";

export default function ReasonRemarksItem() {
  const [reasonRemarks, setReasonRemarks] = useState<string>("");

  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>修正備考</Box>
      <Box sx={{ flexGrow: 2 }}>
        <TextField
          multiline
          minRows={2}
          fullWidth
          value={reasonRemarks}
          placeholder="修正時の補足事項などを記載"
          sx={{ width: 1 }}
          onChange={(e) => setReasonRemarks(e.target.value)}
        />
      </Box>
    </Stack>
  );
}
