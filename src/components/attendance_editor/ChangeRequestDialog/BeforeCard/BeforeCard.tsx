import {
  Card,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

import { Attendance } from "../../../../API";
import GoDirectlyFlagTableRow from "./GoDirectlyFlagTableRow";
import PaidHolidayFlagTableRow from "./PaidHolidayFlagTableRow";
import RemarksTableRow from "./RemarksTableRow";
import RestTableRow from "./RestTableRow";
import ReturnDirectlyFlagTableRow from "./ReturnDirectlyFlagTableRow";
import SubstituteHolidayDateTableRow from "./SubstituteHolidayFlagDateRow";
import WorkTimeTableRow from "./WorkTimeTableRow";

export default function BeforeCard({
  attendance,
}: {
  attendance: Attendance | null;
}) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        変更前
      </Typography>
      <TableContainer>
        <Table>
          <TableBody>
            <PaidHolidayFlagTableRow value={attendance?.paidHolidayFlag} />
            <SubstituteHolidayDateTableRow
              value={attendance?.substituteHolidayDate}
            />
            <GoDirectlyFlagTableRow value={attendance?.goDirectlyFlag} />
            <ReturnDirectlyFlagTableRow
              value={attendance?.returnDirectlyFlag}
            />
            <WorkTimeTableRow
              startTime={
                attendance?.startTime ? dayjs(attendance.startTime) : null
              }
              endTime={attendance?.endTime ? dayjs(attendance.endTime) : null}
            />
            <RestTableRow
              rests={
                attendance?.rests
                  ? attendance.rests.filter(
                      (item): item is NonNullable<typeof item> => item !== null
                    )
                  : []
              }
            />
            <RemarksTableRow value={attendance?.remarks} />
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
