import { Tooltip, Typography } from "@mui/material";
import { DataStateContainer } from "@shared/ui/feedback/DataStateContainer";
import { type ChartOptions } from "chart.js";
import { memo } from "react";
import { Bar } from "react-chartjs-2";

import { DashboardCard } from "./DashboardCard";

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
    <DashboardCard
      data-testid="admin-dashboard-staff-work-status-chart-card"
      className="h-full lg:col-span-4 md:py-3.5"
    >
      <div className="flex items-start justify-between gap-3">
        <Typography
          component="h2"
          sx={{ m: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}
        >
          スタッフごとの勤務状況
        </Typography>
        <Tooltip title={infoLabel} arrow>
          <button
            type="button"
            data-testid="admin-dashboard-staff-work-status-info"
            aria-label={infoLabel}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold leading-none text-slate-600"
          >
            i
          </button>
        </Tooltip>
      </div>
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
    </DashboardCard>
  );
}

export const StaffWorkStatusChartCard = memo(StaffWorkStatusChartCardComponent);
