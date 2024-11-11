import { Box, Card, Stack, Typography } from "@mui/material";

import Title from "../../components/Title/Title";
import work_start from "../../images/work_start.gif";

export default function WorkStartDocument() {
  return (
    <Stack spacing={2}>
      <Box>
        <Title>通常の勤務開始時の打刻について</Title>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          通常の出勤時の打刻方法について説明します。直行の場合は、直行の打刻方法を参照してください。
        </Typography>
        <Typography variant="body1">
          ナビゲーションバーの「勤怠打刻」をクリックして打刻画面を表示します。
        </Typography>
        <Typography variant="body1">
          打刻画面の「勤務開始」をクリックして出勤時刻を登録します。
        </Typography>
        <br />
        <Card sx={{ width: "fit-content" }}>
          <img src={work_start} alt="work_start" />
        </Card>
      </Box>
    </Stack>
  );
}
