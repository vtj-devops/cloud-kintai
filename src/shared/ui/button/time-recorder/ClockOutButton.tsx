import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

export interface ClockOutButtonProps {
  isWorking: boolean;
  onClockOut: () => void;
  disabled?: boolean;
}

const ClockOutButton = ({
  isWorking,
  onClockOut,
  disabled = false,
}: ClockOutButtonProps) => {
  const actionButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.clockOut,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isWorking,
    disabled,
  });

  const handleClick = useCallback(() => {
    runWithPending(onClockOut);
  }, [onClockOut, runWithPending]);

  return (
    <ActionCardButton
      testId="clock-out-button"
      style={actionButtonVars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label={"勤務\n終了"}
      helper={null}
    />
  );
};

export default ClockOutButton;
