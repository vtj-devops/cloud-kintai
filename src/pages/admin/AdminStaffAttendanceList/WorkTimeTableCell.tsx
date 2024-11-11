import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { Attendance } from "@/API";

export function WorkTimeTableCell({ attendance }: { attendance: Attendance }) {
  const { paidHolidayFlag, startTime, endTime } = attendance;

  const formattedStartTime = (() => {
    if (paidHolidayFlag) return "9:00";
    if (!startTime) return "";

    const date = dayjs(startTime);
    return date.format("H:mm");
  })();

  const formattedEndTime = (() => {
    if (paidHolidayFlag) return "18:00";
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
