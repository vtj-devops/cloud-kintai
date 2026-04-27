import { Typography } from "@mui/material";
import { StatCard } from "@shared/ui/card";
import { memo } from "react";

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
    <StatCard
      label="今日の日報提出状況"
      value={
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
      }
      className="lg:min-h-[140px]"
      data-testid="admin-dashboard-daily-report-status-card"
    />
  );
}

export const DailyReportStatusCard = memo(DailyReportStatusCardComponent);
