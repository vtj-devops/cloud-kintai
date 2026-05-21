import { useAttendanceEditData } from "@features/attendance/edit/model/AttendanceEditProvider";
import { createMonthSearchParams,MONTH_QUERY_KEY } from "@shared/lib/monthQuery";
import Link from "@shared/ui/link/Link";
import { useSearchParams } from "react-router-dom";

const buildAttendanceListHref = (month: string | null) =>
  month
    ? `/attendance/list?${createMonthSearchParams(month).toString()}`
    : "/attendance/list";

export function AttendanceEditBackNavigation() {
  const { workDate } = useAttendanceEditData();
  const [searchParams] = useSearchParams();
  const attendanceListHref = buildAttendanceListHref(
    searchParams.get(MONTH_QUERY_KEY),
  );

  if (!workDate) return null;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <Link
        href={attendanceListHref}
        data-testid="attendance-back-to-list"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-[160ms] ease-in-out hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(52_211_153)]"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ←
        </span>
        <span>勤怠一覧に戻る</span>
      </Link>
    </div>
  );
}

export default AttendanceEditBackNavigation;
