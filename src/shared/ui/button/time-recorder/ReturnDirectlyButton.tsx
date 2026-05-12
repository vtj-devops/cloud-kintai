import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

export interface ReturnDirectlyButtonProps {
  isWorking: boolean;
  onReturnDirectly: () => void;
  disabled?: boolean;
}

const ReturnDirectlyButton = ({
  isWorking,
  onReturnDirectly,
  disabled = false,
}: ReturnDirectlyButtonProps) => {
  const actionButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.subtleDanger,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isWorking,
    disabled,
  });
  const handleClick = useCallback(() => {
    runWithPending(onReturnDirectly);
  }, [onReturnDirectly, runWithPending]);

  return (
    <ActionCardButton
      testId="return-directly-button"
      style={actionButtonVars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="直帰"
      helper={null}
    />
  );
};

export default ReturnDirectlyButton;
