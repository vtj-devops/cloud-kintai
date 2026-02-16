import { useCallback, useEffect, useRef, useState } from "react";

import { ShiftCellUpdate } from "../types/collaborative.types";

/**
 * 変更履歴エントリ
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  updates: ShiftCellUpdate[];
  description?: string;
  userId?: string;
  userName?: string;
}

/**
 * 取り消し/やり直しフックの設定
 */
export interface UseUndoRedoConfig {
  maxHistorySize?: number; // 履歴の最大件数（デフォルト: 50）
  onUndo?: (entry: HistoryEntry) => Promise<void> | void;
  onRedo?: (entry: HistoryEntry) => Promise<void> | void;
}

/**
 * 取り消し/やり直し機能を提供するフック
 * シフト変更の履歴を管理し、取り消し/やり直し操作を可能にする
 */
export const useUndoRedo = ({
  maxHistorySize = 50,
  onUndo,
  onRedo,
}: UseUndoRedoConfig = {}) => {
  // 取り消しスタック（過去の変更）
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  // やり直しスタック（取り消した変更）
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  // 処理中フラグ
  const [isProcessing, setIsProcessing] = useState(false);

  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);

  // コールバックの最新版を保持
  useEffect(() => {
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
  }, [onUndo, onRedo]);

  /**
   * 新しい変更を履歴に追加
   */
  const pushHistory = useCallback(
    (
      updates: ShiftCellUpdate[],
      description?: string,
      meta?: Pick<HistoryEntry, "userId" | "userName">,
    ) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        updates,
        description,
        ...meta,
      };

      setUndoStack((prev) => {
        const newStack = [...prev, entry];
        // 履歴の上限を超えた場合は古いものから削除
        if (newStack.length > maxHistorySize) {
          return newStack.slice(newStack.length - maxHistorySize);
        }
        return newStack;
      });

      // 新しい変更を追加したらやり直しスタックをクリア
      setRedoStack([]);
    },
    [maxHistorySize],
  );

  /**
   * 取り消し実行
   */
  const undo = useCallback(async () => {
    if (undoStack.length === 0 || isProcessing) {
      return false;
    }

    setIsProcessing(true);

    // スタックから最後のエントリを取り出す
    const entry = undoStack[undoStack.length - 1];

    try {
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, entry]);

      // コールバックを実行
      if (onUndoRef.current) {
        await onUndoRef.current(entry);
      }

      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      // エラー時はスタックを元に戻す
      setUndoStack((prev) => [...prev, entry]);
      setRedoStack((prev) => prev.slice(0, -1));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [undoStack, isProcessing]);

  /**
   * やり直し実行
   */
  const redo = useCallback(async () => {
    if (redoStack.length === 0 || isProcessing) {
      return false;
    }

    setIsProcessing(true);

    // スタックから最後のエントリを取り出す
    const entry = redoStack[redoStack.length - 1];

    try {
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => {
        const newStack = [...prev, entry];
        // 履歴の上限を超えた場合は古いものから削除
        if (newStack.length > maxHistorySize) {
          return newStack.slice(newStack.length - maxHistorySize);
        }
        return newStack;
      });

      // コールバックを実行
      if (onRedoRef.current) {
        await onRedoRef.current(entry);
      }

      return true;
    } catch (error) {
      console.error("Redo failed:", error);
      // エラー時はスタックを元に戻す
      setRedoStack((prev) => [...prev, entry]);
      setUndoStack((prev) => prev.slice(0, -1));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [redoStack, isProcessing, maxHistorySize]);

  /**
   * 履歴をクリア
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * 最後の操作を取得（プレビュー用）
   */
  const getLastUndo = useCallback((): HistoryEntry | null => {
    return undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  }, [undoStack]);

  /**
   * 最後にやり直し可能な操作を取得（プレビュー用）
   */
  const getLastRedo = useCallback((): HistoryEntry | null => {
    return redoStack.length > 0 ? redoStack[redoStack.length - 1] : null;
  }, [redoStack]);

  return {
    // 状態
    canUndo: undoStack.length > 0 && !isProcessing,
    canRedo: redoStack.length > 0 && !isProcessing,
    isProcessing,
    undoStackSize: undoStack.length,
    redoStackSize: redoStack.length,
    undoHistory: undoStack,
    redoHistory: redoStack,

    // アクション
    pushHistory,
    undo,
    redo,
    clearHistory,

    // ユーティリティ
    getLastUndo,
    getLastRedo,
  };
};
