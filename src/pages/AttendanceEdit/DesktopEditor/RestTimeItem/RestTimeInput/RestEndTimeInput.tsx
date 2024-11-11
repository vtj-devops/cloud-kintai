import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, IconButton, Stack } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Controller, FieldArrayWithId } from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";
import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

import { AttendanceEditInputs } from "../../../common";

export default function RestEndTimeInput({
  rest,
  index,
}: {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
}) {
  const { workDate, control, restUpdate, changeRequests } = useContext(
    AttendanceEditContext
  );
  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  useEffect(() => {
    setEnableEndTime(!!rest.endTime);
  }, [rest]);

  if (!enableEndTime) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setEnableEndTime(true);
          }}
        >
          終了時間を追加
        </Button>
      </Box>
    );
  }

  if (!workDate || !control || !restUpdate) return null;

  return (
    <Stack direction="row" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name={`rests.${index}.endTime`}
          control={control}
          render={({ field }) => (
            <TimePicker
              value={rest.endTime ? dayjs(rest.endTime) : null}
              ampm={false}
              disabled={changeRequests.length > 0}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              slotProps={{
                textField: { size: "small" },
              }}
              onChange={(newEndTime) => {
                if (!newEndTime) {
                  field.onChange(null);
                  return;
                }

                if (!newEndTime.isValid()) {
                  return;
                }

                const formattedEndTime = newEndTime
                  .year(workDate.year())
                  .month(workDate.month())
                  .date(workDate.date())
                  .second(0)
                  .millisecond(0)
                  .toISOString();
                field.onChange(formattedEndTime);
              }}
            />
          )}
        />
        <Box>
          <DefaultEndTimeChip index={index} rest={rest} />
        </Box>
      </Stack>
      <Box>
        <ClearButton
          index={index}
          rest={rest}
          setEnableEndTime={setEnableEndTime}
        />
      </Box>
    </Stack>
  );
}

function DefaultEndTimeChip({
  index,
  rest,
}: {
  index: number;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
}) {
  const { workDate, restUpdate, changeRequests } = useContext(
    AttendanceEditContext
  );

  if (!workDate || !restUpdate) return null;

  const clickHandler = () => {
    const endTime = new AttendanceDateTime()
      .setDate(workDate)
      .setRestEnd()
      .toISOString();
    restUpdate(index, { ...rest, endTime });
  };

  return (
    <Chip
      label="13:00"
      variant="outlined"
      color="success"
      disabled={changeRequests.length > 0}
      icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
      onClick={clickHandler}
    />
  );
}

function ClearButton({
  index,
  rest,
  setEnableEndTime,
}: {
  index: number;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  setEnableEndTime: (enable: boolean) => void;
}) {
  const { restUpdate, changeRequests } = useContext(AttendanceEditContext);

  if (!restUpdate) return null;

  const handleClick = () => {
    restUpdate(index, { ...rest, endTime: null });
    setEnableEndTime(false);
  };

  return (
    <IconButton onClick={handleClick} disabled={changeRequests.length > 0}>
      <ClearIcon />
    </IconButton>
  );
}
