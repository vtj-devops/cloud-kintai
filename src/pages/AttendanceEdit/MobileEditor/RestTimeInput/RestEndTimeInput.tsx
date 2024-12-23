import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, Stack, styled } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayUpdate,
} from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { AttendanceEditInputs } from "../../common";

const ClearButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.contrastText,
  backgroundColor: theme.palette.error.main,
  boxShadow: "none",
  "&:active": {
    color: theme.palette.error.main,
    backgroundColor: theme.palette.error.contrastText,
    border: `3px solid ${theme.palette.error.main}`,
  },
}));

type RestEndTimeInputProps = {
  workDate: dayjs.Dayjs;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AttendanceEditInputs, any>;
  restUpdate: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
};

export default function RestEndTimeInput({
  workDate,
  rest,
  index,
  control,
  restUpdate,
}: RestEndTimeInputProps) {
  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  if (!enableEndTime) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            setEnableEndTime(true);
          }}
          sx={{ my: 1.2 }}
        >
          終了時間を追加
        </Button>
      </Box>
    );
  }

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
                textField: { size: "small" },
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
          />
        </Box>
      </Stack>
      <Box>
        <ClearButton
          variant="contained"
          size="small"
          startIcon={<ClearIcon />}
          onClick={() => {
            restUpdate(index, { ...rest, endTime: null });
            setEnableEndTime(false);
          }}
        >
          終了時間をクリア
        </ClearButton>
      </Box>
    </Stack>
  );
}

function DefaultEndTimeChip({
  index,
  workDate,
  restUpdate,
  rest,
}: {
  index: number;
  workDate: dayjs.Dayjs;
  restUpdate: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
}): JSX.Element {
  return (
    <Chip
      label="13:00"
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
