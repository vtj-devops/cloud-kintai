import { Tooltip, Typography } from "@mui/material";
import { memo } from "react";

import { DashboardCard } from "./DashboardCard";

type Props = {
  countLabel: string;
  infoLabel: string;
};

function CurrentWorkingStaffCardComponent({ countLabel, infoLabel }: Props) {
  return (
    <DashboardCard
      data-testid="admin-dashboard-current-working-staff-card"
      className="lg:min-h-[140px]"
    >
      <div className="flex items-start justify-between gap-3">
        <Typography
          component="h2"
          sx={{ m: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}
        >
          スタッフの勤務状況
        </Typography>
        <Tooltip title={infoLabel} arrow>
          <button
            type="button"
            data-testid="admin-dashboard-current-working-staff-info"
            aria-label={infoLabel}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold leading-none text-slate-600"
          >
            i
          </button>
        </Tooltip>
      </div>
      <Typography
        data-testid="admin-dashboard-current-working-staff-count"
        sx={{
          mt: 1,
          m: 0,
          fontSize: { xs: "2rem", md: "2.25rem" },
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: "#0f172a",
        }}
      >
        {countLabel}
      </Typography>
    </DashboardCard>
  );
}

export const CurrentWorkingStaffCard = memo(CurrentWorkingStaffCardComponent);
