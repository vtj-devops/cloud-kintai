import { useCallback, useEffect, useRef } from "react";

import { ShiftState } from "../types/collaborative.types";

interface KeyboardShortcutsConfig {
  enabled: boolean;
  onNavigate: (direction: "up" | "down" | "left" | "right") => void;
  onChangeState: (state: ShiftState) => void;
  onSelectAll: () => void;
  onShowHelp: () => void;
  onEscape: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * キーボードショートカット用フック
 */
export const useKeyboardShortcuts = ({
  enabled,
  onNavigate,
  onChangeState,
  onSelectAll,
  onShowHelp,
  onEscape,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
}: KeyboardShortcutsConfig) => {
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // 入力フィールド内では無効化
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifier = ctrlKey || metaKey;

      // 矢印キー: セル間移動
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        event.preventDefault();
        const direction = key.replace("Arrow", "").toLowerCase() as
          | "up"
          | "down"
          | "left"
          | "right";
        onNavigate(direction);
        return;
      }

      // 数字キー: 状態変更
      if (!isModifier && !shiftKey && /^[1-5]$/.test(key)) {
        event.preventDefault();
        const stateMap: Record<string, ShiftState> = {
          "1": "work",
          "2": "requestedOff",
          "3": "fixedOff",
          "4": "auto",
          "5": "empty",
        };
        onChangeState(stateMap[key]);
        return;
      }

      // Ctrl/Cmd + A: 全選択
      if (isModifier && key === "a") {
        event.preventDefault();
        onSelectAll();
        return;
      }

      // Ctrl/Cmd + C: コピー
      if (isModifier && key === "c" && onCopy) {
        event.preventDefault();
        onCopy();
        return;
      }

      // Ctrl/Cmd + V: ペースト
      if (isModifier && key === "v" && onPaste) {
        event.preventDefault();
        onPaste();
        return;
      }

      // Ctrl/Cmd + Z: 取り消し
      if (isModifier && !shiftKey && key === "z" && onUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Ctrl/Cmd + Shift + Z: やり直し
      if (isModifier && shiftKey && key === "z" && onRedo) {
        event.preventDefault();
        onRedo();
        return;
      }

      // ?: ヘルプ表示
      if (key === "?" || (shiftKey && key === "/")) {
        event.preventDefault();
        onShowHelp();
        return;
      }

      // Escape: 選択解除・モーダルクローズ
      if (key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }
    },
    [
      onNavigate,
      onChangeState,
      onSelectAll,
      onShowHelp,
      onEscape,
      onCopy,
      onPaste,
      onUndo,
      onRedo,
    ],
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: [
      { key: "↑↓←→", description: "セル間の移動" },
      { key: "1", description: "出勤に変更" },
      { key: "2", description: "希望休に変更" },
      { key: "3", description: "固定休に変更" },
      { key: "4", description: "自動調整に変更" },
      { key: "5", description: "未入力に変更" },
      { key: "Ctrl/Cmd + A", description: "全セル選択" },
      { key: "Ctrl/Cmd + C", description: "選択セルをコピー" },
      { key: "Ctrl/Cmd + V", description: "コピーした内容を貼り付け" },
      { key: "Ctrl/Cmd + Z", description: "操作を取り消す" },
      { key: "Ctrl/Cmd + Shift + Z", description: "操作をやり直す" },
      { key: "?", description: "ヘルプを表示" },
      { key: "Esc", description: "選択解除・モーダルを閉じる" },
    ],
  };
};
