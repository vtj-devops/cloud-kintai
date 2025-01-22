import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, IconButton, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";

export default function MoveDateItem({
  workDate,
}: {
  workDate: dayjs.Dayjs | null;
}) {
  const navigate = useNavigate();
  const today = dayjs();

  if (!workDate) {
    return null;
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box>
        <IconButton
          onClick={() => {
            const prevDate = workDate.add(-1, "day");
            navigate(
              `/attendance/${prevDate.format(
                AttendanceDate.QueryParamFormat
              )}/edit`
            );
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <DatePicker
        value={workDate}
        format={AttendanceDate.DisplayFormat}
        slotProps={{
          textField: { size: "small" },
        }}
        onChange={(date) => {
          if (date) {
            navigate(
              `/attendance/${date.format(AttendanceDate.QueryParamFormat)}/edit`
            );
          }
        }}
      />
      <Box>
        <IconButton
          disabled={workDate.isSame(today, "day")}
          onClick={() => {
            const nextDate = workDate.add(1, "day");
            navigate(
              `/attendance/${nextDate.format(
                AttendanceDate.QueryParamFormat
              )}/edit`
            );
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
