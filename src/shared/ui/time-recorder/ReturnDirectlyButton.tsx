import { Button } from "@mui/material";
import { CSSProperties, useMemo, useState } from "react";

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

export interface ReturnDirectlyButtonProps {
  isWorking: boolean;
  onReturnDirectly: () => void;
}

const ReturnDirectlyButton = ({
  isWorking,
  onReturnDirectly,
}: ReturnDirectlyButtonProps) => {
  const actionButtonVars: CSSProperties & Record<`--${string}`, string> = {
    "--action-button-size": ACTION_BUTTON_SIZE,
    "--action-button-size-sm": ACTION_BUTTON_SIZE_SM,
    "--action-button-radius": ACTION_BUTTON_RADIUS,
    "--action-border-width": ACTION_BORDER_WIDTH,
    "--action-disabled-border": ACTION_DISABLED_BORDER,
    "--action-disabled-bg": ACTION_DISABLED_BACKGROUND,
  };
  const [isClicking, setIsClicking] = useState(false);

  // Derived state: button is disabled when not working or user clicked
  const disabled = useMemo(() => {
    return !isWorking || isClicking;
  }, [isWorking, isClicking]);

  return (
    <Button
      data-testid="return-directly-button"
      onClick={() => {
        setIsClicking(true);
        onReturnDirectly();
      }}
      disabled={disabled}
      style={actionButtonVars}
      sx={(theme) => ({
        width: "var(--action-button-size)",
        height: "var(--action-button-size)",
        minWidth: "var(--action-button-size)",
        borderRadius: "var(--action-button-radius)",
        p: 0,
        color: theme.palette.clock_out.contrastText,
        backgroundColor: theme.palette.clock_out.main,
        border: `var(--action-border-width) solid ${theme.palette.clock_out.main}`,
        [theme.breakpoints.down("sm")]: {
          width: "var(--action-button-size-sm)",
          height: "var(--action-button-size-sm)",
          minWidth: "var(--action-button-size-sm)",
          fontSize: "0.95rem",
        },
        "&:hover": {
          color: theme.palette.clock_out.main,
          backgroundColor: theme.palette.clock_out.contrastText,
          border: `var(--action-border-width) solid ${theme.palette.clock_out.main}`,
        },
        "&:disabled": {
          border: "var(--action-border-width) solid var(--action-disabled-border)",
          backgroundColor: "var(--action-disabled-bg)",
        },
      })}
    >
      直帰
    </Button>
  );
};

export default ReturnDirectlyButton;
