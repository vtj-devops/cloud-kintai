/**
 * 休憩終了時刻入力コンポーネント。
 * MaterialUIのTimePickerを利用し、休憩終了時刻を選択・編集できる。
 * デフォルトの昼休憩終了時刻をChipで選択可能。
 *
 * @packageDocumentation
 */

import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext } from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayUpdate,
} from "react-hook-form";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { AttendanceEditInputs } from "../../common";

/**
 * RestEndTimeInputのプロパティ型定義。
 */
type RestEndTimeInputProps = {
  /**
   * 勤務日(dayjsオブジェクト)
   */
  workDate: dayjs.Dayjs;
  /**
   * 休憩データ
   */
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  /**
   * 休憩配列のインデックス
   */
  index: number;
  /**
   * react-hook-formのcontrol
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AttendanceEditInputs, any>;
  /**
   * 休憩データの更新関数
   */
  restUpdate: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
  testIdPrefix?: string;
};

/**
 * 休憩終了時刻入力用コンポーネント。
 *
 * @param props RestEndTimeInputProps
 * @returns JSX.Element
 */
export default function RestEndTimeInput({
  workDate,
  rest,
  index,
  control,
  restUpdate,
  testIdPrefix = "mobile",
}: RestEndTimeInputProps) {
  const { getLunchRestEndTime } = useContext(AppConfigContext);

  const lunchRestEndTime = getLunchRestEndTime().format("H:mm");

  return (
    <Stack direction="column" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name={`rests.${index}.endTime`}
          control={control}
          render={({ field }) => (
            <TimePicker
              value={rest.endTime ? dayjs(rest.endTime) : null}
              ampm={false}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              slotProps={{
                textField: {
                  size: "small",
                  inputProps: {
                    "data-testid": `rest-end-time-input-${testIdPrefix}-${index}`,
                  },
                },
              }}
              onChange={(newEndTime) => {
                const formattedEndTime = newEndTime
                  ? newEndTime
                      .year(workDate.year())
                      .month(workDate.month())
                      .date(workDate.date())
                      .second(0)
                      .millisecond(0)
                      .toISOString()
                  : null;
                field.onChange(formattedEndTime);
              }}
            />
          )}
        />
        <Box>
          <DefaultEndTimeChip
            index={index}
            workDate={workDate}
            restUpdate={restUpdate}
            rest={rest}
            lunchRestEndTime={lunchRestEndTime}
          />
        </Box>
      </Stack>
    </Stack>
  );
}

/**
 * デフォルトの昼休憩終了時刻を選択するChipコンポーネント。
 *
 * @param props index, workDate, restUpdate, rest, lunchRestEndTime
 * @returns JSX.Element
 */
function DefaultEndTimeChip({
  index,
  workDate,
  restUpdate,
  rest,
  lunchRestEndTime,
}: {
  index: number;
  workDate: dayjs.Dayjs;
  restUpdate: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  lunchRestEndTime: string;
}): JSX.Element {
  return (
    <Chip
      label={lunchRestEndTime}
      variant="outlined"
      color="success"
      icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
      onClick={() => {
        const endTime = new AttendanceDateTime()
          .setDate(workDate)
          .setRestEnd()
          .toISOString();
        restUpdate(index, { ...rest, endTime });
      }}
    />
  );
}
