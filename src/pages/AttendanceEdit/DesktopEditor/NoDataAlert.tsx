import { Alert, AlertTitle, Box } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "../AttendanceEditProvider";

export default function NoDataAlert() {
  const { attendance } = useContext(AttendanceEditContext);

  if (attendance !== null) {
    return null;
  }

  return (
    <Box>
      <Alert severity="info">
        <AlertTitle>お知らせ</AlertTitle>
        指定された日付に勤怠情報の登録がありませんでした。保存時に新規作成されます。
      </Alert>
    </Box>
  );
}
