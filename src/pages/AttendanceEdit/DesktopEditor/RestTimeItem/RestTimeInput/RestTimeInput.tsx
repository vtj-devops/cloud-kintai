import DeleteIcon from "@mui/icons-material/Delete";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { FieldArrayWithId } from "react-hook-form";

import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

import { AttendanceEditInputs } from "../../../common";
import RestEndTimeInput from "./RestEndTimeInput";
import RestStartTimeInput from "./RestStartTimeInput";

export function calcTotalRestTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined
) {
  if (!startTime) return 0;

  const now = dayjs();
  const diff = dayjs(endTime || now).diff(dayjs(startTime), "hour", true);
  return diff;
}

export function RestTimeInput({
  rest,
  index,
}: {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
}) {
  const { restRemove, changeRequests, watch } = useContext(
    AttendanceEditContext
  );
  const [totalRestTime, setTotalRestTime] = useState<number>(0);

  useEffect(() => {
    if (!watch) return;

    watch((data) => {
      if (!data.rests) return;

      const rest = data.rests[index];
      if (!rest) return;

      const diff = calcTotalRestTime(rest.startTime, rest.endTime);
      setTotalRestTime(diff);
    });
  }, [watch]);

  if (!restRemove) return null;

  return (
    <Box>
      <Stack direction="row" spacing={1}>
        <Box>
          <IconButton
            aria-label="staff-search"
            disabled={changeRequests.length > 0}
            onClick={() => restRemove(index)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
        <RestStartTimeInput rest={rest} index={index} />
        <Box>
          <Typography variant="body1" sx={{ my: 1 }}>
            ～
          </Typography>
        </Box>
        <RestEndTimeInput rest={rest} index={index} />
        <Box sx={{ flexGrow: 1 }} textAlign={"right"}>
          {`${totalRestTime.toFixed(1)} 時間`}
        </Box>
      </Stack>
    </Box>
  );
}
