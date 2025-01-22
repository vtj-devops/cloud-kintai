import { Box, Stack } from "@mui/material";
import dayjs from "dayjs";

import MoveDateItem from "../MoveDateItem";

export default function WorkDateItem({
  staffId,
  workDate,
}: {
  staffId: string;
  workDate: dayjs.Dayjs | null;
}) {
  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>勤務日</Box>
      <Box>
        <MoveDateItem staffId={staffId} workDate={workDate} />
      </Box>
    </Stack>
  );
}
