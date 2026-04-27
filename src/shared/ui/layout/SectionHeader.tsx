import { SectionTitle } from "@shared/ui/typography";
import clsx from "clsx";
import React from "react";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={clsx("space-y-1", className)}>
      <SectionTitle className="text-base font-semibold text-slate-900 sm:text-lg">
        {title}
      </SectionTitle>
      {description ? (
        <p className="text-sm leading-5 text-slate-500 sm:leading-6">{description}</p>
      ) : null}
    </div>
  );
});
