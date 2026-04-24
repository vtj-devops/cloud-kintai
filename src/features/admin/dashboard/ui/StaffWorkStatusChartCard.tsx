import { Typography } from "@mui/material";
import { StatCard } from "@shared/ui/card";
import { DataStateContainer } from "@shared/ui/feedback/DataStateContainer";
import { type ChartOptions } from "chart.js";
import { memo } from "react";
import { Bar } from "react-chartjs-2";

type ChartData = {
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

type Props = {
  infoLabel: string;
  isLoading: boolean;
  hasData: boolean;
  hasDuplicateAttendances?: boolean;
  duplicateAttendanceDayCount?: number;
  chartData: ChartData;
  chartOptions: ChartOptions<"bar">;
};

function StaffWorkStatusChartCardComponent({
  infoLabel,
  isLoading,
  hasData,
  hasDuplicateAttendances = false,
  duplicateAttendanceDayCount = 0,
  chartData,
  chartOptions,
}: Props) {
  return (
    <StatCard
      label="スタッフごとの勤務状況"
      value={
        <>
          {hasDuplicateAttendances ? (
            <Typography
              data-testid="admin-dashboard-staff-work-status-warning"
              sx={{ mt: 1, fontSize: "0.75rem", color: "#b45309" }}
            >
              重複勤怠がある{duplicateAttendanceDayCount}日分を含む可能性があります
            </Typography>
          ) : null}
          <div className="mt-1 h-72">
            <DataStateContainer
              isLoading={isLoading}
              hasData={hasData}
              loadingContent={
                <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                  集計中
                </div>
              }
              emptyContent={
                <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                  表示可能な勤務データがありません
                </div>
              }
            >
              <Bar
                data={chartData}
                options={chartOptions}
                data-testid="admin-dashboard-staff-work-status-chart"
              />
            </DataStateContainer>
          </div>
        </>
      }
      info={infoLabel}
      infoTestId="admin-dashboard-staff-work-status-info"
      className="h-full lg:col-span-4 md:py-3.5"
      data-testid="admin-dashboard-staff-work-status-chart-card"
    />
  );
}

export const StaffWorkStatusChartCard = memo(StaffWorkStatusChartCardComponent);
