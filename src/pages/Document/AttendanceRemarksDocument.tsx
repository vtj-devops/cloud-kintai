import { Box, Stack, Typography } from "@mui/material";

import Title from "../../components/Title/Title";

export default function AttendanceRemarksDocument() {
  return (
    <Stack spacing={2}>
      <Box>
        <Title>勤怠備考の記載方法について</Title>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          勤怠備考欄には勤務状態に応じて記載が必要な事項があります。
        </Typography>
      </Box>
    </Stack>
  );
}
