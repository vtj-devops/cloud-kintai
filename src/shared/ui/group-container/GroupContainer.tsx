import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  IconButton,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { CSSProperties, ReactNode, useState } from "react";

import { designTokenVar } from "@/shared/designSystem";

const GROUP_BORDER_WIDTH = designTokenVar(
  "component.groupContainer.borderWidth",
  "1px",
);
const GROUP_ACCENT_WIDTH = designTokenVar(
  "component.groupContainer.accentWidth",
  "3px",
);
const GROUP_BORDER_COLOR = designTokenVar(
  "component.groupContainer.borderColor",
  "#E8EFEB",
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
  "component.groupContainer.padding",
  "16px",
);
const GROUP_BACKGROUND = designTokenVar(
  "component.groupContainer.background",
  "#FFFFFF",
);
const GROUP_SHADOW = designTokenVar(
  "component.groupContainer.shadow",
  "0 2px 4px rgba(15, 168, 94, 0.04)",
);
const GROUP_HEADER_GAP = designTokenVar(
  "component.groupContainer.headerGap",
  "8px",
);
const GROUP_CONTENT_GAP = designTokenVar(
  "component.groupContainer.contentGap",
  "8px",
);
const GROUP_COUNT_COLOR = designTokenVar(
  "component.groupContainer.countColor",
  "#5E726A",
);

export interface GroupContainerProps {
  title?: string;
  count?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  hideAccent?: boolean;
  hideBorder?: boolean;
  sx?: SxProps<Theme>;
  children?: ReactNode;
}

const GroupContainer = ({
  title,
  count,
  collapsible = false,
  defaultCollapsed = false,
  hideAccent = false,
  hideBorder = false,
  children,
  sx,
}: GroupContainerProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);
  const borderClassName = hideBorder
    ? "border-0"
    : "border-[var(--group-border-width)] border-[var(--group-border-color)]";
  const accentClassName = hideAccent
    ? "border-l-0"
    : "border-l-[var(--group-accent-width)] border-l-[var(--group-accent-color)]";
  const groupVars: CSSProperties & Record<`--${string}`, string> = {
    "--group-border-width": GROUP_BORDER_WIDTH,
    "--group-accent-width": GROUP_ACCENT_WIDTH,
    "--group-border-color": GROUP_BORDER_COLOR,
    "--group-accent-color": GROUP_ACCENT_COLOR,
    "--group-radius": GROUP_RADIUS,
    "--group-padding": GROUP_PADDING,
    "--group-background": GROUP_BACKGROUND,
    "--group-shadow": GROUP_SHADOW,
    "--group-header-gap": GROUP_HEADER_GAP,
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
      className={`rounded-[var(--group-radius)] border-solid bg-[var(--group-background)] p-[var(--group-padding)] shadow-[var(--group-shadow)] ${borderClassName} ${accentClassName}`}
      style={groupVars}
      sx={sx}
    >
      {(title || collapsible) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--group-header-gap)]">
            {title ? (
              <Typography variant="subtitle1" fontWeight={700}>
                {title}
              </Typography>
            ) : null}
            {typeof count === "number" && (
              <Typography
                variant="caption"
                className="text-[color:var(--group-count-color)]"
              >
                {`(${count}件)`}
              </Typography>
            )}
          </div>
          {collapsible && (
            <IconButton
              size="small"
              onClick={() => setCollapsed((s) => !s)}
              aria-label={collapsed ? "expand" : "collapse"}
            >
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          )}
        </div>
      )}

      <Collapse in={!collapsed}>
        <Box className="mt-[var(--group-content-gap)]">{children}</Box>
      </Collapse>
    </Box>
  );
};

export default GroupContainer;
