import { useCallback, useEffect, useState } from "react";

import { ShiftCellUpdate } from "../types/collaborative.types";

const PENDING_CHANGES_STORAGE_KEY = "shift_pending_changes";
const OFFLINE_CACHE_KEY = "shift_offline_cache";

/**
 * ローカルストレージへのオフラインデータ管理
 */
export interface PendingChange {
  id: string;
  update: ShiftCellUpdate;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export const useOfflineStorage = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [offlineCache, setOfflineCache] = useState<Record<string, unknown>>({});

  /**
   * ストレージから未送信変更を読み込む
   */
  const loadPendingChanges = useCallback(() => {
    try {
      const stored = localStorage.getItem(PENDING_CHANGES_STORAGE_KEY);
      if (stored) {
        const changes = JSON.parse(stored) as PendingChange[];
        setPendingChanges(changes);
        return changes;
      }
    } catch (error) {
      console.error("Failed to load pending changes:", error);
    }
    return [];
  }, []);

  /**
   * 未送信変更をストレージに保存
   */
  const savePendingChanges = useCallback((changes: PendingChange[]) => {
    try {
      localStorage.setItem(
        PENDING_CHANGES_STORAGE_KEY,
        JSON.stringify(changes),
      );
      setPendingChanges(changes);
    } catch (error) {
      console.error("Failed to save pending changes:", error);
    }
  }, []);

  /**
   * 新しい未送信変更を追加
   */
  const addPendingChange = useCallback(
    (update: ShiftCellUpdate) => {
      const newChange: PendingChange = {
        id: `${update.staffId}-${update.date}-${Date.now()}`,
        update,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const updated = [...pendingChanges, newChange];
      savePendingChanges(updated);
      return newChange;
    },
    [pendingChanges, savePendingChanges],
  );

  /**
   * 未送信変更を削除
   */
  const removePendingChange = useCallback(
    (changeId: string) => {
      const updated = pendingChanges.filter((change) => change.id !== changeId);
      savePendingChanges(updated);
    },
    [pendingChanges, savePendingChanges],
  );

  /**
   * リトライカウントを更新
   */
  const updateRetryCount = useCallback(
    (changeId: string, retryCount: number, lastError?: string) => {
      const updated = pendingChanges.map((change) =>
        change.id === changeId ? { ...change, retryCount, lastError } : change,
      );
      savePendingChanges(updated);
    },
    [pendingChanges, savePendingChanges],
  );

  /**
   * オフラインキャッシュを保存
   */
  const saveOfflineCache = useCallback((data: Record<string, unknown>) => {
    try {
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(data));
      setOfflineCache(data);
    } catch (error) {
      console.error("Failed to save offline cache:", error);
    }
  }, []);

  /**
   * オフラインキャッシュを読み込む
   */
  const loadOfflineCache = useCallback(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (stored) {
        const cache = JSON.parse(stored) as Record<string, unknown>;
        setOfflineCache(cache);
        return cache;
      }
    } catch (error) {
      console.error("Failed to load offline cache:", error);
    }
    return {};
  }, []);

  /**
   * すべてのペンディング変更をクリア
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    localStorage.removeItem(PENDING_CHANGES_STORAGE_KEY);
  }, []);

  /**
   * オフラインキャッシュをクリア
   */
  const clearOfflineCache = useCallback(() => {
    setOfflineCache({});
    localStorage.removeItem(OFFLINE_CACHE_KEY);
  }, []);

  // 初期化時にストレージから読み込む
  useEffect(() => {
    try {
      const storedChanges = localStorage.getItem(PENDING_CHANGES_STORAGE_KEY);
      if (storedChanges) {
        const changes = JSON.parse(storedChanges) as PendingChange[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPendingChanges(changes);
      }

      const storedCache = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (storedCache) {
        const cache = JSON.parse(storedCache) as Record<string, unknown>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOfflineCache(cache);
      }
    } catch (error) {
      console.error("Failed to load offline data on mount:", error);
    }
  }, []);

  return {
    // ペンディング変更
    pendingChanges,
    loadPendingChanges,
    savePendingChanges,
    addPendingChange,
    removePendingChange,
    updateRetryCount,
    clearPendingChanges,

    // オフラインキャッシュ
    offlineCache,
    loadOfflineCache,
    saveOfflineCache,
    clearOfflineCache,
  };
};
