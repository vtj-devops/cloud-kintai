import { Alert, Button } from "@mui/material";
import { useContext } from "react";
import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export function LunchRestTimeNotSetWarning({
  targetWorkDate,
}: {
  targetWorkDate: string | undefined;
}) {
  const { restAppend } = useContext(AttendanceEditContext);

  const handleButtonClick = () => {
    if (!targetWorkDate || !restAppend) {
      return;
    }

    restAppend({
      startTime: new AttendanceDateTime()
        .setDateString(targetWorkDate)
        .setRestStart()
        .toISOString(),
      endTime: new AttendanceDateTime()
        .setDateString(targetWorkDate)
        .setRestEnd()
        .toISOString(),
    });
  };

  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={handleButtonClick}>
          昼休みを追加
        </Button>
      }
    >
      勤務時間が6時間を超えています。休憩時間を確認をしてください。
    </Alert>
  );
}
