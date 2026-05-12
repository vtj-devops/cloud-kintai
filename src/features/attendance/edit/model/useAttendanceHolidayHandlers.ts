import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import {
  AttendanceEditInputs,
  HourlyPaidHolidayTimeInputs,
  RestInputs,
} from "@features/attendance/edit/model/common";
import {
  AttendanceGetValues,
  AttendanceSetValue,
} from "@features/attendance/edit/model/types";
import { Logger } from "@shared/lib/logger";
import dayjs, { Dayjs } from "dayjs";
import { useCallback } from "react";
import { UseFieldArrayReplace } from "react-hook-form";

type UseAttendanceHolidayHandlersProps = {
  getValues: AttendanceGetValues;
  setValue: AttendanceSetValue;
  getStartTime: () => Dayjs;
  getEndTime: () => Dayjs;
  getLunchRestStartTime: () => Dayjs;
  getLunchRestEndTime: () => Dayjs;
  targetWorkDate?: string;
  attendanceWorkDate?: string | null;
  workDate: Dayjs | null;
  restReplace: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  hourlyPaidHolidayTimeReplace: UseFieldArrayReplace<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
  logger: Logger;
};

export function useAttendanceHolidayHandlers({
  getValues,
  setValue,
  getStartTime,
  getEndTime,
  getLunchRestStartTime,
  getLunchRestEndTime,
  targetWorkDate,
  attendanceWorkDate,
  workDate,
  restReplace,
  hourlyPaidHolidayTimeReplace,
  logger,
}: UseAttendanceHolidayHandlersProps) {
  const handleAbsentFlagChange = useCallback(
    (checked: boolean) => {
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      const hasAbsentTag = tags.includes("欠勤");

      if (checked && !hasAbsentTag) {
        setValue("remarkTags", [...tags, "欠勤"]);
      }

      if (!checked && hasAbsentTag) {
        setValue(
          "remarkTags",
          tags.filter((tag) => tag !== "欠勤"),
        );
      }
    },
    [getValues, setValue],
  );

  const handleSpecialHolidayFlagChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        const tags: string[] = (getValues("remarkTags") as string[]) || [];
        if (!tags.includes("特別休暇")) {
          setValue("remarkTags", [...tags, "特別休暇"]);
        }

        try {
          const desiredStart = resolveConfigTimeOnDate(
            getStartTime(),
            getValues("startTime") as string | null | undefined,
            targetWorkDate,
            attendanceWorkDate,
            workDate,
          );
          const desiredEnd = resolveConfigTimeOnDate(
            getEndTime(),
            getValues("endTime") as string | null | undefined,
            targetWorkDate,
            attendanceWorkDate,
            workDate,
          );

          if (getValues("startTime") !== desiredStart) {
            setValue("startTime", desiredStart);
          }
          if (getValues("endTime") !== desiredEnd) {
            setValue("endTime", desiredEnd);
          }
        } catch (error) {
          logger.debug("Failed to set default times for special holiday", error);
        }

        const dateStr = (getValues("workDate") as string) || attendanceWorkDate || "";
        const lunchStartCfg = getLunchRestStartTime();
        const lunchEndCfg = getLunchRestEndTime();
        const baseDay = dateStr ? dayjs(dateStr) : workDate ? workDate : dayjs();
        const desiredRests: RestInputs[] = [
          {
            startTime: baseDay
              .hour(lunchStartCfg.hour())
              .minute(lunchStartCfg.minute())
              .second(0)
              .millisecond(0)
              .toISOString(),
            endTime: baseDay
              .hour(lunchEndCfg.hour())
              .minute(lunchEndCfg.minute())
              .second(0)
              .millisecond(0)
              .toISOString(),
          },
        ];

        try {
          const currentRests = getValues("rests") || [];
          if (JSON.stringify(currentRests) !== JSON.stringify(desiredRests)) {
            restReplace(desiredRests);
          }
        } catch (error) {
          logger.debug("Failed to sync rests for special holiday", error);
        }

        try {
          const currentHourly = getValues("hourlyPaidHolidayTimes") || [];
          if ((currentHourly as HourlyPaidHolidayTimeInputs[]).length > 0) {
            hourlyPaidHolidayTimeReplace([]);
          }
        } catch (error) {
          logger.debug(
            "Failed to clear hourly paid holiday times for special holiday",
            error,
          );
        }

        try {
          const currentPaid = getValues("paidHolidayFlag");
          if (currentPaid) {
            setValue("paidHolidayFlag", false);
          }
        } catch (error) {
          logger.debug(
            "Failed to unset paid holiday flag for special holiday",
            error,
          );
        }

        return;
      }

      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      if (tags.includes("特別休暇")) {
        setValue(
          "remarkTags",
          tags.filter((tag) => tag !== "特別休暇"),
        );
      }
    },
    [
      attendanceWorkDate,
      getEndTime,
      getLunchRestEndTime,
      getLunchRestStartTime,
      getStartTime,
      getValues,
      hourlyPaidHolidayTimeReplace,
      logger,
      restReplace,
      setValue,
      targetWorkDate,
      workDate,
    ],
  );

  return {
    handleAbsentFlagChange,
    handleSpecialHolidayFlagChange,
  };
}