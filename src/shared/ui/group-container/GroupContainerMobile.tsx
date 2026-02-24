import { Box, Stack, SxProps, Theme, Typography } from "@mui/material";
import { CSSProperties, ReactNode } from "react";

import { designTokenVar } from "@/shared/designSystem";

const GROUP_BORDER_WIDTH = designTokenVar(
  "component.groupContainer.borderWidth",
  "1px",
);
const GROUP_ACCENT_WIDTH = designTokenVar(
  "component.groupContainer.accentWidthMobile",
  "4px",
);
const GROUP_BORDER_COLOR = designTokenVar(
  "component.groupContainer.borderColor",
  "#D9E2DD",
);
const GROUP_ACCENT_COLOR = designTokenVar(
  "component.groupContainer.accentColor",
  "#0FA85E",
);
const GROUP_RADIUS = designTokenVar(
  "component.groupContainer.borderRadius",
  "12px",
);
const GROUP_PADDING = designTokenVar(
  "component.groupContainer.paddingMobile",
  "12px",
);
const GROUP_BACKGROUND = designTokenVar(
  "component.groupContainer.background",
  "#FFFFFF",
);
const GROUP_CONTENT_GAP = designTokenVar(
  "component.groupContainer.contentGap",
  "8px",
);
const GROUP_COUNT_COLOR = designTokenVar(
  "component.groupContainer.countColor",
  "#5E726A",
);

export interface GroupContainerMobileProps {
  title?: string;
  count?: number;
  hideAccent?: boolean;
  hideBorder?: boolean;
  sx?: SxProps<Theme>;
  children?: ReactNode;
}

const GroupContainerMobile = ({
  title,
  count,
  hideAccent = false,
  hideBorder = false,
  children,
  sx,
}: GroupContainerMobileProps) => {
  const groupVars: CSSProperties & Record<`--${string}`, string> = {
    "--group-border-width": GROUP_BORDER_WIDTH,
    "--group-accent-width": GROUP_ACCENT_WIDTH,
    "--group-border-color": GROUP_BORDER_COLOR,
    "--group-accent-color": GROUP_ACCENT_COLOR,
    "--group-radius": GROUP_RADIUS,
    "--group-padding": GROUP_PADDING,
    "--group-background": GROUP_BACKGROUND,
    "--group-content-gap": GROUP_CONTENT_GAP,
    "--group-count-color": GROUP_COUNT_COLOR,
  };
  if (hideAccent) {
    groupVars["--group-accent-width"] = "0px";
  }
  if (hideBorder) {
    groupVars["--group-border-width"] = "0px";
    groupVars["--group-border-color"] = "transparent";
  }

  return (
    <Box
      className="rounded-[var(--group-radius)] border-[var(--group-border-width)] border-[var(--group-border-color)] border-l-[var(--group-accent-width)] border-l-[var(--group-accent-color)] border-solid bg-[var(--group-background)] p-[var(--group-padding)]"
      style={groupVars}
      sx={sx}
    >
      {title ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {typeof count === "number" && (
            <Typography
              variant="caption"
              className="text-[color:var(--group-count-color)]"
            >
              {`(${count}件)`}
            </Typography>
          )}
        </Stack>
      ) : null}

      <Box className="mt-[var(--group-content-gap)]">{children}</Box>
    </Box>
  );
};

export default GroupContainerMobile;
