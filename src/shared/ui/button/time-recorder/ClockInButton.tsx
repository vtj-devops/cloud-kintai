import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

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
  const actionButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.clockIn,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isBeforeWork,
    disabled,
  });

  const handleClick = useCallback(() => {
    runWithPending(onClockIn);
  }, [onClockIn, runWithPending]);

  return (
    <ActionCardButton
      testId="clock-in-button"
      style={actionButtonVars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label={"勤務\n開始"}
      helper={null}
    />
  );
};

export default ClockInButton;
