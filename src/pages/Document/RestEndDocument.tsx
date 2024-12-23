import { Box, Card, Stack, Typography } from "@mui/material";

import Title from "../../components/Title/Title";
import rest_end from "../../images/rest_end.gif";

export default function RestEndDocument() {
  return (
    <Stack spacing={2}>
      <Box>
        <Title>休憩終了時の打刻について</Title>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          休憩終了時の打刻方法について説明します。
        </Typography>
        <Typography variant="body1">
          ナビゲーションバーの「勤怠打刻」をクリックして打刻画面を表示します。
        </Typography>
        <Typography variant="body1">
          打刻画面の「休憩終了」をクリックして休憩終了時刻を登録します。
        </Typography>
        <br />
        <Card sx={{ width: "fit-content" }}>
          <img src={rest_end} alt="rest_start" />
        </Card>
      </Box>
    </Stack>
  );
}
