import {
  getWorkStatus,
  WorkStatusCodes,
} from "@entities/attendance/lib/actions/workStatus";
import {
  formatWorkStatusTooltipLabel,
  WORK_STATUS_CHART_STACK,
  WORK_STATUS_DATASET_META,
} from "@entities/attendance/lib/workStatusChart";
import { toAttendanceWorkStatusHours } from "@entities/attendance/lib/workStatusChartAggregation";
import { type StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { Attendance } from "@shared/api/graphql/types";
import { type ChartOptions } from "chart.js";
import dayjs from "dayjs";

export type StaffWorkStatusSummaryItem = {
  label: string;
  workHours: number;
  paidHolidayHours: number;
  overtimeHours: number;
};

export type StaffWorkStatusChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    stack: string;
  }[];
};

export type StaffWorkStatusChartViewModel = {
  infoLabel: string;
  isLoading: boolean;
  hasData: boolean;
  hasDuplicateAttendances: boolean;
  duplicateAttendanceDayCount: number;
  chartData: StaffWorkStatusChartData;
  chartOptions: ChartOptions<"bar">;
};

export const isAttendanceCurrentWorking = (attendance: Attendance) => {
  const { code } = getWorkStatus(attendance);
  return code === WorkStatusCodes.WORKING || code === WorkStatusCodes.RESTING;
};

export const buildStaffIdentityMaps = (staffs: StaffType[]) =>
  staffs.reduce<{
    staffLabelsById: Record<string, string>;
    canonicalStaffIdByAttendanceStaffId: Record<string, string>;
  }>(
    (acc, staff) => {
      if (!staff.id) return acc;
      const displayName = [staff.familyName, staff.givenName]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ");
      if (!displayName) return acc;
      acc.staffLabelsById[staff.id] = displayName;
      acc.canonicalStaffIdByAttendanceStaffId[staff.id] = staff.id;
      if (staff.cognitoUserId) {
        acc.canonicalStaffIdByAttendanceStaffId[staff.cognitoUserId] = staff.id;
      }
      return acc;
    },
    { staffLabelsById: {}, canonicalStaffIdByAttendanceStaffId: {} },
  );

export const buildStaffWorkStatusSummary = ({
  staffs,
  periodAttendances,
  standardWorkHours,
}: {
  staffs: StaffType[];
  periodAttendances: Attendance[];
  standardWorkHours: number;
}): StaffWorkStatusSummaryItem[] => {
  const { staffLabelsById, canonicalStaffIdByAttendanceStaffId } =
    buildStaffIdentityMaps(staffs);
  const staffIds = Object.keys(staffLabelsById);
  const totalsByStaff = periodAttendances.reduce<
    Record<
      string,
      { workHours: number; paidHolidayHours: number; overtimeHours: number }
    >
  >((acc, attendance) => {
    if (!attendance.staffId || !attendance.startTime || !attendance.endTime)
      return acc;
    const canonicalStaffId =
      canonicalStaffIdByAttendanceStaffId[attendance.staffId];
    if (!canonicalStaffId) return acc;

    const {
      workHours: regularWorkHours,
      paidHolidayHours,
      overtimeHours,
    } = toAttendanceWorkStatusHours({
      attendance,
      standardWorkHours,
      hideRestHoursOnPaidHoliday: true,
    });

    const current = acc[canonicalStaffId] ?? {
      workHours: 0,
      paidHolidayHours: 0,
      overtimeHours: 0,
    };
    const totalWorkHours = regularWorkHours + overtimeHours;
    acc[canonicalStaffId] = {
      workHours: Number((current.workHours + totalWorkHours).toFixed(2)),
      paidHolidayHours: Number(
        (current.paidHolidayHours + paidHolidayHours).toFixed(2),
      ),
      overtimeHours: Number((current.overtimeHours + overtimeHours).toFixed(2)),
    };
    return acc;
  }, {});

  staffIds.forEach((staffId) => {
    if (totalsByStaff[staffId]) return;
    totalsByStaff[staffId] = {
      workHours: 0,
      paidHolidayHours: 0,
      overtimeHours: 0,
    };
  });

  return Object.entries(totalsByStaff)
    .map(([staffId, totals]) => {
      const label = staffLabelsById[staffId];
      if (!label) return null;
      return {
        label,
        workHours: totals.workHours,
        paidHolidayHours: totals.paidHolidayHours,
        overtimeHours: totals.overtimeHours,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .toSorted(
      (left, right) =>
        right.workHours +
        right.paidHolidayHours -
        (left.workHours + left.paidHolidayHours),
    );
};

export const countDuplicateAttendanceDays = ({
  staffs,
  periodAttendances,
}: {
  staffs: StaffType[];
  periodAttendances: Attendance[];
}) => {
  const { canonicalStaffIdByAttendanceStaffId } =
    buildStaffIdentityMaps(staffs);
  const attendancesByStaffDate = periodAttendances.reduce<
    Record<string, number>
  >((acc, attendance) => {
    if (!attendance.staffId || !attendance.workDate) return acc;
    const canonicalStaffId =
      canonicalStaffIdByAttendanceStaffId[attendance.staffId];
    if (!canonicalStaffId) return acc;
    const key = `${canonicalStaffId}#${attendance.workDate}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.values(attendancesByStaffDate).filter((count) => count > 1)
    .length;
};

export const buildStaffWorkStatusChartData = (
  staffWorkStatusSummary: StaffWorkStatusSummaryItem[],
): StaffWorkStatusChartData => ({
  labels: staffWorkStatusSummary.map((item) => item.label),
  datasets: [
    {
      label: WORK_STATUS_DATASET_META.regular.label,
      data: staffWorkStatusSummary.map((item) => item.workHours),
      backgroundColor: WORK_STATUS_DATASET_META.regular.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.regular.borderColor,
      borderWidth: 1,
      stack: WORK_STATUS_CHART_STACK,
    },
    {
      label: WORK_STATUS_DATASET_META.paidHoliday.label,
      data: staffWorkStatusSummary.map((item) => item.paidHolidayHours),
      backgroundColor: WORK_STATUS_DATASET_META.paidHoliday.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.paidHoliday.borderColor,
      borderWidth: 1,
      stack: WORK_STATUS_CHART_STACK,
    },
    {
      label: WORK_STATUS_DATASET_META.overtime.label,
      data: staffWorkStatusSummary.map((item) => -item.overtimeHours),
      backgroundColor: WORK_STATUS_DATASET_META.overtime.backgroundColor,
      borderColor: WORK_STATUS_DATASET_META.overtime.borderColor,
      borderWidth: 1,
      stack: WORK_STATUS_CHART_STACK,
    },
  ],
});

export const buildStaffWorkStatusChartOptions = (
  staffWorkStatusSummary: StaffWorkStatusSummaryItem[],
): ChartOptions<"bar"> => {
  const maxWorkHours = Math.max(
    0,
    ...staffWorkStatusSummary.map(
      (item) => item.workHours + item.paidHolidayHours,
    ),
  );
  const maxOvertimeHours = Math.max(
    0,
    ...staffWorkStatusSummary.map((item) => item.overtimeHours),
  );

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, boxHeight: 12, color: "#334155" },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            formatWorkStatusTooltipLabel(
              context.dataset.label ?? "",
              context.parsed.y,
            ),
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: "#64748b",
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90,
        },
      },
      y: {
        stacked: true,
        suggestedMin:
          maxOvertimeHours > 0 ? -Math.ceil(maxOvertimeHours + 0.5) : 0,
        suggestedMax: Math.max(1, Math.ceil(maxWorkHours + 0.5)),
        ticks: { color: "#64748b", callback: (value) => `${value}h` },
        grid: { color: "rgba(148,163,184,0.22)" },
      },
    },
  };
};

export const buildAggregationPeriodInfoLabel = ({
  aggregationStartDate,
  aggregationEndDate,
}: {
  aggregationStartDate: string;
  aggregationEndDate: string;
}) =>
  `集計期間: ${dayjs(aggregationStartDate).format("M/D")}〜${dayjs(aggregationEndDate).format("M/D")}`;
