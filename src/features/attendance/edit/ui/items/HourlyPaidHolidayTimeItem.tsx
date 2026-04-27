import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Stack, Typography } from "@mui/material";
import { AppIconButton } from "@shared/ui/button";
import { TimeRangeInput } from "@shared/ui/form";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";
import { Controller, FieldArrayWithId } from "react-hook-form";

export function calcTotalHourlyPaidHolidayTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined
) {
  if (!startTime) return 0;

  const now = dayjs();
  // endTime が提供されていればそれを優先して解析し、なければ現在時刻を使用する
  const start = dayjs(startTime);
  const end = endTime ? dayjs(endTime) : now;

  // 解析に失敗した場合は NaN の連鎖を避けるため 0 と扱う
  if (!start.isValid() || !end.isValid()) return 0;

  // 浮動小数点の誤差を避けるため差分を分単位で計算する
  const diffMinutes = end.diff(start, "minute", true);
  if (!isFinite(diffMinutes) || diffMinutes <= 0) return 0;

  // 時間に変換（丸めなし）。呼び出し元が正確な小数時間を表示できるようにする
  return diffMinutes / 60;
}

export default function HourlyPaidHolidayTimeItem({
  time,
  index,
}: {
  time: FieldArrayWithId<AttendanceEditInputs, "hourlyPaidHolidayTimes", "id">;
  index: number;
}) {
  const { hourlyPaidHolidayTimeRemove, changeRequests, readOnly, workDate, control } = useContext(
    AttendanceEditContext
  );

  const baseDateStr = workDate ? workDate.format("YYYY-MM-DD") : "";
  const disabled = changeRequests.length > 0 || !!readOnly;

  // 派生状態として計算：時給有給休暇の合計時間
  const totalHourlyPaidHolidayTime = useMemo(() => {
    const start = time.startTime;
    const end = time.endTime;

    if (!start || !end) {
      return 0;
    }

    return calcTotalHourlyPaidHolidayTime(start, end);
  }, [time.startTime, time.endTime]);

  if (!workDate || !control) return null;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Controller
          name={`hourlyPaidHolidayTimes.${index}.startTime`}
          control={control}
          render={({ field: startField }) => (
            <Controller
              name={`hourlyPaidHolidayTimes.${index}.endTime`}
              control={control}
              render={({ field: endField }) => (
                <TimeRangeInput
                  startLabel="開始時刻"
                  endLabel="終了時刻"
                  startValue={startField.value as string | null}
                  endValue={endField.value as string | null}
                  baseDate={baseDateStr}
                  onStartChange={(v) => {
                    startField.onChange(v);
                  }}
                  onEndChange={(v) => {
                    endField.onChange(v);
                  }}
                  disabled={disabled}
                  size="small"
                />
              )}
            />
          )}
        />
        <Box>
          <AppIconButton
            aria-label="delete-hourly-paid-holiday-time"
            onClick={() => hourlyPaidHolidayTimeRemove(index)}
            disabled={disabled}
            aria-disabled={disabled}
            tone="danger"
          >
            <DeleteIcon />
          </AppIconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }} textAlign={"right"}>
          <Typography variant="body1">
            {totalHourlyPaidHolidayTime == null
              ? ""
              : formatHoursToHourMinute(totalHourlyPaidHolidayTime)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function formatHoursToDecimal(hours: number) {
  // 常に小数点1桁で表示する（例: 0.0, 0.5, 1.3）
  if (hours == null || hours <= 0) return `0.0時間`;
  return `${hours.toFixed(1)}時間`;
}

// コンポーネントで使われていた旧名を保持
function formatHoursToHourMinute(hours: number) {
  return formatHoursToDecimal(hours);
}
