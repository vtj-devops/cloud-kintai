import { SectionHeader } from "@shared/ui/layout";
import React from "react";

interface ProfileSectionHeaderProps {
  title: string;
  description?: string;
}

export const ProfileSectionHeader = React.memo(function ProfileSectionHeader(
  props: ProfileSectionHeaderProps,
) {
  return <SectionHeader {...props} />;
});
