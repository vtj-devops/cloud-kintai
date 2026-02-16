import { Button } from "@mui/material";
import { CSSProperties, useCallback, useMemo, useState } from "react";

import { designTokenVar } from "@/shared/designSystem";

const REST_DISABLED_BACKGROUND = designTokenVar(
  "component.timeRecorder.restButton.disabledBackground",
  "#D9E2DD"
);
const REST_BUTTON_MAX_WIDTH = designTokenVar(
  "component.timeRecorder.restButton.maxWidth",
  "220px"
);

export interface RestEndButtonProps {
  isResting: boolean;
  onRestEnd: () => void;
  disabled?: boolean;
}

const RestEndButton = ({
  isResting,
  onRestEnd,
  disabled = false,
}: RestEndButtonProps) => {
  const restButtonVars: CSSProperties & Record<`--${string}`, string> = {
    "--rest-button-max-width": REST_BUTTON_MAX_WIDTH,
    "--rest-button-disabled-bg": REST_DISABLED_BACKGROUND,
  };
  const [isProcessing, setIsProcessing] = useState(false);

  // Derived state: reset isProcessing when isResting changes
  const actualIsProcessing = useMemo(() => {
    return isResting ? false : isProcessing;
  }, [isResting, isProcessing]);

  const handleClick = useCallback(() => {
    setIsProcessing(true);
    onRestEnd();
  }, [onRestEnd]);

  return (
    <Button
      fullWidth
      onClick={handleClick}
      disabled={!isResting || actualIsProcessing || disabled}
      data-testid="rest-end-button"
      className="w-full max-w-[var(--rest-button-max-width)]"
      style={restButtonVars}
      sx={(theme) => ({
        color: theme.palette.rest.main,
        "&:hover": {
          color: theme.palette.rest.contrastText,
          backgroundColor: theme.palette.rest.main,
        },
        "&:disabled": {
          backgroundColor: "var(--rest-button-disabled-bg)",
        },
      })}
    >
      休憩終了
    </Button>
  );
};

export default RestEndButton;
