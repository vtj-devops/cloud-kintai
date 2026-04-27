import useAppConfig from "@entities/app-config/model/useAppConfig";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { FieldArrayWithId } from "react-hook-form";

export default function NoRestTimeMessage({
  restFields,
}: {
  restFields: FieldArrayWithId<AttendanceEditInputs, "rests", "id">[];
}) {
  const { getLunchRestStartTime, getLunchRestEndTime, loading } =
    useAppConfig();

  if (loading) {
    return (
      <div className="flex items-center py-2">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"
          aria-label="loading"
        />
      </div>
    );
  }

  const lunchRestStartTime = getLunchRestStartTime().format("HH:mm");
  const lunchRestEndTime = getLunchRestEndTime().format("HH:mm");

  if (restFields.length >= 1) {
    return null;
  }

  return (
    <div className="space-y-1 text-sm leading-6 text-slate-500">
      <p className="m-0 text-slate-700">休憩時間はありません</p>
      <p className="m-0">
        ※昼休憩は退勤打刻の際に{lunchRestStartTime}〜{lunchRestEndTime}
        で自動打刻されます
      </p>
    </div>
  );
}
