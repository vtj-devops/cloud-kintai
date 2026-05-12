import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import {
  AttendanceGetValues,
  AttendanceSetValue,
} from "@features/attendance/edit/model/types";
import { Dayjs } from "dayjs";
import { Dispatch, SetStateAction, useCallback } from "react";

type UseAttendanceGoDirectlyHandlerProps = {
  setValue: AttendanceSetValue;
  getValues: AttendanceGetValues;
  getStartTime: () => Dayjs;
  workDate: Dayjs | null;
  targetWorkDate?: string;
  setHighlightStartTime: Dispatch<SetStateAction<boolean>>;
};

export function useAttendanceGoDirectlyHandler({
  setValue,
  getValues,
  getStartTime,
  workDate,
  targetWorkDate,
  setHighlightStartTime,
}: UseAttendanceGoDirectlyHandlerProps) {
  const handleGoDirectlyChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        return;
      }

      setValue(
        "startTime",
        resolveConfigTimeOnDate(
          getStartTime(),
          getValues("startTime") as string | null | undefined,
          workDate,
          targetWorkDate,
        ),
      );
      setHighlightStartTime(true);
      window.setTimeout(() => setHighlightStartTime(false), 2500);
    },
    [
      getStartTime,
      getValues,
      setHighlightStartTime,
      setValue,
      targetWorkDate,
      workDate,
    ],
  );

  return {
    handleGoDirectlyChange,
  };
}