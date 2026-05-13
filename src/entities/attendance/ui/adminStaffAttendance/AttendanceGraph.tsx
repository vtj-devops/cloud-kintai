import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  buildWorkStatusChartDatasets,
  buildWorkStatusStackedBarOptions,
} from "@entities/attendance/lib/workStatusChart";
import { toAttendanceWorkStatusHours } from "@entities/attendance/lib/workStatusChartAggregation";
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
    [getStandardWorkHours],
  );

  const targetMonth = useMemo(
    () => (month ? month.startOf("month") : dayjs().startOf("month")),
    [month],
  );

  const attendanceByDate = useMemo(() => {
    return attendances.reduce((map, attendance) => {
      if (attendance.workDate) {
        const key = dayjs(attendance.workDate).format(
          AttendanceDate.DataFormat,
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
      datasets: buildWorkStatusChartDatasets({
        regularHours: workTimeData,
        paidHolidayHours: paidHolidayData,
        overtimeHours: overtimeData,
        restHours: restTimeData,
        includeRestDataset: true,
        stack: "time",
        invertOvertime: false,
      }).map((dataset) => ({
        ...dataset,
        backgroundColor:
          dataset.label === "残業時間"
            ? alphaColor(dataset.borderColor, 0.82)
            : dataset.backgroundColor,
      })),
    }),
    [labels, overtimeData, paidHolidayData, restTimeData, workTimeData],
  );

  const chartOptions = useMemo(() => {
    const maxWork = Math.max(
      0,
      ...workTimeData.map(
        (workHours, index) =>
          workHours + paidHolidayData[index] + restTimeData[index],
      ),
    );
    const maxOvertime = Math.max(0, ...overtimeData);

    return buildWorkStatusStackedBarOptions({
      maxWorkHours: maxWork,
      maxOvertimeHours: maxOvertime,
      legendPosition: "bottom",
      legendUsePointStyle: false,
      legendBoxWidth: 12,
      legendBoxHeight: 12,
      tickColor: "#64748b",
      yGridColor: "rgba(148,163,184,0.22)",
      yBeginAtZero: true,
      appendHourUnitOnYAxisTicks: true,
      useWorkStatusTooltipLabel: true,
    });
  }, [overtimeData, paidHolidayData, restTimeData, workTimeData]);

  return (
    <div className="rounded-[4px] border border-slate-200/90 bg-slate-50/70 p-3.5">
      <div className="h-52">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
