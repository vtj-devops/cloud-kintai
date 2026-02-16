import { Typography, type TypographyProps } from "@mui/material";
import { forwardRef } from "react";

import { designTokenVar } from "@/shared/designSystem";

type TitleProps = {
  borderColor?: string;
  color?: string;
} & Omit<TypographyProps, "color">;

const TITLE_ACCENT_COLOR = designTokenVar(
  "component.title.accentColor",
  "#0FA85E"
);
const TITLE_BORDER_WIDTH = designTokenVar("component.title.borderWidth", "5px");
const TITLE_PADDING_LEFT = designTokenVar("component.title.paddingLeft", "8px");
const TITLE_TEXT_COLOR = designTokenVar("component.title.textColor", "#0FA85E");

const Title = forwardRef<HTMLSpanElement, TitleProps>(function Title(
  {
    children,
    borderColor,
    color = TITLE_TEXT_COLOR,
    sx,
    variant = "h1",
    ...typographyProps
  },
  ref
) {
  const resolvedBorderColor = borderColor ?? color ?? TITLE_ACCENT_COLOR;

  return (
    <Typography
      ref={ref}
      variant={variant}
      style={{
        paddingLeft: TITLE_PADDING_LEFT,
        borderBottom: `solid ${TITLE_BORDER_WIDTH} ${resolvedBorderColor}`,
        color,
      }}
      sx={sx}
      {...typographyProps}
    >
      {children}
    </Typography>
  );
});

Title.displayName = "Title";

export default Title;
