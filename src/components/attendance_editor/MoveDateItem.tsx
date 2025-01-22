import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, IconButton, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";

export default function MoveDateItem({
  staffId,
  workDate,
}: {
  staffId: string;
  workDate: dayjs.Dayjs | null;
}) {
  const navigate = useNavigate();

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
              `/admin/attendances/edit/${prevDate.format(
                AttendanceDate.QueryParamFormat
              )}/${staffId}`
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
              `/admin/attendances/edit/${date.format(
                AttendanceDate.QueryParamFormat
              )}/${staffId}`
            );
          }
        }}
      />
      <Box>
        <IconButton
          onClick={() => {
            const nextDate = workDate.add(1, "day");
            navigate(
              `/admin/attendances/edit/${nextDate.format(
                AttendanceDate.QueryParamFormat
              )}/${staffId}`
            );
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
