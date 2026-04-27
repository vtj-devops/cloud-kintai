/**
 * @file useThemeMode.ts
 * @description テーマモードを管理するカスタムフック
 */

import { useThemeContext } from "@app/providers/theme/ThemeContext";
import { useEffect, useState } from "react";

/**
 * テーマモード（light/auto）を管理するフック
 *
 * @returns {Object} テーマモード管理オブジェクト
 * @example
 * ```tsx
 * const { mode, setMode } = useThemeMode();
 * ```
 */
export function useThemeMode() {
  const { mode, setMode } = useThemeContext();
  const [isHydrated, setIsHydrated] = useState(false);

  // LocalStorage からの復元（SSR 対応）
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("app-theme-mode") as
        | "light"
        | "auto"
        | null;
      if (savedMode && savedMode !== mode) {
        setMode(savedMode);
      }
    } catch {
      // LocalStorage が利用不可の場合
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, [mode, setMode]);

  return { mode, setMode, isHydrated };
}
