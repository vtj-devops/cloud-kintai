import { useEffect } from "react";

/**
 * Triggers `fn` after `delay` ms whenever dependencies change.
 * Useful for debounced auto-save patterns.
 */
export function useAutoSave(
  fn: () => void | Promise<void>,
  delay: number,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      void fn();
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, enabled, fn]);
}
