import { RestInputs } from "@features/attendance/edit/model/common";
import dayjs, { Dayjs } from "dayjs";

export const PAID_HOLIDAY_REMARK_TAG = "有給休暇";

interface PaidHolidayTimeConfig {
  readonly startTime: Dayjs;
  readonly endTime: Dayjs;
  readonly restStartTime: Dayjs;
  readonly restEndTime: Dayjs;
}

interface BuildPaidHolidayToggleValuesInput {
  readonly checked: boolean;
  readonly setPaidHolidayTimes: boolean;
  readonly workDate?: string;
  readonly remarkTags: readonly string[];
  readonly specialHolidayFlag: boolean;
  readonly timeConfig: PaidHolidayTimeConfig;
}

interface PaidHolidayToggleValues {
  readonly timeValues?: {
    readonly startTime: string;
    readonly endTime: string;
    readonly rests: RestInputs[];
  };
  readonly nextRemarkTags?: string[];
  readonly shouldClearSpecialHolidayFlag: boolean;
}

export function buildPaidHolidayToggleValues({
  checked,
  setPaidHolidayTimes,
  workDate,
  remarkTags,
  specialHolidayFlag,
  timeConfig,
}: BuildPaidHolidayToggleValuesInput): PaidHolidayToggleValues {
  if (!checked) {
    if (!remarkTags.includes(PAID_HOLIDAY_REMARK_TAG)) {
      return {
        shouldClearSpecialHolidayFlag: false,
      };
    }

    return {
      nextRemarkTags: remarkTags.filter((tag) => tag !== PAID_HOLIDAY_REMARK_TAG),
      shouldClearSpecialHolidayFlag: false,
    };
  }

  if (!setPaidHolidayTimes || !workDate) {
    return {
      shouldClearSpecialHolidayFlag: false,
    };
  }

  const baseDate = dayjs(workDate);
  const startDateTime = setDateAndTime(baseDate, timeConfig.startTime);
  const endDateTime = setDateAndTime(baseDate, timeConfig.endTime);
  const restStartDateTime = setDateAndTime(baseDate, timeConfig.restStartTime);
  const restEndDateTime = setDateAndTime(baseDate, timeConfig.restEndTime);

  return {
    timeValues: {
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      rests: [
        {
          startTime: restStartDateTime.toISOString(),
          endTime: restEndDateTime.toISOString(),
        },
      ],
    },
    nextRemarkTags: remarkTags.includes(PAID_HOLIDAY_REMARK_TAG)
      ? undefined
      : [...remarkTags, PAID_HOLIDAY_REMARK_TAG],
    shouldClearSpecialHolidayFlag: specialHolidayFlag,
  };
}

function setDateAndTime(baseDate: Dayjs, timeSource: Dayjs): Dayjs {
  return baseDate
    .hour(timeSource.hour())
    .minute(timeSource.minute())
    .second(0)
    .millisecond(0);
}
