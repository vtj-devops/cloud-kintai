import { Box, Stack, Typography } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import MoveDateItem from "../MoveDateItem";

export default function WorkDateItem() {
  const { workDate } = useContext(AttendanceEditContext);

  if (!workDate) return null;

  return (
    <Stack direction="row" alignItems={"center"}>
      <Typography variant="body1" sx={{ fontWeight: "bold", width: "150px" }}>
        勤務日
      </Typography>
      <Box>
        <MoveDateItem workDate={workDate} />
      </Box>
    </Stack>
  );
}
