import { Box, Card, Stack, Typography } from "@mui/material";

import Title from "../../components/Title/Title";
import go_direct from "../../images/go_direct.gif";

export default function GoDirectDocument() {
  return (
    <Stack spacing={2}>
      <Box>
        <Title>直行直帰について</Title>
      </Box>
      <Box>
        <Typography variant="body1">
          直行時の打刻方法について説明します。
        </Typography>
        <Typography variant="body1">
          ナビゲーションバーの「勤怠打刻」をクリックして打刻画面を表示します。
        </Typography>
        <Typography variant="body1">
          打刻画面の「直行」をクリックして直行時刻を登録します。
        </Typography>
      </Box>
      <Card sx={{ width: "fit-content" }}>
        <img src={go_direct} alt="go_direct" />
      </Card>
    </Stack>
  );
}
