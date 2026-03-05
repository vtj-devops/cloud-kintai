import { useCallback, useEffect, useRef } from "react";

export const useDayCellFocus = () => {
  const cellRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerCellRef = useCallback(
    (cellId: string, element: HTMLElement | null) => {
      if (element instanceof HTMLElement) {
        cellRefs.current.set(cellId, element);
      } else {
        cellRefs.current.delete(cellId);
      }
    },
    [],
  );

  const focusCell = useCallback((cellId: string) => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
    }

    focusTimerRef.current = setTimeout(() => {
      const cell = cellRefs.current.get(cellId);
      if (cell) {
        cell.click();
        cell.focus();
      }
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, []);

  return { registerCellRef, focusCell };
};
