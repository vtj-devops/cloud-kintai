import LeaveGuardDialog from "@shared/ui/feedback/LeaveGuardDialog";
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { useBlocker } from "react-router-dom";

type UsePageLeaveGuardOptions = {
  isDirty?: boolean;
  isBusy?: boolean;
};

const isPromiseLike = <T,>(value: T): value is T & PromiseLike<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof (value as PromiseLike<unknown>).then === "function";

export function usePageLeaveGuard({
  isDirty = false,
  isBusy = false,
}: UsePageLeaveGuardOptions): {
  dialog: ReactNode;
  runWithoutGuard: <T>(callback: () => T) => T;
} {
  const shouldBlock = isDirty || isBusy;
  const skipGuardRef = useRef(false);

  const blocker = useBlocker(
    useCallback(() => shouldBlock && !skipGuardRef.current, [shouldBlock]),
  );

  useEffect(() => {
    if (!shouldBlock) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (skipGuardRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock]);

  const runWithoutGuard = useCallback(<T,>(callback: () => T): T => {
    skipGuardRef.current = true;

    const resetGuard = () => {
      skipGuardRef.current = false;
    };

    try {
      const result = callback();

      if (isPromiseLike(result)) {
        return Promise.resolve(result).finally(resetGuard) as T;
      }

      queueMicrotask(resetGuard);
      return result;
    } catch (error) {
      resetGuard();
      throw error;
    }
  }, []);

  const dialog = useMemo(
    () =>
      blocker.state === "blocked" ? (
        <LeaveGuardDialog
          open
          target="page"
          isBusy={isBusy}
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        />
      ) : null,
    [blocker, isBusy],
  );

  return {
    dialog,
    runWithoutGuard,
  };
}
