import { Typography } from "@mui/material";
import { memo } from "react";

import { DashboardCard } from "./DashboardCard";

type Props = {
  submittedCountLabel: string;
  approvedCountLabel: string;
  isLoading: boolean;
};

function DailyReportStatusCardComponent({
  submittedCountLabel,
  approvedCountLabel,
  isLoading,
}: Props) {
  return (
    <DashboardCard
      data-testid="admin-dashboard-daily-report-status-card"
      className="lg:min-h-[140px]"
    >
      <Typography
        component="h2"
        sx={{ m: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}
      >
        今日の日報提出状況
      </Typography>
      <Typography
        data-testid="admin-dashboard-daily-report-submitted-count"
        sx={{
          mt: 1,
          m: 0,
          fontSize: { xs: "2rem", md: "2.25rem" },
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "#0f172a",
        }}
      >
        {submittedCountLabel}
        {!isLoading ? (
          <span
            data-testid="admin-dashboard-daily-report-approved-count"
            className="ml-1 text-sm font-semibold tracking-normal text-slate-500 md:text-base"
          >
            (確認済み {approvedCountLabel})
          </span>
        ) : null}
      </Typography>
    </DashboardCard>
  );
}

export const DailyReportStatusCard = memo(DailyReportStatusCardComponent);
