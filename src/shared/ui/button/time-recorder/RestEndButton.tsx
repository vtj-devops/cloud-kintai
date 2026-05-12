import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

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
  const restButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.rest,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isResting,
    disabled,
  });

  const handleClick = useCallback(() => {
    runWithPending(onRestEnd);
  }, [onRestEnd, runWithPending]);

  return (
    <ActionCardButton
      testId="rest-end-button"
      style={restButtonVars}
      size="slim"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="休憩終了"
      helper={null}
    />
  );
};

export default RestEndButton;
