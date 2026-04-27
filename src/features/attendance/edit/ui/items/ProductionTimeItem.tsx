import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { Box, Stack, Typography } from "@mui/material";
import { useContext } from "react";

export default function ProductionTimeItem({
  time,
  hourlyPaidHolidayHours,
}: {
  time: number;
  hourlyPaidHolidayHours?: number | null;
}) {
  const { getHourlyPaidHolidayEnabled } = useContext(AppConfigContext);
  const hourlyPaidHolidayEnabled = getHourlyPaidHolidayEnabled();
  return (
    <Stack direction="row" alignItems={"top"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>実稼働時間</Box>
      <Box sx={{ flexGrow: 2 }} textAlign={"right"}>
        <Typography variant="body1">{`${time.toFixed(1)}時間`}</Typography>
        {hourlyPaidHolidayEnabled &&
          hourlyPaidHolidayHours != null &&
          hourlyPaidHolidayHours > 0 && (
            <Typography variant="body1">{`時間休暇 ${formatHoursToDecimal(
              hourlyPaidHolidayHours
            )}`}</Typography>
          )}
      </Box>
    </Stack>
  );
}

function formatHoursToDecimal(hours: number) {
  if (hours == null || hours <= 0) return `0.0時間`;
  return `${hours.toFixed(1)}時間`;
}
