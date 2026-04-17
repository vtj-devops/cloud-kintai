import useAppConfig from "@entities/app-config/model/useAppConfig";
import {
  AttendanceEditInputs,
  RestInputs,
} from "@features/attendance/edit/model/common";
import { Box, Checkbox, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import dayjs from "dayjs";
import { Controller, UseFieldArrayReplace } from "react-hook-form";

import {
  AttendanceControl,
  AttendanceControllerField,
  AttendanceGetValues,
  AttendanceSetValue,
} from "../model/types";
import PaidHolidayFlagInputMobile from "./PaidHolidayFlagInputMobile";

type PaidHolidayFlagField = AttendanceControllerField<"paidHolidayFlag">;

interface PaidHolidayFlagInputProps {
  label?: string;
  disabled?: boolean;
  control: AttendanceControl;
  setValue: AttendanceSetValue;
  workDate?: string;
  setPaidHolidayTimes?: boolean;
  restReplace?: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  getValues?: AttendanceGetValues;
}

export default function PaidHolidayFlagInput({
  label = "有給休暇",
  disabled = false,
  control,
  setValue,
  workDate,
  setPaidHolidayTimes = false,
  restReplace,
  getValues,
}: PaidHolidayFlagInputProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    getStartTime,
    getEndTime,
    getLunchRestStartTime,
    getLunchRestEndTime,
  } = useAppConfig();

  if (isMobile) {
    return (
      <PaidHolidayFlagInputMobile
        {...{
          label,
          disabled,
          control,
          setValue,
          workDate,
          setPaidHolidayTimes,
          restReplace,
          getValues,
        }}
      />
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: PaidHolidayFlagField
  ) => {
    setValue("paidHolidayFlag", e.target.checked);
    field.onChange(e);

    if (!e.target.checked) {
      try {
        if (getValues) {
          const tags: string[] = (getValues("remarkTags") as string[]) || [];
          if (tags.includes("有給休暇")) {
            setValue("remarkTags", tags.filter((t) => t !== "有給休暇"));
          }
        }
      } catch {
        // noop
      }
      return;
    }

    if (!setPaidHolidayTimes || !workDate) return;

    const workDayjs = dayjs(workDate);

    // compose times using AppConfig getters
    const cfgStart = getStartTime();
    const cfgEnd = getEndTime();
    const cfgRestStart = getLunchRestStartTime();
    const cfgRestEnd = getLunchRestEndTime();

    const startDt = workDayjs
      .hour(cfgStart.hour())
      .minute(cfgStart.minute())
      .second(0)
      .millisecond(0);
    const endDt = workDayjs
      .hour(cfgEnd.hour())
      .minute(cfgEnd.minute())
      .second(0)
      .millisecond(0);
    const restStartDt = workDayjs
      .hour(cfgRestStart.hour())
      .minute(cfgRestStart.minute())
      .second(0)
      .millisecond(0);
    const restEndDt = workDayjs
      .hour(cfgRestEnd.hour())
      .minute(cfgRestEnd.minute())
      .second(0)
      .millisecond(0);

    setValue("startTime", startDt.toISOString());
    setValue("endTime", endDt.toISOString());
    const rests: RestInputs[] = [
      {
        startTime: restStartDt.toISOString(),
        endTime: restEndDt.toISOString(),
      },
    ];

    if (restReplace && typeof restReplace === "function") {
      restReplace(rests);
    } else {
      setValue("rests", rests);
    }

    // 有給ON時は特別休暇フラグを解除して相互排他にする
    try {
      if (getValues && getValues("specialHolidayFlag")) {
        setValue("specialHolidayFlag", false);
      }
    } catch {
      // noop
    }

    // 備考欄に「有給休暇」を追記（既に含まれている場合は追加しない）
    try {
      if (getValues) {
        const tags: string[] = (getValues("remarkTags") as string[]) || [];
        if (!tags.includes("有給休暇")) {
          setValue("remarkTags", [...tags, "有給休暇"]);
        }
      }
    } catch {
      // noop
    }
  };

  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>{label}</Box>
      <Box>
        <Controller
          name="paidHolidayFlag"
          control={control}
          disabled={disabled}
          render={({ field }) => (
            <Checkbox
              {...field}
              checked={field.value || false}
              onChange={(e) => handleChange(e, field)}
            />
          )}
        />
      </Box>
    </Stack>
  );
}
