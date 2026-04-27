/**
 * @file ThemeContext.tsx
 * @description テーマ管理用 Context。CSS Variables を活用した動的なテーマ切り替えをサポート。
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

export type ThemeMode = "light" | "auto";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: ThemeMode;
};

/**
 * テーマプロバイダー。CSS Variables を用いた動的テーマ切り替えをサポート。
 *
 * @param {ReactNode} children - 子要素
 * @param {ThemeMode} [initialMode="light"] - 初期テーマモード
 *
 * @example
 * ```tsx
 * <ThemeContextProvider initialMode="light">
 *   <App />
 * </ThemeContextProvider>
 * ```
 */
export function ThemeContextProvider({
  children,
  initialMode = "light",
}: ThemeProviderProps) {
  const handleSetMode = useCallback((mode: ThemeMode) => {
    // CSS Variables で定義されたカラースキームを適用
    const root = document.documentElement;

    if (mode === "auto") {
      root.removeAttribute("data-color-scheme");
    } else {
      root.setAttribute("data-color-scheme", mode);
    }

    // LocalStorage に保存（ページリロード時に復元）
    try {
      localStorage.setItem("app-theme-mode", mode);
    } catch {
      // LocalStorage が利用不可の場合もエラーにしない
    }
  }, []);

  const value = useMemo(
    () => ({
      mode: initialMode,
      setMode: handleSetMode,
    }),
    [initialMode, handleSetMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * テーマ Context を使用するカスタムフック
 *
 * @throws {Error} ThemeContextProvider の外で使用された場合
 *
 * @example
 * ```tsx
 * const { mode, setMode } = useThemeContext();
 * ```
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within ThemeContextProvider");
  }

  return context;
}
