import useAppConfig from "@entities/app-config/model/useAppConfig";
import { buildPaidHolidayToggleValues } from "@features/attendance/edit/lib/paidHolidayToggle";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Box, Checkbox, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
    const checked = e.target.checked;
    setValue("paidHolidayFlag", checked);
    field.onChange(e);

    const remarkTags = getRemarkTags(getValues);
    const specialHolidayFlag = getSpecialHolidayFlag(getValues);
    const toggleValues = buildPaidHolidayToggleValues({
      checked,
      setPaidHolidayTimes,
      workDate,
      remarkTags,
      specialHolidayFlag,
      timeConfig: {
        startTime: getStartTime(),
        endTime: getEndTime(),
        restStartTime: getLunchRestStartTime(),
        restEndTime: getLunchRestEndTime(),
      },
    });

    if (toggleValues.timeValues) {
      setValue("startTime", toggleValues.timeValues.startTime);
      setValue("endTime", toggleValues.timeValues.endTime);
      if (restReplace && typeof restReplace === "function") {
        restReplace(toggleValues.timeValues.rests);
      } else {
        setValue("rests", toggleValues.timeValues.rests);
      }
    }

    if (toggleValues.shouldClearSpecialHolidayFlag) {
      setValue("specialHolidayFlag", false);
    }

    if (toggleValues.nextRemarkTags) {
      setValue("remarkTags", toggleValues.nextRemarkTags);
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

function getRemarkTags(getValues: AttendanceGetValues | undefined): string[] {
  try {
    return ((getValues?.("remarkTags") as string[]) || []).filter(Boolean);
  } catch {
    return [];
  }
}

function getSpecialHolidayFlag(
  getValues: AttendanceGetValues | undefined
): boolean {
  try {
    return Boolean(getValues?.("specialHolidayFlag"));
  } catch {
    return false;
  }
}
