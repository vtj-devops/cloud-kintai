import { Typography } from "@mui/material";
import type { ReactNode } from "react";

import { designTokenVar } from "@/shared/designSystem";

type HeadlineProps = {
  children: ReactNode;
};

export const Headline = ({ children }: HeadlineProps) => {
  const HEADLINE_ACCENT_COLOR = designTokenVar(
    "component.headline.accentColor",
    "#0FA85E"
  );
  const HEADLINE_BORDER_WIDTH = designTokenVar(
    "component.headline.borderWidth",
    "5px"
  );
  const HEADLINE_PADDING_LEFT = designTokenVar(
    "component.headline.paddingLeft",
    "8px"
  );
  const HEADLINE_TEXT_COLOR = designTokenVar(
    "component.headline.textColor",
    "#0FA85E"
  );
  return (
    <Typography
      component="h2"
      variant="h4"
      style={{
        borderLeft: `solid ${HEADLINE_BORDER_WIDTH} ${HEADLINE_ACCENT_COLOR}`,
        borderBottom: `solid ${HEADLINE_BORDER_WIDTH} ${HEADLINE_ACCENT_COLOR}`,
        paddingLeft: HEADLINE_PADDING_LEFT,
        color: HEADLINE_TEXT_COLOR,
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  );
};
