import { Typography } from "@mui/material";
import { StatCard } from "@shared/ui/card";
import { memo } from "react";

type Props = {
  countLabel: string;
  infoLabel: string;
};

function CurrentWorkingStaffCardComponent({ countLabel, infoLabel }: Props) {
  return (
    <StatCard
      label="スタッフの勤務状況"
      value={
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
      }
      info={infoLabel}
      infoTestId="admin-dashboard-current-working-staff-info"
      className="lg:min-h-[140px]"
      data-testid="admin-dashboard-current-working-staff-card"
    />
  );
}

export const CurrentWorkingStaffCard = memo(CurrentWorkingStaffCardComponent);
