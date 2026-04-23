import { Card } from "@shared/ui/card";
import React from "react";

type DashboardCardProps = {
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function DashboardCard({ children, className, "data-testid": testId }: DashboardCardProps) {
  return (
    <Card data-testid={testId} className={className}>
      {children}
    </Card>
  );
}
