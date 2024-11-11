import { Stack, Typography } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

export default function StaffNameItem() {
  const { staff } = useContext(AttendanceEditContext);

  if (!staff?.familyName && !staff?.givenName) {
    return null;
  }

  return (
    <Stack direction="row" alignItems="center">
      <Typography variant="body1" sx={{ fontWeight: "bold", width: "150px" }}>
        スタッフ
      </Typography>
      <Typography variant="body1">
        {`${staff.familyName} ${staff.givenName}`}
      </Typography>
    </Stack>
  );
}
