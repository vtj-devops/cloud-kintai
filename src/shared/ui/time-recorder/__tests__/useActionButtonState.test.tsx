import { useActionButtonState } from "@shared/ui/button/time-recorder";
import { act, renderHook, waitFor } from "@testing-library/react";

describe("useActionButtonState", () => {
  it("resets pending state after async action resolves", async () => {
    const { result } = renderHook(() =>
      useActionButtonState({ canInteract: true }),
    );

    let resolveAction: (() => void) | null = null;
    const actionPromise = new Promise<void>((resolve) => {
      resolveAction = resolve;
    });

    act(() => {
      const accepted = result.current.runWithPending(() => actionPromise);
      expect(accepted).toBe(true);
    });

    expect(result.current.isDisabled).toBe(true);

    await act(async () => {
      resolveAction?.();
      await actionPromise;
    });

    await waitFor(() => {
      expect(result.current.isDisabled).toBe(false);
    });
  });

  it("resets pending state after async action rejects", async () => {
    const { result } = renderHook(() =>
      useActionButtonState({ canInteract: true }),
    );

    act(() => {
      const accepted = result.current.runWithPending(
        () => Promise.reject(new Error("failed")),
      );
      expect(accepted).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isDisabled).toBe(false);
    });
  });
});

