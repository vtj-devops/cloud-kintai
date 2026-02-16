import { Button, useMediaQuery, useTheme } from "@mui/material";
import { CSSProperties, useCallback, useMemo, useState } from "react";

import { designTokenVar } from "@/shared/designSystem";

const ACTION_BUTTON_SIZE = designTokenVar(
  "component.timeRecorder.actionButton.size",
  "120px"
);
const ACTION_BUTTON_SIZE_SM = designTokenVar(
  "component.timeRecorder.actionButton.sizeSm",
  "96px"
);
const ACTION_BUTTON_RADIUS = designTokenVar(
  "component.timeRecorder.actionButton.borderRadius",
  "999px"
);
const ACTION_BORDER_WIDTH = designTokenVar(
  "component.timeRecorder.actionButton.borderWidth",
  "3px"
);
const ACTION_DISABLED_BORDER = designTokenVar(
  "component.timeRecorder.actionButton.disabledBorderColor",
  "#C3CFC7"
);
const ACTION_DISABLED_BACKGROUND = designTokenVar(
  "component.timeRecorder.actionButton.disabledBackground",
  "#D9E2DD"
);

export interface ClockInButtonProps {
  isBeforeWork: boolean;
  onClockIn: () => void;
  disabled?: boolean;
}

const ClockInButton = ({
  isBeforeWork,
  onClockIn,
  disabled = false,
}: ClockInButtonProps) => {
  const actionButtonVars: CSSProperties & Record<`--${string}`, string> = {
    "--action-button-size": ACTION_BUTTON_SIZE,
    "--action-button-size-sm": ACTION_BUTTON_SIZE_SM,
    "--action-button-radius": ACTION_BUTTON_RADIUS,
    "--action-border-width": ACTION_BORDER_WIDTH,
    "--action-disabled-border": ACTION_DISABLED_BORDER,
    "--action-disabled-bg": ACTION_DISABLED_BACKGROUND,
  };
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [clicked, setClicked] = useState(false);

  // Derived state: reset clicked when isBeforeWork changes
  const actualClicked = useMemo(() => {
    return isBeforeWork ? false : clicked;
  }, [isBeforeWork, clicked]);

  const handleClick = useCallback(() => {
    setClicked(true);
    onClockIn();
  }, [onClockIn]);

  return (
    <Button
      data-testid="clock-in-button"
      onClick={handleClick}
      disabled={!isBeforeWork || actualClicked || disabled}
      className={isSmallScreen ? "whitespace-pre-line leading-[1.2]" : undefined}
      style={actionButtonVars}
      sx={(innerTheme) => ({
        width: "var(--action-button-size)",
        height: "var(--action-button-size)",
        minWidth: "var(--action-button-size)",
        borderRadius: "var(--action-button-radius)",
        p: 0,
        color: innerTheme.palette.clock_in.contrastText,
        backgroundColor: innerTheme.palette.clock_in.main,
        border: `var(--action-border-width) solid ${innerTheme.palette.clock_in.main}`,
        [innerTheme.breakpoints.down("sm")]: {
          width: "var(--action-button-size-sm)",
          height: "var(--action-button-size-sm)",
          minWidth: "var(--action-button-size-sm)",
          fontSize: "0.95rem",
        },
        "&:hover": {
          color: innerTheme.palette.clock_in.main,
          backgroundColor: innerTheme.palette.clock_in.contrastText,
        },
        "&:disabled": {
          border: "var(--action-border-width) solid var(--action-disabled-border)",
          backgroundColor: "var(--action-disabled-bg)",
        },
      })}
    >
      {isSmallScreen ? "勤務\n開始" : "勤務開始"}
    </Button>
  );
};

export default ClockInButton;
