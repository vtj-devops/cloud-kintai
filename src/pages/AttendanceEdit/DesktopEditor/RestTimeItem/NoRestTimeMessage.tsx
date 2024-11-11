import { Box, Typography } from "@mui/material";
import { FieldArrayWithId } from "react-hook-form";

import { AttendanceEditInputs } from "../../common";

export default function NoRestTimeMessage({
  restFields,
}: {
  restFields: FieldArrayWithId<AttendanceEditInputs, "rests", "id">[];
}) {
  if (restFields.length >= 1) {
    return null;
  }

  return (
    <Box>
      <Typography variant="body1">休憩時間はありません</Typography>
      <Typography variant="body1">
        ※昼休憩は退勤打刻の際に12:00〜13:00で自動打刻されます
      </Typography>
    </Box>
  );
}
