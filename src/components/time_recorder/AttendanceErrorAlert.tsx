import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Alert, AlertTitle, IconButton, Typography } from "@mui/material";

export function AttendanceErrorAlert() {
  return (
    <Alert
      severity="error"
      action={
        <IconButton onClick={() => window.open("/attendance/list", "_blank")}>
          <OpenInNewIcon />
        </IconButton>
      }
    >
      <AlertTitle>勤怠打刻エラー</AlertTitle>
      <Typography variant="body2">
        打刻エラーがあります。勤怠一覧を確認してください。(画面更新時に反映されます)
      </Typography>
    </Alert>
  );
}
