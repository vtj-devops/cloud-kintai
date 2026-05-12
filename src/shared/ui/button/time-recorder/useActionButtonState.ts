import { useCallback, useState } from "react";

type UseActionButtonStateOptions = {
  canInteract: boolean;
  disabled?: boolean;
};

export function useActionButtonState({
  canInteract,
  disabled = false,
}: UseActionButtonStateOptions) {
  const [isPending, setIsPending] = useState(false);
  const isDisabled = disabled || !canInteract || isPending;

  const runWithPending = useCallback((action: () => unknown) => {
    if (isDisabled) {
      return false;
    }

    setIsPending(true);

    Promise.resolve(action())
      .catch(() => undefined)
      .finally(() => {
        setIsPending(false);
      });

    return true;
  }, [isDisabled]);

  return {
    isDisabled,
    runWithPending,
  };
}
