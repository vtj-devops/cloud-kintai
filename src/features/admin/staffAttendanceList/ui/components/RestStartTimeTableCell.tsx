import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { styled, TableCell as MuiTableCell } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useContext } from "react";

const TableCell = styled(MuiTableCell)(({ theme }) => ({
  width: theme.spacing(16),
  minWidth: theme.spacing(16),
  textAlign: "right",
}));

export function RestStartTimeTableCell({
  rests,
  paidHolidayFlag,
}: {
  rests: Attendance["rests"];
  paidHolidayFlag: Attendance["paidHolidayFlag"];
}) {
  const { getLunchRestStartTime } = useContext(AppConfigContext);

  const lunchRestStartTime = getLunchRestStartTime().format("H:mm");

  const formattedRestStartTime = (() => {
    if (paidHolidayFlag) return lunchRestStartTime;
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

  return <TableCell>{formattedRestStartTime}</TableCell>;
}
