import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, IconButton, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { AttendanceDate } from "@/lib/AttendanceDate";

type MoveDateItemProps = {
  workDate: dayjs.Dayjs;
};

export default function MoveDateItem(props: MoveDateItemProps) {
  const navigate = useNavigate();

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box>
        <IconButton
          onClick={() => {
            const prevDate = props.workDate.add(-1, "day");
            navigate(
              `/admin/attendances/${prevDate.format(
                AttendanceDate.QueryParamFormat
              )}`
            );
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <DatePicker
        value={props.workDate}
        format={AttendanceDate.DisplayFormat}
        slotProps={{
          textField: { size: "small" },
        }}
        onChange={(date) => {
          if (date) {
            navigate(
              `/admin/attendances/${date.format(
                AttendanceDate.QueryParamFormat
              )}`
            );
          }
        }}
      />
      <Box>
        <IconButton
          onClick={() => {
            const nextDate = props.workDate.add(1, "day");
            navigate(
              `/admin/attendances/${nextDate.format(
                AttendanceDate.QueryParamFormat
              )}`
            );
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
