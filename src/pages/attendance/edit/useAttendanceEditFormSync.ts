import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import {
  AttendanceEditInputs,
  HourlyPaidHolidayTimeInputs,
} from "@features/attendance/edit/model/common";
import { Attendance } from "@shared/api/graphql/types";
import { parseTimeToISOOrNull } from "@shared/lib/time/timeConverter";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo } from "react";
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { normalizeTimeRanges, splitRemarks } from "./attendanceEditUtils";

type UseAttendanceEditFormSyncParams = {
  control: Control<AttendanceEditInputs>;
  setValue: UseFormSetValue<AttendanceEditInputs>;
  getValues: UseFormGetValues<AttendanceEditInputs>;
  reset: UseFormReset<AttendanceEditInputs>;
  attendance: Attendance | null;
  targetWorkDate?: string;
  targetWorkDateISO: string | null;
  staffId: string | null;
  getStartTime: () => dayjs.Dayjs;
  getEndTime: () => dayjs.Dayjs;
  getLunchRestStartTime: () => dayjs.Dayjs;
  getLunchRestEndTime: () => dayjs.Dayjs;
};

export function useAttendanceEditFormSync({
  control,
  setValue,
  getValues,
  reset,
  attendance,
  targetWorkDate,
  targetWorkDateISO,
  staffId,
  getStartTime,
  getEndTime,
  getLunchRestStartTime,
  getLunchRestEndTime,
}: UseAttendanceEditFormSyncParams) {
  useEffect(() => {
    if (!staffId || !targetWorkDateISO) {
      return;
    }

    reset();
  }, [staffId, targetWorkDateISO, reset]);

  useEffect(() => {
    if (!attendance || !targetWorkDateISO) {
      return;
    }

    if (attendance.workDate !== targetWorkDateISO) {
      return;
    }

    const { tags, remarks } = splitRemarks(attendance.remarks);
    const normalizedRests = normalizeTimeRanges(attendance.rests);
    const normalizedHourlyPaidHolidayTimes = normalizeTimeRanges(
      attendance.hourlyPaidHolidayTimes,
    );

    reset({
      startTime: attendance.startTime,
      endTime: attendance.endTime,
      paidHolidayFlag: attendance.paidHolidayFlag || false,
      specialHolidayFlag: attendance.specialHolidayFlag || false,
      goDirectlyFlag: attendance.goDirectlyFlag || false,
      substituteHolidayDate: attendance.substituteHolidayDate,
      returnDirectlyFlag: attendance.returnDirectlyFlag || false,
      remarkTags: tags,
      remarks,
      rests: normalizedRests,
      hourlyPaidHolidayTimes: normalizedHourlyPaidHolidayTimes,
    });
  }, [attendance, targetWorkDateISO, reset]);

  const absentFlagValue = useWatch({ control, name: "absentFlag" });

  useEffect(() => {
    const flag = !!absentFlagValue;
    const tags: string[] = (getValues("remarkTags") as string[]) || [];
    const has = tags.includes("欠勤");
    if (flag && !has) {
      setValue("remarkTags", [...tags, "欠勤"], { shouldDirty: false });
    }
    if (!flag && has) {
      setValue(
        "remarkTags",
        tags.filter((t) => t !== "欠勤"),
        { shouldDirty: false },
      );
    }
  }, [absentFlagValue, setValue, getValues]);

  const syncRemarkTag = useCallback(
    (tag: string, shouldInclude: boolean) => {
      const tags: string[] = (getValues("remarkTags") as string[]) || [];
      const has = tags.includes(tag);

      if (shouldInclude && !has) {
        setValue("remarkTags", [...tags, tag], { shouldDirty: false });
      }

      if (!shouldInclude && has) {
        setValue(
          "remarkTags",
          tags.filter((t) => t !== tag),
          { shouldDirty: false },
        );
      }
    },
    [getValues, setValue],
  );

  const applyConfiguredWorkAndLunchRest = useCallback(() => {
    const desiredStart = resolveConfigTimeOnDate(
      getStartTime(),
      getValues("startTime") as string | null | undefined,
      targetWorkDate,
      attendance?.workDate,
    );
    const desiredEnd = resolveConfigTimeOnDate(
      getEndTime(),
      getValues("endTime") as string | null | undefined,
      targetWorkDate,
      attendance?.workDate,
    );

    if (getValues("startTime") !== desiredStart) {
      setValue("startTime", desiredStart, { shouldDirty: false });
    }

    if (getValues("endTime") !== desiredEnd) {
      setValue("endTime", desiredEnd, { shouldDirty: false });
    }

    const dateStr = (getValues("workDate") as string) || "";
    const lunchStartCfg = getLunchRestStartTime();
    const lunchEndCfg = getLunchRestEndTime();
    const baseDay = dateStr
      ? dayjs(dateStr)
      : targetWorkDate
        ? dayjs(targetWorkDate)
        : dayjs();
    const lunchStartTime = lunchStartCfg.format("HH:mm");
    const lunchEndTime = lunchEndCfg.format("HH:mm");
    const lunchStartIso = parseTimeToISOOrNull(lunchStartTime, baseDay);
    const lunchEndIso = parseTimeToISOOrNull(lunchEndTime, baseDay);
    const desiredRests = [
      {
        startTime: lunchStartIso,
        endTime: lunchEndIso,
      },
    ];
    const currentRests = getValues("rests") || [];

    if (JSON.stringify(currentRests) !== JSON.stringify(desiredRests)) {
      setValue("rests", desiredRests, { shouldDirty: false });
    }
  }, [
    attendance?.workDate,
    getEndTime,
    getLunchRestEndTime,
    getLunchRestStartTime,
    getStartTime,
    getValues,
    setValue,
    targetWorkDate,
  ]);

  const clearHourlyPaidHolidayTimes = useCallback(() => {
    const currentHourly = (getValues("hourlyPaidHolidayTimes") || []) as
      | HourlyPaidHolidayTimeInputs[]
      | undefined;

    if (currentHourly && currentHourly.length > 0) {
      setValue("hourlyPaidHolidayTimes", [], { shouldDirty: false });
    }
  }, [getValues, setValue]);

  const syncHolidayEffects = useCallback(
    (
      flag: boolean,
      tag: "特別休暇" | "有給休暇",
      mutuallyExclusiveField?: "paidHolidayFlag" | "specialHolidayFlag",
    ) => {
      syncRemarkTag(tag, flag);

      if (!flag) {
        return;
      }

      applyConfiguredWorkAndLunchRest();
      clearHourlyPaidHolidayTimes();

      if (!mutuallyExclusiveField) {
        return;
      }

      const currentMutuallyExclusive = getValues(mutuallyExclusiveField);
      if (currentMutuallyExclusive) {
        setValue(mutuallyExclusiveField, false);
      }
    },
    [
      applyConfiguredWorkAndLunchRest,
      clearHourlyPaidHolidayTimes,
      getValues,
      setValue,
      syncRemarkTag,
    ],
  );

  const specialHolidayFlagValue = useWatch({
    control,
    name: "specialHolidayFlag",
  });

  useEffect(() => {
    syncHolidayEffects(
      !!specialHolidayFlagValue,
      "特別休暇",
      "paidHolidayFlag",
    );
  }, [specialHolidayFlagValue, syncHolidayEffects]);

  const paidHolidayFlagValue = useWatch({ control, name: "paidHolidayFlag" });

  useEffect(() => {
    syncHolidayEffects(
      !!paidHolidayFlagValue,
      "有給休暇",
      "specialHolidayFlag",
    );
  }, [paidHolidayFlagValue, syncHolidayEffects]);

  const startTimeValue = useWatch({ control, name: "startTime" });
  const restsValue = useWatch({ control, name: "rests" });

  const isOnBreak = useMemo(
    () =>
      !!(
        startTimeValue &&
        restsValue &&
        restsValue.length > 0 &&
        restsValue[0]?.startTime &&
        !restsValue[0]?.endTime
      ),
    [startTimeValue, restsValue],
  );

  return { isOnBreak };
}
