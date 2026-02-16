import { Breadcrumbs, Link, Typography } from "@mui/material";
import { CSSProperties } from "react";

import { designTokenVar } from "@/shared/designSystem";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface CommonBreadcrumbsProps {
  items: BreadcrumbItem[];
  current: string;
}

export default function CommonBreadcrumbs({
  items,
  current,
}: CommonBreadcrumbsProps) {
  const BREADCRUMB_GAP = designTokenVar("component.breadcrumbs.gap", "8px");
  const BREADCRUMB_SEPARATOR_COLOR = designTokenVar(
    "component.breadcrumbs.separatorColor",
    "#A0B1A7"
  );
  const BREADCRUMB_LINK_COLOR = designTokenVar(
    "component.breadcrumbs.linkColor",
    "#0FA85E"
  );
  const BREADCRUMB_TEXT_COLOR = designTokenVar(
    "component.breadcrumbs.textColor",
    "#45574F"
  );
  const BREADCRUMB_FONT_SIZE = designTokenVar(
    "component.breadcrumbs.fontSize",
    "14px"
  );
  const BREADCRUMB_FONT_WEIGHT = designTokenVar(
    "component.breadcrumbs.fontWeight",
    "500"
  );
  const breadcrumbVars: CSSProperties & Record<`--${string}`, string> = {
    "--breadcrumbs-gap": BREADCRUMB_GAP,
    "--breadcrumbs-separator-color": BREADCRUMB_SEPARATOR_COLOR,
    "--breadcrumbs-link-color": BREADCRUMB_LINK_COLOR,
    "--breadcrumbs-text-color": BREADCRUMB_TEXT_COLOR,
    "--breadcrumbs-font-size": BREADCRUMB_FONT_SIZE,
    "--breadcrumbs-font-weight": BREADCRUMB_FONT_WEIGHT,
  };

  return (
    <Breadcrumbs
      className="[&_.MuiBreadcrumbs-li]:text-[length:var(--breadcrumbs-font-size)] [&_.MuiBreadcrumbs-li]:font-[var(--breadcrumbs-font-weight)] [&_.MuiBreadcrumbs-ol]:gap-[var(--breadcrumbs-gap)]"
      style={breadcrumbVars}
      separator={
        <Typography
          component="span"
          className="text-[color:var(--breadcrumbs-separator-color)]"
        >
          /
        </Typography>
      }
    >
      {items.map((item, idx) =>
        item.href ? (
          <Link
            href={item.href}
            key={idx}
            underline="hover"
            className="text-[color:var(--breadcrumbs-link-color)] no-underline hover:underline"
          >
            {item.label}
          </Link>
        ) : (
          <Typography
            className="text-[color:var(--breadcrumbs-text-color)]"
            key={idx}
          >
            {item.label}
          </Typography>
        )
      )}
      <Typography
        className="text-[color:var(--breadcrumbs-text-color)]"
        aria-current="page"
      >
        {current}
      </Typography>
    </Breadcrumbs>
  );
}
