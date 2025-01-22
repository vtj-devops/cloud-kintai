import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Chip, Stack, styled } from "@mui/material";
import { renderTimeViewClock, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { AttendanceDateTime } from "@/lib/AttendanceDateTime";

import { AttendanceEditInputs } from "../../common";

const ClearButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.contrastText,
  borderColor: theme.palette.error.main,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    border: `3px solid ${theme.palette.error.main}`,
  },
}));

export default function EndTimeInput({
  workDate,
  control,
  setValue,
  getValues,
  watch,
}: {
  workDate: dayjs.Dayjs | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AttendanceEditInputs, any>;
  setValue: UseFormSetValue<AttendanceEditInputs>;
  getValues: UseFormGetValues<AttendanceEditInputs>;
  watch: UseFormWatch<AttendanceEditInputs>;
}) {
  const [enableEndTime, setEnableEndTime] = useState<boolean>(false);

  useEffect(() => {
    const endTime = getValues("endTime");
    setEnableEndTime(!!endTime);

    watch((data) => {
      setEnableEndTime(!!data.endTime);
    });
  }, [watch]);

  if (!workDate) {
    return null;
  }

  return enableEndTime ? (
    <Stack direction="column" spacing={1}>
      <Stack spacing={1}>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <TimePicker
              value={field.value ? dayjs(field.value) : null}
              ampm={false}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
              }}
              onChange={(value) => {
                field.onChange(
                  value && value.isValid()
                    ? value
                        .year(workDate.year())
                        .month(workDate.month())
                        .date(workDate.date())
                        .second(0)
                        .millisecond(0)
                        .toISOString()
                    : null
                );
              }}
            />
          )}
        />
        <Box>
          <Chip
            label="18:00"
            color="success"
            variant="outlined"
            icon={<AddCircleOutlineOutlinedIcon fontSize="small" />}
            onClick={() => {
              const endTime = new AttendanceDateTime()
                .setDate(workDate)
                .setWorkEnd()
                .toISOString();
              setValue("endTime", endTime);
            }}
          />
        </Box>
      </Stack>
      <Box>
        <ClearButton
          variant="contained"
          color="error"
          size="small"
          startIcon={<ClearIcon />}
          onClick={() => {
            setValue("endTime", null);
            setEnableEndTime(false);
          }}
        >
          終了時間をクリア
        </ClearButton>
      </Box>
    </Stack>
  ) : (
    <Button
      variant="outlined"
      startIcon={<AddCircleOutlineIcon />}
      onClick={() => {
        setEnableEndTime(true);
      }}
      sx={{ my: 1.4 }}
    >
      終了時間を追加
    </Button>
  );
}
