import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { TableCell } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useContext } from "react";

export function WorkTimeTableCell({ attendance }: { attendance: Attendance }) {
  const { getStartTime, getEndTime } = useContext(AppConfigContext);

  // AppConfigから常に現在の勤務開始/終了時刻を取得して表示に使う
  const defaultStartTime = getStartTime()?.format("H:mm") ?? "9:00";
  const defaultEndTime = getEndTime()?.format("H:mm") ?? "18:00";

  const { paidHolidayFlag, startTime, endTime } = attendance;

  const formattedStartTime = (() => {
    if (paidHolidayFlag) return defaultStartTime;
    if (!startTime) return "";

    const date = dayjs(startTime);
    return date.format("H:mm");
  })();

  const formattedEndTime = (() => {
    if (paidHolidayFlag) return defaultEndTime;
    if (!endTime) return "";

    const date = dayjs(endTime);
    return date.format("H:mm");
  })();

  // 直行/直帰
  const goDirectlyFlag = attendance.goDirectlyFlag ? "直行" : "";
  const returnDirectlyFlag = attendance.returnDirectlyFlag ? "直帰" : "";
  const displayGoReturnDirectly =
    goDirectlyFlag || returnDirectlyFlag
      ? `(${goDirectlyFlag}${returnDirectlyFlag})`
      : "";

  if (!formattedStartTime && !formattedEndTime) {
    return <TableCell />;
  }

  return (
    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {formattedStartTime} 〜 {formattedEndTime}
      {displayGoReturnDirectly}
    </TableCell>
  );
}
