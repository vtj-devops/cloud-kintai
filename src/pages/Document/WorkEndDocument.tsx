import { Box, Card, Stack, Typography } from "@mui/material";

import Title from "../../components/Title/Title";
import work_end from "../../images/work_end.gif";

export default function WorkEndDocument() {
  return (
    <Stack spacing={2}>
      <Box>
        <Title>勤務終了時の打刻について</Title>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          通常の退勤時の打刻方法について説明します。直帰の場合は、直帰の打刻方法を参照してください。
        </Typography>
        <Typography variant="body1">
          ナビゲーションバーの「勤怠打刻」をクリックして打刻画面を表示します。
        </Typography>
        <Typography variant="body1">
          打刻画面の「勤務終了」をクリックして退勤時刻を登録します。
        </Typography>
        <br />
        <Card sx={{ width: "fit-content" }}>
          <img src={work_end} alt="work_end" />
        </Card>
      </Box>
    </Stack>
  );
}
