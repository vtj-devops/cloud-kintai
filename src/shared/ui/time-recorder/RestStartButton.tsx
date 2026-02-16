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

export interface RestStartButtonProps {
  isWorking: boolean;
  onRestStart: () => void;
  disabled?: boolean;
}

const RestStartButton = ({
  isWorking,
  onRestStart,
  disabled = false,
}: RestStartButtonProps) => {
  const restButtonVars: CSSProperties & Record<`--${string}`, string> = {
    "--rest-button-max-width": REST_BUTTON_MAX_WIDTH,
    "--rest-button-disabled-bg": REST_DISABLED_BACKGROUND,
  };
  const [isPending, setIsPending] = useState(false);

  // Derived state: reset isPending when isWorking changes
  const actualIsPending = useMemo(() => {
    return isWorking ? false : isPending;
  }, [isWorking, isPending]);

  const handleClick = useCallback(() => {
    setIsPending(true);
    onRestStart();
  }, [onRestStart]);

  return (
    <Button
      fullWidth
      onClick={handleClick}
      disabled={!isWorking || actualIsPending || disabled}
      data-testid="rest-start-button"
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
      休憩開始
    </Button>
  );
};

export default RestStartButton;
