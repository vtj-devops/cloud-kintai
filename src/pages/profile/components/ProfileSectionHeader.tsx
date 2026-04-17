import { SectionTitle } from "@shared/ui/typography";
import React from "react";

interface ProfileSectionHeaderProps {
  title: string;
  description?: string;
}

export const ProfileSectionHeader = React.memo(function ProfileSectionHeader({
  title,
  description,
}: ProfileSectionHeaderProps) {
  return (
    <div className="space-y-1">
      <SectionTitle className="text-base font-semibold text-slate-900 sm:text-lg">
        {title}
      </SectionTitle>
      {description ? (
        <p className="text-sm leading-5 text-slate-500 sm:leading-6">{description}</p>
      ) : null}
    </div>
  );
});
