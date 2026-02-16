import { useCallback, useEffect } from "react";

import { ShiftCellUpdate } from "../types/collaborative.types";
import { useOfflineStorage } from "./useOfflineStorage";
import { ConflictInfo, useOfflineSync } from "./useOfflineSync";
import { useOnlineStatus } from "./useOnlineStatus";

/**
 * シフト共同編集でのオフライン対応を統合するフック
 * useCollaborativeShiftDataと連携
 */
export interface UseCollaborativeShiftOfflineProps {
  enabled: boolean;
  onUpdateShift: (update: ShiftCellUpdate) => Promise<void>;
  onBatchUpdateShifts: (updates: ShiftCellUpdate[]) => Promise<void>;
  onConflictDetected?: (conflicts: ConflictInfo[]) => void;
  maxRetries?: number;
}

export const useCollaborativeShiftOffline = ({
  enabled,
  onUpdateShift,
  onBatchUpdateShifts,
  onConflictDetected,
  maxRetries = 3,
}: UseCollaborativeShiftOfflineProps) => {
  const isOnline = useOnlineStatus();
  const { addPendingChange } = useOfflineStorage();

  const { hasPendingChanges, syncPendingChanges } = useOfflineSync({
    enabled,
    onSyncPendingChanges: async (updates) => {
      try {
        if (updates.length === 0) {
          return { successful: [], conflicts: [] };
        }

        // 一括更新を試行
        await onBatchUpdateShifts(updates);

        // すべて成功
        return {
          successful: updates.map(
            (u) => `${u.staffId}-${u.date}-${Date.now()}`,
          ),
          conflicts: [],
        };
      } catch (error) {
        console.error("Failed to sync pending changes:", error);
        return { successful: [], conflicts: [] };
      }
    },
    onConflict: onConflictDetected,
    maxRetries,
  });

  /**
   * オフライン時のシフト更新（ローカルストレージに保存）
   */
  const handleOfflineUpdate = useCallback(
    (update: ShiftCellUpdate) => {
      const pendingChange = addPendingChange(update);
      return pendingChange;
    },
    [addPendingChange],
  );

  /**
   * シフト更新（オンライン/オフライン対応）
   */
  const updateShiftWithOfflineSupport = useCallback(
    async (update: ShiftCellUpdate) => {
      if (!enabled) {
        // オフライン対応が無効な場合は直接更新
        await onUpdateShift(update);
        return;
      }

      if (isOnline) {
        // オンライン時は直接更新
        try {
          await onUpdateShift(update);
        } catch (error) {
          // エラー時はローカルストレージに保存
          console.warn("Update failed, saving locally:", error);
          handleOfflineUpdate(update);
        }
      } else {
        // オフライン時はローカルストレージに保存
        handleOfflineUpdate(update);
      }
    },
    [enabled, isOnline, onUpdateShift, handleOfflineUpdate],
  );

  /**
   * バッチ更新（オンライン/オフライン対応）
   */
  const batchUpdateShiftsWithOfflineSupport = useCallback(
    async (updates: ShiftCellUpdate[]) => {
      if (!enabled) {
        // オフライン対応が無効な場合は直接更新
        await onBatchUpdateShifts(updates);
        return;
      }

      if (isOnline) {
        // オンライン時は直接更新
        try {
          await onBatchUpdateShifts(updates);
        } catch (error) {
          // エラー時はローカルストレージに保存
          console.warn("Batch update failed, saving locally:", error);
          updates.forEach((update) => {
            handleOfflineUpdate(update);
          });
        }
      } else {
        // オフライン時はローカルストレージに保存
        updates.forEach((update) => {
          handleOfflineUpdate(update);
        });
      }
    },
    [enabled, isOnline, onBatchUpdateShifts, handleOfflineUpdate],
  );

  /**
   * オンライン復帰時に自動同期
   */
  useEffect(() => {
    if (enabled && isOnline && hasPendingChanges) {
      syncPendingChanges();
    }
  }, [enabled, isOnline, hasPendingChanges, syncPendingChanges]);

  return {
    isOnline,
    hasPendingChanges,
    updateShiftWithOfflineSupport,
    batchUpdateShiftsWithOfflineSupport,
    syncPendingChanges,
  };
};
