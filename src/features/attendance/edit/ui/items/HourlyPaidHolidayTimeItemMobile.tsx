import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Box, Stack, Typography } from "@mui/material";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
import { TimeRangeInput } from "@shared/ui/form";
import { useContext } from "react";
import { Controller, FieldArrayWithId } from "react-hook-form";

import { calcTotalHourlyPaidHolidayTime } from "./HourlyPaidHolidayTimeItem";

/**
 * 時間単位休暇の入力項目を表示するモバイル用コンポーネント。
 * 開始時刻、終了時刻、削除ボタン、合計時間を縦並びで表示します。
 */

interface HourlyPaidHolidayTimeItemMobileProps {
  /** 時間単位休暇の時間帯データ */
  time: FieldArrayWithId<AttendanceEditInputs, "hourlyPaidHolidayTimes", "id">;
  /** 配列内のインデックス */
  index: number;
}

/** 時間表示の小数点以下の桁数 */
const HOURS_DECIMAL_PLACES = 1;

/** アクセシビリティ用のラベル */
const ARIA_LABEL_DELETE = "時間単位休暇を削除";

export default function HourlyPaidHolidayTimeItemMobile({
  time,
  index,
}: HourlyPaidHolidayTimeItemMobileProps) {
  const { hourlyPaidHolidayTimeRemove, readOnly, workDate, control } =
    useContext(AttendanceEditContext);

  const totalHourlyPaidHolidayTime = calcTotalHourlyPaidHolidayTime(
    time.startTime,
    time.endTime,
  );

  const baseDateStr = workDate ? workDate.format("YYYY-MM-DD") : "";

  if (!workDate || !control) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <Stack
        direction="column"
        spacing={1}
        sx={{
          p: 1,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        {/* 開始・終了時刻 */}
        <Controller
          name={`hourlyPaidHolidayTimes.${index}.startTime`}
          control={control}
          render={({ field: startField }) => (
            <Controller
              name={`hourlyPaidHolidayTimes.${index}.endTime`}
              control={control}
              render={({ field: endField }) => (
                <TimeRangeInput
                  variant="mobile"
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
                  disabled={!!readOnly}
                  size="small"
                />
              )}
            />
          )}
        />

        {/* 削除ボタン + 合計時間 */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <AppDeleteIconButton
            aria-label={ARIA_LABEL_DELETE}
            onClick={() => hourlyPaidHolidayTimeRemove(index)}
            size="sm"
            disabled={!!readOnly}
          />
          <Box textAlign="right">
            <Typography variant="body2" color="text.secondary">
              {totalHourlyPaidHolidayTime > 0
                ? `${totalHourlyPaidHolidayTime.toFixed(
                    HOURS_DECIMAL_PLACES,
                  )} 時間`
                : "―"}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
