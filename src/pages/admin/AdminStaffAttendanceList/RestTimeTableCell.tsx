import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { Attendance } from "@/API";

export function RestTimeTableCell({ attendance }: { attendance: Attendance }) {
  const { paidHolidayFlag, rests } = attendance;

  const formattedRestStartTime = (() => {
    if (paidHolidayFlag) return "12:00";
    if (!rests) return "";

    const filteredRests = rests.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );
    if (filteredRests.length === 0) return "";

    const latestRest = filteredRests[filteredRests.length - 1];

    if (!latestRest.startTime) return "";

    const date = dayjs(latestRest.startTime);
    return date.format("H:mm");
  })();

  const formattedRestEndTime = (() => {
    if (paidHolidayFlag) return "13:00";
    if (!rests) return "";

    const filteredRests = rests.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    if (filteredRests.length === 0) return "";

    const latestRest = filteredRests[filteredRests.length - 1];

    if (!latestRest.endTime) return "";

    const date = dayjs(latestRest.endTime);
    return date.format("H:mm");
  })();

  if (!formattedRestStartTime && !formattedRestEndTime) {
    return <TableCell />;
  }

  return (
    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {formattedRestStartTime} 〜 {formattedRestEndTime}
    </TableCell>
  );
}
