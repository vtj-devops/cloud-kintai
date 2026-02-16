import { useCallback, useEffect, useRef } from "react";

import { ShiftCellUpdate } from "../types/collaborative.types";
import { useOfflineStorage } from "./useOfflineStorage";
import { useOnlineStatus } from "./useOnlineStatus";

/**
 * オフライン時の変更内容のマージ戦略
 */
export type MergeStrategy = "local" | "remote" | "manual";

/**
 * コンフリクト情報
 */
export interface ConflictInfo {
  changeId: string;
  localUpdate: ShiftCellUpdate;
  remoteUpdate?: ShiftCellUpdate;
  strategy: MergeStrategy;
}

/**
 * 再接続時の自動同期フック
 */
export interface UseOfflineSyncProps {
  enabled: boolean;
  onSyncPendingChanges: (
    changes: ShiftCellUpdate[],
  ) => Promise<{ successful: string[]; conflicts: ConflictInfo[] }>;
  onConflict?: (conflicts: ConflictInfo[]) => void;
  maxRetries?: number;
  retryDelay?: number; // ミリ秒
}

export const useOfflineSync = ({
  enabled,
  onSyncPendingChanges,
  onConflict,
  maxRetries = 3,
  retryDelay = 5000,
}: UseOfflineSyncProps) => {
  const isOnline = useOnlineStatus();
  const {
    pendingChanges,
    removePendingChange,
    updateRetryCount,
    clearPendingChanges,
  } = useOfflineStorage();

  const isSyncingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const onSyncPendingChangesRef = useRef(onSyncPendingChanges);

  // onSyncPendingChangesの最新版を保持
  useEffect(() => {
    onSyncPendingChangesRef.current = onSyncPendingChanges;
  }, [onSyncPendingChanges]);

  /**
   * ペンディング変更を同期
   */
  const syncPendingChanges = useCallback(async () => {
    if (!enabled || isSyncingRef.current || !isOnline) {
      return { successful: [], conflicts: [] };
    }

    isSyncingRef.current = true;

    try {
      if (pendingChanges.length === 0) {
        return { successful: [], conflicts: [] };
      }

      const updates = pendingChanges.map((change) => change.update);
      const result = await onSyncPendingChangesRef.current(updates);

      // 成功した変更を削除
      result.successful.forEach((changeId) => {
        removePendingChange(changeId);
      });

      // コンフリクトが発生した場合はコールバックを呼び出す
      if (result.conflicts.length > 0 && onConflict) {
        onConflict(result.conflicts);
      }

      return result;
    } catch (error) {
      console.error("Failed to sync pending changes:", error);

      // リトライ回数を更新
      pendingChanges.forEach((change) => {
        const newRetryCount = change.retryCount + 1;
        updateRetryCount(
          change.id,
          newRetryCount,
          error instanceof Error ? error.message : "Unknown error",
        );

        // 最大リトライ回数に達したら警告
        if (newRetryCount > maxRetries) {
          console.warn(
            `Max retries exceeded for change ${change.id}. Manual intervention may be required.`,
          );
        }
      });

      return { successful: [], conflicts: [] };
    } finally {
      isSyncingRef.current = false;
    }
  }, [
    enabled,
    isOnline,
    pendingChanges,
    removePendingChange,
    updateRetryCount,
    onConflict,
    maxRetries,
  ]);

  /**
   * リトライスケジュール
   */
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (pendingChanges.length > 0 && isOnline) {
      retryTimeoutRef.current = setTimeout(() => {
        syncPendingChanges();
      }, retryDelay);
    }
  }, [isOnline, pendingChanges, retryDelay, syncPendingChanges]);

  /**
   * オンライン復帰時の同期処理
   */
  useEffect(() => {
    if (isOnline && enabled && pendingChanges.length > 0) {
      syncPendingChanges();
    }
  }, [isOnline, enabled, pendingChanges, syncPendingChanges]);

  /**
   * リトライスケジュール
   */
  useEffect(() => {
    if (!isOnline && pendingChanges.length > 0) {
      scheduleRetry();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isOnline, pendingChanges, scheduleRetry]);

  /**
   * コンフリクトを手動で解決
   */
  const resolveConflict = useCallback(
    async (changeId: string, strategy: MergeStrategy) => {
      const change = pendingChanges.find((c) => c.id === changeId);
      if (!change) return;

      try {
        if (strategy === "local") {
          // ローカルバージョンで上書き
          await onSyncPendingChangesRef.current([change.update]);
          removePendingChange(changeId);
        } else if (strategy === "remote") {
          // リモートバージョンを採用（ローカル変更を削除）
          removePendingChange(changeId);
        }
        // strategy === "manual" の場合は処理なし（ユーザーが決定を延期）
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
        updateRetryCount(
          changeId,
          change.retryCount + 1,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
    [pendingChanges, removePendingChange, updateRetryCount],
  );

  return {
    isOnline,
    hasPendingChanges: pendingChanges.length > 0,
    pendingChangesCount: pendingChanges.length,
    pendingChanges,
    syncPendingChanges,
    resolveConflict,
    clearPendingChanges,
  };
};
