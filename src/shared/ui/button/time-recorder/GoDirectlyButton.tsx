import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

export interface GoDirectlyButtonProps {
  isBeforeWork: boolean;
  onGoDirectly: () => void;
  disabled?: boolean;
}

const GoDirectlyButton = ({
  isBeforeWork,
  onGoDirectly,
  disabled = false,
}: GoDirectlyButtonProps) => {
  const actionButtonVars = buildActionCardVars(
    TIME_RECORDER_BUTTON_PALETTES.subtle,
  );
  const { isDisabled, runWithPending } = useActionButtonState({
    canInteract: isBeforeWork,
    disabled,
  });

  const handleClick = useCallback(() => {
    runWithPending(onGoDirectly);
  }, [onGoDirectly, runWithPending]);

  return (
    <ActionCardButton
      testId="go-directly-button"
      style={actionButtonVars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="直行"
      helper={null}
    />
  );
};

export default GoDirectlyButton;
