import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

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
  const restButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.rest,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isWorking,
    disabled,
  });

  const handleClick = useCallback(() => {
    runWithPending(onRestStart);
  }, [onRestStart, runWithPending]);

  return (
    <ActionCardButton
      testId="rest-start-button"
      style={restButtonVars}
      size="slim"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="休憩開始"
      helper={null}
    />
  );
};

export default RestStartButton;
