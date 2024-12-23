import { Alert, AlertTitle, Typography } from "@mui/material";

export function RestTimeMessage() {
  return (
    <Alert severity="info">
      <AlertTitle>昼休憩は退勤時に自動打刻されます</AlertTitle>
      <Typography variant="body2">
        修正する際は、変更リクエストまたは、管理者へ問い合わせてください。
      </Typography>
    </Alert>
  );
}
