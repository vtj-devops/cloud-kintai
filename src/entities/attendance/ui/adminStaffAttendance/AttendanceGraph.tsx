import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  WORK_STATUS_DATASET_META,
} from "@entities/attendance/lib/workStatusChart";
import {
  toAttendanceWorkStatusHours,
} from "@entities/attendance/lib/workStatusChartAggregation";
import { Attendance } from "@shared/api/graphql/types";
import { alphaColor } from "@shared/lib/color";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import dayjs, { Dayjs } from "dayjs";
import { useContext, useMemo } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

export function AttendanceGraph({
  attendances,
  month,
}: {
  attendances: Attendance[];
  month?: Dayjs;
}) {
  const { getStandardWorkHours } = useContext(AppConfigContext);

  const standardWorkHours = useMemo(
    () => getStandardWorkHours(),
    [getStandardWorkHours]
  );

  const targetMonth = useMemo(
    () => (month ? month.startOf("month") : dayjs().startOf("month")),
    [month]
  );

  const attendanceByDate = useMemo(() => {
    return attendances.reduce((map, attendance) => {
      if (attendance.workDate) {
        const key = dayjs(attendance.workDate).format(
          AttendanceDate.DataFormat
        );
        map.set(key, attendance);
      }
      return map;
    }, new Map<string, Attendance>());
  }, [attendances]);

  const daysInMonth = useMemo(() => targetMonth.daysInMonth(), [targetMonth]);

  const { workTimeData, paidHolidayData, restTimeData, overtimeData, labels } =
    useMemo(() => {
      const workTime: number[] = [];
      const paidHoliday: number[] = [];
      const restTime: number[] = [];
      const overtime: number[] = [];
      const dateLabels: string[] = [];

      for (let i = 0; i < daysInMonth; i += 1) {
        const date = targetMonth.add(i, "day");
        const key = date.format(AttendanceDate.DataFormat);
        const attendance = attendanceByDate.get(key);

        const hours = attendance
          ? toAttendanceWorkStatusHours({
              attendance,
              standardWorkHours,
              hideRestHoursOnPaidHoliday: true,
            })
          : {
              workHours: 0,
              paidHolidayHours: 0,
              restHours: 0,
              overtimeHours: 0,
            };

        workTime.push(hours.workHours);
        paidHoliday.push(hours.paidHolidayHours);
        restTime.push(hours.restHours);
        overtime.push(hours.overtimeHours);
        dateLabels.push(date.format("M/D"));
      }

      return {
        workTimeData: workTime,
        paidHolidayData: paidHoliday,
        restTimeData: restTime,
        overtimeData: overtime,
        labels: dateLabels,
      };
    }, [attendanceByDate, daysInMonth, standardWorkHours, targetMonth]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: WORK_STATUS_DATASET_META.regular.label,
          data: workTimeData,
          backgroundColor: WORK_STATUS_DATASET_META.regular.backgroundColor,
          borderRadius: 6,
          borderSkipped: false as const,
          stack: "time",
        },
        {
          label: WORK_STATUS_DATASET_META.paidHoliday.label,
          data: paidHolidayData,
          backgroundColor: WORK_STATUS_DATASET_META.paidHoliday.backgroundColor,
          borderRadius: 6,
          borderSkipped: false as const,
          stack: "time",
        },
        {
          label: WORK_STATUS_DATASET_META.rest.label,
          data: restTimeData,
          backgroundColor: WORK_STATUS_DATASET_META.rest.backgroundColor,
          borderRadius: 6,
          borderSkipped: false as const,
          stack: "time",
        },
        {
          label: WORK_STATUS_DATASET_META.overtime.label,
          data: overtimeData,
          backgroundColor: alphaColor(
            WORK_STATUS_DATASET_META.overtime.borderColor,
            0.82,
          ),
          borderRadius: 6,
          borderSkipped: false as const,
          stack: "time",
        },
      ],
    }),
    [labels, overtimeData, paidHolidayData, restTimeData, workTimeData],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            color: "#334155",
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
            color: "#64748B",
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: alphaColor("#0F172A", 0.08),
          },
          ticks: {
            color: "#64748B",
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="rounded-[24px] border border-emerald-200/60 bg-[linear-gradient(180deg,#f8fffb_0%,#f2fbf7_100%)] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:px-5">
      <div className="h-[220px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
