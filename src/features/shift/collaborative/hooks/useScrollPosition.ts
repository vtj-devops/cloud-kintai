import { useCallback, useEffect, useRef } from "react";

interface ScrollPosition {
  horizontal: number;
  vertical: number;
}

interface UseScrollPositionProps {
  key: string; // スクロール位置を保存するキー（例: "shift-collaborative-2024-01"）
  enabled?: boolean;
}

/**
 * スクロール位置を保持・復元するフック
 * SessionStorage を使用してブラウザのセッション中は位置を保持
 */
export const useScrollPosition = ({
  key,
  enabled = true,
}: UseScrollPositionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * スクロール位置を保存
   */
  const saveScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current) return;

    const position: ScrollPosition = {
      horizontal: containerRef.current.scrollLeft,
      vertical: containerRef.current.scrollTop,
    };

    try {
      sessionStorage.setItem(
        `scroll-position-${key}`,
        JSON.stringify(position),
      );
    } catch (error) {
      console.error("Failed to save scroll position:", error);
    }
  }, [key, enabled]);

  /**
   * スクロール位置を復元
   */
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current) return;

    try {
      const saved = sessionStorage.getItem(`scroll-position-${key}`);
      if (saved) {
        const position: ScrollPosition = JSON.parse(saved);

        // requestAnimationFrame を使用してスムーズに復元
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = position.horizontal;
            containerRef.current.scrollTop = position.vertical;
          }
        });
      }
    } catch (error) {
      console.error("Failed to restore scroll position:", error);
    }
  }, [key, enabled]);

  /**
   * スクロール位置をクリア
   */
  const clearScrollPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(`scroll-position-${key}`);
    } catch (error) {
      console.error("Failed to clear scroll position:", error);
    }
  }, [key]);

  /**
   * マウント時に位置を復元
   */
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      restoreScrollPosition();
    }, 100);

    return () => clearTimeout(timer);
  }, [key, enabled, restoreScrollPosition]);

  /**
   * アンマウント時に位置を保存
   */
  useEffect(() => {
    if (!enabled) return;

    return () => {
      saveScrollPosition();
    };
  }, [key, enabled, saveScrollPosition]);

  return {
    containerRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
};
