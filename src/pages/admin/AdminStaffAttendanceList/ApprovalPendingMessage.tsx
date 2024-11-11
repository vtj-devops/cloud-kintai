import { Alert, AlertTitle } from "@mui/material";

import { Attendance } from "../../../API";

export function ApprovalPendingMessage({
  attendances,
}: {
  attendances: Attendance[];
}) {
  const hasApprovalPending = attendances.some((attendance) =>
    attendance.changeRequests?.some((item) => !item?.completed)
  );

  if (!hasApprovalPending) return null;

  return (
    <Alert severity="warning">
      <AlertTitle sx={{ fontWeight: "bold" }}>確認してください</AlertTitle>
      未承認の変更リクエストがあります
    </Alert>
  );
}
