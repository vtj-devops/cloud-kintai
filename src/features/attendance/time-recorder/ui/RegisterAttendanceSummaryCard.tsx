import { formatDateRangeLabel } from "@entities/attendance/lib/aggregationDateRange";
import { calcAttendanceSummary } from "@features/attendance/time-recorder/lib/attendanceSummaryCalculators";
import { useAttendanceChartData } from "@features/attendance/time-recorder/model/useAttendanceChartData";
import { useAttendanceSummaryData } from "@features/attendance/time-recorder/model/useAttendanceSummaryData";
import { StatCard } from "@shared/ui/card";
import InfoIconTooltip from "@shared/ui/tooltip/InfoIconTooltip";
import { SectionTitle } from "@shared/ui/typography";

import RegisterSummaryAttendanceErrorCountCard from "./RegisterSummaryAttendanceErrorCountCard";
import RegisterSummaryWorkStatusChartCard from "./RegisterSummaryWorkStatusChartCard";

type RegisterAttendanceSummaryCardProps = {
  attendanceErrorCount?: number;
  attendanceErrorListPath?: string;
};

export default function RegisterAttendanceSummaryCard({
  attendanceErrorCount = 0,
  attendanceErrorListPath,
}: RegisterAttendanceSummaryCardProps) {
  const { filteredAttendances, effectiveDateRange, isLoading, hasError } =
    useAttendanceSummaryData();
  const { chartSummary, stackedBarData, stackedBarOptions } =
    useAttendanceChartData(filteredAttendances, effectiveDateRange);

  const summary = calcAttendanceSummary(filteredAttendances);
  const rangeLabel = formatDateRangeLabel(effectiveDateRange);
  const summaryInfoLabel = `集計期間について: ${rangeLabel}`;
  const totalHoursLabel =
    hasError || isLoading ? "--" : `${summary.totalHours.toFixed(1)}h`;
  const workDaysLabel = hasError || isLoading ? "--" : `${summary.workDays}日`;
  const workStatusDataCount = filteredAttendances.filter(
    (attendance) => attendance.startTime && attendance.endTime,
  ).length;
  const hasAttendanceError = attendanceErrorCount > 0;

  return (
    <section
      data-testid="register-dashboard-attendance-summary-card"
      className="relative rounded-[4px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionTitle className="m-0 text-sm font-semibold tracking-[0.01em] text-slate-900">
            直近の勤務状況
          </SectionTitle>
        </div>
        <InfoIconTooltip
          testId="register-dashboard-attendance-summary-info"
          ariaLabel={summaryInfoLabel}
          tooltipContent={summaryInfoLabel}
          containerClassName="absolute right-3 top-3 inline-flex"
        />
        {isLoading && (
          <span className="inline-flex rounded-[4px] border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold leading-none text-slate-700">
            集計中
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="合計勤務時間" value={totalHoursLabel} />
        <StatCard label="勤務日数" value={workDaysLabel} />
      </div>

      <RegisterSummaryAttendanceErrorCountCard
        attendanceErrorCount={attendanceErrorCount}
        hasAttendanceError={hasAttendanceError}
        to={attendanceErrorListPath}
      />
      <RegisterSummaryWorkStatusChartCard
        chartData={stackedBarData}
        chartOptions={stackedBarOptions}
        hasChartData={chartSummary.length > 0}
        workStatusDataCount={workStatusDataCount}
      />
    </section>
  );
}
