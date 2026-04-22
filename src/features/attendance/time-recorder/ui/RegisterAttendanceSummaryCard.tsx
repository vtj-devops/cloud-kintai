import { useListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import {
  formatDateRangeLabel,
  getAttendanceQueryDateRange,
  getEffectiveDateRange,
} from "@entities/attendance/lib/aggregationDateRange";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  calcTotalRestTime,
  calcTotalWorkTime,
} from "@entities/attendance/lib/time";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import InfoIconTooltip from "@shared/ui/tooltip/InfoIconTooltip";
import { SectionTitle } from "@shared/ui/typography";
import { type ChartData, type ChartOptions } from "chart.js";
import dayjs from "dayjs";
import { useContext, useMemo } from "react";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";

import RegisterSummaryAttendanceErrorCountCard from "./RegisterSummaryAttendanceErrorCountCard";
import RegisterSummaryTotalWorkHoursCard from "./RegisterSummaryTotalWorkHoursCard";
import RegisterSummaryWorkDaysCard from "./RegisterSummaryWorkDaysCard";
import RegisterSummaryWorkStatusChartCard from "./RegisterSummaryWorkStatusChartCard";

type RegisterAttendanceSummaryCardProps = {
  attendanceErrorCount?: number;
};

export default function RegisterAttendanceSummaryCard({
  attendanceErrorCount = 0,
}: RegisterAttendanceSummaryCardProps) {
  const { cognitoUser } = useContext(AuthContext);
  const { getStandardWorkHours } = useContext(AppConfigContext);
  const {
    closeDates,
    loading: closeDatesLoading,
    error: closeDatesError,
  } = useCloseDates();
  const today = useMemo(() => dayjs().startOf("day"), []);

  const currentMonth = useMemo(() => dayjs().startOf("month"), []);
  const effectiveDateRange = useMemo(
    () => getEffectiveDateRange(currentMonth, closeDates),
    [closeDates, currentMonth],
  );

  const queryDateRange = useMemo(() => {
    return getAttendanceQueryDateRange(currentMonth, effectiveDateRange);
  }, [currentMonth, effectiveDateRange]);

  const startDate = queryDateRange.start.format(AttendanceDate.DataFormat);
  const endDate = queryDateRange.end.format(AttendanceDate.DataFormat);

  const {
    data: attendances = [],
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
    isUninitialized: attendanceUninitialized,
    error: attendancesError,
  } = useListAttendancesByDateRangeQuery(
    {
      staffId: cognitoUser?.id ?? "",
      startDate,
      endDate,
    },
    {
      skip: !cognitoUser?.id,
      refetchOnMountOrArgChange: true,
    },
  );

  const filteredAttendances = useMemo(
    () =>
      attendances.filter((attendance) => {
        if (!attendance.workDate) {
          return false;
        }
        const workDate = dayjs(attendance.workDate);
        const isToday = workDate.isSame(today, "day");
        if (isToday && !attendance.endTime) {
          return false;
        }
        return (
          !workDate.isBefore(effectiveDateRange.start, "day") &&
          !workDate.isAfter(effectiveDateRange.end, "day") &&
          !workDate.isAfter(today, "day")
        );
      }),
    [attendances, effectiveDateRange, today],
  );

  const summary = useMemo(() => {
    const totalWorkTime = filteredAttendances.reduce((acc, attendance) => {
      if (!attendance.startTime || !attendance.endTime) {
        return acc;
      }
      return acc + calcTotalWorkTime(attendance.startTime, attendance.endTime);
    }, 0);

    const totalRestTime = filteredAttendances.reduce((acc, attendance) => {
      if (!attendance.rests) {
        return acc;
      }

      const restTime = attendance.rests
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((restAcc, rest) => {
          if (!rest.startTime || !rest.endTime) {
            return restAcc;
          }
          return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);

      return acc + restTime;
    }, 0);

    return {
      totalHours: totalWorkTime - totalRestTime,
      workDays: filteredAttendances.length,
    };
  }, [filteredAttendances]);

  const chartSummary = useMemo(() => {
    const standardWorkHours = Math.max(getStandardWorkHours(), 0);
    const workStatusHoursByDate = filteredAttendances.reduce<
      Record<string, { netWorkHours: number; restHours: number }>
    >((acc, attendance) => {
      if (
        !attendance.workDate ||
        !attendance.startTime ||
        !attendance.endTime
      ) {
        return acc;
      }
      const totalWorkHours = calcTotalWorkTime(
        attendance.startTime,
        attendance.endTime,
      );
      const totalRestHours = (attendance.rests ?? [])
        .filter((item): item is NonNullable<typeof item> => !!item)
        .reduce((restAcc, rest) => {
          if (!rest.startTime || !rest.endTime) {
            return restAcc;
          }
          return restAcc + calcTotalRestTime(rest.startTime, rest.endTime);
        }, 0);
      const netWorkHours = Math.max(totalWorkHours - totalRestHours, 0);
      const workDateKey = dayjs(attendance.workDate).format(
        AttendanceDate.DataFormat,
      );
      const existing = acc[workDateKey] ?? { netWorkHours: 0, restHours: 0 };
      acc[workDateKey] = {
        netWorkHours: existing.netWorkHours + netWorkHours,
        restHours: existing.restHours + totalRestHours,
      };
      return acc;
    }, {});

    const periodDays = [];
    let cursor = effectiveDateRange.start.startOf("day");
    const periodEnd = effectiveDateRange.end.startOf("day");
    while (!cursor.isAfter(periodEnd, "day")) {
      periodDays.push(cursor);
      cursor = cursor.add(1, "day");
    }

    return periodDays.map((workDate) => {
      const workDateKey = workDate.format(AttendanceDate.DataFormat);
      const workStatusHours = workStatusHoursByDate[workDateKey] ?? {
        netWorkHours: 0,
        restHours: 0,
      };
      const netWorkHours = Number(workStatusHours.netWorkHours.toFixed(2));
      const restHours = Number(workStatusHours.restHours.toFixed(2));
      const overtimeHours = Number(
        Math.max(netWorkHours - standardWorkHours, 0).toFixed(2),
      );
      const regularWorkHours = Number(
        Math.max(netWorkHours - overtimeHours, 0).toFixed(2),
      );

      return {
        label: workDate.format("M/D"),
        workHours: regularWorkHours,
        restHours,
        overtimeHours,
        workDateValue: workDate.valueOf(),
      };
    });
  }, [effectiveDateRange, filteredAttendances, getStandardWorkHours]);

  const stackedBarData = useMemo<ChartData<"bar">>(
    () => ({
      labels: chartSummary.map((item) => item.label),
      datasets: [
        {
          label: "勤務時間",
          data: chartSummary.map((item) => item.workHours),
          backgroundColor: "rgba(14,116,144,0.8)",
          borderColor: "rgba(14,116,144,1)",
          borderWidth: 1,
          stack: "work-status",
        },
        {
          label: "残業時間",
          data: chartSummary.map((item) => -item.overtimeHours),
          backgroundColor: "rgba(225,29,72,0.82)",
          borderColor: "rgba(225,29,72,1)",
          borderWidth: 1,
          stack: "work-status",
        },
        {
          label: "休憩時間",
          data: chartSummary.map((item) => item.restHours),
          backgroundColor: "rgba(249,115,22,0.76)",
          borderColor: "rgba(249,115,22,1)",
          borderWidth: 1,
          stack: "work-status",
        },
      ],
    }),
    [chartSummary],
  );

  const stackedBarOptions = useMemo<ChartOptions<"bar">>(() => {
    const maxWork = Math.max(
      0,
      ...chartSummary.map((item) => item.workHours + item.restHours),
    );
    const maxOvertime = Math.max(
      0,
      ...chartSummary.map((item) => item.overtimeHours),
    );
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            color: "#334155",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${Math.abs(Number(context.parsed.y ?? 0)).toFixed(1)}h`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          ticks: {
            color: "#64748b",
            maxRotation: 0,
          },
        },
        y: {
          stacked: true,
          suggestedMin: maxOvertime > 0 ? -Math.ceil(maxOvertime + 0.5) : 0,
          suggestedMax: Math.max(1, Math.ceil(maxWork + 0.5)),
          ticks: {
            color: "#64748b",
            callback: (value) => `${value}h`,
          },
          grid: {
            color: "rgba(148,163,184,0.22)",
          },
        },
      },
    };
  }, [chartSummary]);

  const isLoading =
    closeDatesLoading ||
    attendanceLoading ||
    attendanceFetching ||
    attendanceUninitialized;
  const hasError = Boolean(closeDatesError || attendancesError);

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
        <RegisterSummaryTotalWorkHoursCard totalHoursLabel={totalHoursLabel} />
        <RegisterSummaryWorkDaysCard workDaysLabel={workDaysLabel} />
      </div>

      <RegisterSummaryAttendanceErrorCountCard
        attendanceErrorCount={attendanceErrorCount}
        hasAttendanceError={hasAttendanceError}
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
