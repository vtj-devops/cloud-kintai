import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { Attendance } from "../../../API";

export function SummaryTableCell({
  paidHolidayFlag,
  substituteHolidayDate,
  remarks,
}: {
  paidHolidayFlag: Attendance["paidHolidayFlag"];
  substituteHolidayDate: Attendance["substituteHolidayDate"];
  remarks: Attendance["remarks"];
}) {
  return (
    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {getSummaryText(paidHolidayFlag, substituteHolidayDate, remarks)}
    </TableCell>
  );
}

function getSummaryText(
  paidHolidayFlag: Attendance["paidHolidayFlag"],
  substituteHolidayDate: Attendance["substituteHolidayDate"],
  remarks: string | null | undefined
) {
  const isSubstituteHoliday = substituteHolidayDate
    ? dayjs(substituteHolidayDate).isValid()
    : false;

  return (() => {
    const summaryMessage = [];
    if (paidHolidayFlag) summaryMessage.push("有給休暇");
    if (isSubstituteHoliday) summaryMessage.push("振替休日");
    if (remarks) summaryMessage.push(remarks);

    return summaryMessage.join(" ");
  })();
}
