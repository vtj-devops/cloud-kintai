import useAppConfig from "@entities/app-config/model/useAppConfig";
import { resolveConfigTimeOnDate } from "@entities/attendance/lib/resolveConfigTimeOnDate";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { GoDirectlyFlagCheckbox } from "@features/attendance/edit/ui/GoDirectlyFlagCheckbox";
import { useContext, useState } from "react";

export function GoDirectlyFlagInput() {
  const { control, setValue, workDate, getValues, attendance } = useContext(
    AttendanceEditContext,
  );
  const { getStartTime } = useAppConfig();
  const [highlightStartTime, setHighlightStartTime] = useState(false);

  if (!control || !setValue) {
    return null;
  }

  const computeStartTimeIso = () =>
    resolveConfigTimeOnDate(
      getStartTime(),
      getValues?.("startTime") as string | null | undefined,
      workDate ?? undefined,
      attendance?.workDate,
    );

  const handleChangeFlag = (checked: boolean) => {
    if (checked) {
      setValue("goDirectlyFlag", true);
      setValue("startTime", computeStartTimeIso());
      setHighlightStartTime(true);
      setTimeout(() => setHighlightStartTime(false), 2500);
    }
  };

  return (
    <>
      <GoDirectlyFlagCheckbox
        name="goDirectlyFlag"
        control={control}
        label="直行ですか？"
        inputVariant="checkbox"
        layout="inline"
        onChangeExtra={handleChangeFlag}
      />
      {highlightStartTime && (
        <div className="my-1 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 font-bold text-emerald-900 animate-pulse">
          勤務開始時間が自動設定されました
        </div>
      )}
    </>
  );
}
