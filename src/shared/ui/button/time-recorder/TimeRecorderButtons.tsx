import { useCallback } from "react";

import ActionCardButton from "./ActionCardButton";
import {
  buildActionCardVars,
  TIME_RECORDER_BUTTON_PALETTES,
} from "./buttonStyles";
import { useActionButtonState } from "./useActionButtonState";

// ---------------------------------------------------------------------------
// ClockInButton
// ---------------------------------------------------------------------------

export interface ClockInButtonProps {
  isBeforeWork: boolean;
  onClockIn: () => void;
  disabled?: boolean;
}

export function ClockInButton({
  isBeforeWork,
  onClockIn,
  disabled = false,
}: ClockInButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.clockIn);
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
      style={vars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label={"勤務\n開始"}
      helper={null}
    />
  );
}

// ---------------------------------------------------------------------------
// ClockOutButton
// ---------------------------------------------------------------------------

export interface ClockOutButtonProps {
  isWorking: boolean;
  onClockOut: () => void;
  disabled?: boolean;
}

export function ClockOutButton({
  isWorking,
  onClockOut,
  disabled = false,
}: ClockOutButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.clockOut);
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
      style={vars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label={"勤務\n終了"}
      helper={null}
    />
  );
}

// ---------------------------------------------------------------------------
// RestStartButton
// ---------------------------------------------------------------------------

export interface RestStartButtonProps {
  isWorking: boolean;
  onRestStart: () => void;
  disabled?: boolean;
}

export function RestStartButton({
  isWorking,
  onRestStart,
  disabled = false,
}: RestStartButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.rest);
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
      style={vars}
      size="slim"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="休憩開始"
      helper={null}
    />
  );
}

// ---------------------------------------------------------------------------
// RestEndButton
// ---------------------------------------------------------------------------

export interface RestEndButtonProps {
  isResting: boolean;
  onRestEnd: () => void;
  disabled?: boolean;
}

export function RestEndButton({
  isResting,
  onRestEnd,
  disabled = false,
}: RestEndButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.rest);
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
      style={vars}
      size="slim"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="休憩終了"
      helper={null}
    />
  );
}

// ---------------------------------------------------------------------------
// GoDirectlyButton
// ---------------------------------------------------------------------------

export interface GoDirectlyButtonProps {
  isBeforeWork: boolean;
  onGoDirectly: () => void;
  disabled?: boolean;
}

export function GoDirectlyButton({
  isBeforeWork,
  onGoDirectly,
  disabled = false,
}: GoDirectlyButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.subtle);
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
      style={vars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="直行"
      helper={null}
    />
  );
}

// ---------------------------------------------------------------------------
// ReturnDirectlyButton
// ---------------------------------------------------------------------------

export interface ReturnDirectlyButtonProps {
  isWorking: boolean;
  onReturnDirectly: () => void;
  disabled?: boolean;
}

export function ReturnDirectlyButton({
  isWorking,
  onReturnDirectly,
  disabled = false,
}: ReturnDirectlyButtonProps) {
  const vars = buildActionCardVars(TIME_RECORDER_BUTTON_PALETTES.subtleDanger);
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
      style={vars}
      shape="circle"
      layout="center"
      disabled={isDisabled}
      onClick={handleClick}
      label="直帰"
      helper={null}
    />
  );
}
