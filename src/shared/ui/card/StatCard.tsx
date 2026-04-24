import InfoIconTooltip from "@shared/ui/tooltip/InfoIconTooltip";
import type { ReactNode } from "react";

import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | ReactNode;
  icon?: ReactNode;
  info?: string;
  infoTestId?: string;
  className?: string;
  "data-testid"?: string;
};

export function StatCard({
  label,
  value,
  icon,
  info,
  infoTestId = "stat-card-info",
  className,
  "data-testid": testId,
}: StatCardProps) {
  const hasHeaderActions = icon !== undefined || info !== undefined;

  return (
    <Card className={className} data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-xs font-medium tracking-[0.03em] text-slate-500">
          {label}
        </p>
        {hasHeaderActions && (
          <div className="flex shrink-0 items-center gap-2">
            {icon}
            {info && (
              <InfoIconTooltip
                testId={infoTestId}
                ariaLabel={info}
                tooltipContent={info}
              />
            )}
          </div>
        )}
      </div>
      {typeof value === "string" ? (
        <p className="m-0 mt-1.5 text-2xl font-extrabold leading-none tracking-[-0.03em] text-slate-950">
          {value}
        </p>
      ) : (
        value
      )}
    </Card>
  );
}
