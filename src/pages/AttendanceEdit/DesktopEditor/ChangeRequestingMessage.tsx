import { Alert } from "@mui/material";

import { AttendanceChangeRequest } from "../../../API";

export default function ChangeRequestingAlert({
  changeRequests,
}: {
  changeRequests: AttendanceChangeRequest[];
}) {
  if (changeRequests.length === 0) {
    return null;
  }

  return (
    <Alert severity="warning">
      変更リクエスト申請中です。承認されるまで新しい申請はできません。
    </Alert>
  );
}
