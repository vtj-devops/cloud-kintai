import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Box, Stack, Typography } from "@mui/material";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";
import { FieldArrayWithId } from "react-hook-form";

import RestEndTimeInput from "./RestEndTimeInput";
import RestStartTimeInput from "./RestStartTimeInput";

export function calcTotalRestTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
) {
  if (!startTime) return 0;

  const now = dayjs();
  const diff = dayjs(endTime || now).diff(dayjs(startTime), "hour", true);
  return diff;
}

export function RestTimeItem({
  rest,
  index,
}: {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
}) {
  const { restRemove, readOnly } = useContext(AttendanceEditContext);

  // 派生状態として計算：休憩時間の合計
  const totalRestTime = useMemo(() => {
    if (!rest.endTime) {
      return 0;
    }
    return calcTotalRestTime(rest.startTime, rest.endTime);
  }, [rest.startTime, rest.endTime]);

  if (!restRemove) {
    return null;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1}>
        <RestStartTimeInput index={index} rest={rest} />
        <Box>
          <Typography variant="body1" sx={{ my: 1 }}>
            ～
          </Typography>
        </Box>
        <RestEndTimeInput index={index} rest={rest} />
        <Box>
          <AppDeleteIconButton
            aria-label="休憩時間を削除"
            onClick={() => restRemove(index)}
            disabled={!!readOnly}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} textAlign={"right"}>
          {`${totalRestTime.toFixed(1)} 時間`}
        </Box>
      </Stack>
    </Box>
  );
}
