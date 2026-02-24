import React, { useCallback, useMemo, useState } from "react";

import {
  CollaborativeShiftContext,
  CollaborativeShiftContextType,
} from "../context/CollaborativeShiftContext";
import { useCollaborativeShiftData } from "../hooks/useCollaborativeShiftData";
import { useCollaborativeShiftOffline } from "../hooks/useCollaborativeShiftOffline";
import { useShiftComments } from "../hooks/useShiftComments";
import { useShiftPresence } from "../hooks/useShiftPresence";
import { useShiftSync } from "../hooks/useShiftSync";
import { useUndoRedo } from "../hooks/useUndoRedo";
import {
  CellComment,
  CollaborativeShiftState,
  Mention,
  ShiftCellUpdate,
} from "../types/collaborative.types";

interface CollaborativeShiftProviderProps {
  children: React.ReactNode;
  staffIds: string[];
  targetMonth: string;
  currentUserId: string;
  currentUserName: string;
  shiftRequestId: string;
}

export const CollaborativeShiftProvider: React.FC<
  CollaborativeShiftProviderProps
> = ({
  children,
  staffIds,
  targetMonth,
  currentUserId,
  currentUserName,
  shiftRequestId,
}) => {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  // コメント管理フック
  const {
    addComment,
    updateComment,
    deleteComment,
    getCommentsByCell,
    replyToComment,
    deleteCommentReply,
  } = useShiftComments();

  // データ管理フック
  const {
    shiftDataMap,
    pendingChanges,
    isLoading,
    isBatchUpdating,
    error,
    connectionState,
    fetchShifts,
    updateShift,
    batchUpdateShifts,
    retryPendingChanges,
  } = useCollaborativeShiftData({
    staffIds,
    targetMonth,
    currentUserId,
  });

  // オフライン対応フック
  const {
    isOnline,
    hasPendingChanges,
    updateShiftWithOfflineSupport,
    batchUpdateShiftsWithOfflineSupport,
    syncPendingChanges,
  } = useCollaborativeShiftOffline({
    enabled: true,
    onUpdateShift: updateShift,
    onBatchUpdateShifts: batchUpdateShifts,
    onConflictDetected: () => {
      // TODO: コンフリクト解決ダイアログを表示
      console.warn("Conflicts detected, need to implement resolution UI");
    },
  });

  // 取り消し/やり直しフック
  const {
    canUndo,
    canRedo,
    undo: undoAction,
    redo: redoAction,
    pushHistory,
    getLastUndo,
    getLastRedo,
    undoHistory,
    redoHistory,
  } = useUndoRedo({
    maxHistorySize: 50,
    onUndo: async (entry) => {
      // 取り消し時は逆の操作を適用
      const undoUpdates = entry.updates.map((update) => {
        const previousShift = shiftDataMap
          .get(update.staffId)
          ?.get(update.date);
        return {
          ...update,
          newState: previousShift?.state,
          isLocked: previousShift?.isLocked,
        };
      });

      await batchUpdateShiftsWithOfflineSupport(undoUpdates);
    },
    onRedo: async (entry) => {
      // やり直し時は元の操作を再適用
      await batchUpdateShiftsWithOfflineSupport(entry.updates);
    },
  });

  // プレゼンス管理フック
  const {
    activeUsers,
    editingCells,
    startEditingCell,
    stopEditingCell,
    isCellBeingEdited,
    getCellEditor,
    updateActivity,
    forceReleaseCell,
    getAllEditingCells,
  } = useShiftPresence({
    currentUserId,
    currentUserName,
    _shiftRequestId: shiftRequestId,
    _targetMonth: targetMonth,
  });

  // 同期フック
  const { isSyncing, lastSyncedAt, syncError, triggerSync, pause, resume } =
    useShiftSync({
      enabled: false, // Phase 1.1では自動同期は不要（ユーザーアクションで都度更新）
      interval: 5000,
      onSync: async () => {
        await fetchShifts();
      },
    });

  /**
   * シフトセルを更新
   */
  const handleUpdateShift = useCallback(
    async (update: ShiftCellUpdate) => {
      // アクティビティを記録
      updateActivity();

      // 編集中の通知を停止
      stopEditingCell(update.staffId, update.date);

      // 履歴に追加
      pushHistory(
        [update],
        `${update.staffId} の ${update.date} のシフトを更新`,
        { userId: currentUserId, userName: currentUserName },
      );

      // オフライン対応の更新を実行
      await updateShiftWithOfflineSupport(update);
    },
    [
      updateActivity,
      stopEditingCell,
      pushHistory,
      updateShiftWithOfflineSupport,
      currentUserId,
      currentUserName,
    ],
  );

  /**
   * バッチ更新
   */
  const handleBatchUpdateShifts = useCallback(
    async (updates: ShiftCellUpdate[]) => {
      updateActivity();

      // すべての編集中通知を停止
      updates.forEach((update) => {
        stopEditingCell(update.staffId, update.date);
      });

      // 履歴に追加
      pushHistory(updates, `${updates.length} 件のシフトを一括更新`, {
        userId: currentUserId,
        userName: currentUserName,
      });

      // オフライン対応のバッチ更新を実行
      await batchUpdateShiftsWithOfflineSupport(updates);
    },
    [
      updateActivity,
      stopEditingCell,
      pushHistory,
      batchUpdateShiftsWithOfflineSupport,
      currentUserId,
      currentUserName,
    ],
  );

  /**
   * セルの選択状態をトグル
   */
  const handleToggleCellSelection = useCallback(
    (cellKey: string, selected: boolean) => {
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(cellKey);
        } else {
          next.delete(cellKey);
        }
        return next;
      });
    },
    [],
  );

  /**
   * セルの編集開始
   */
  const handleStartEditingCell = useCallback(
    (staffId: string, date: string) => {
      updateActivity();
      startEditingCell(staffId, date);
    },
    [updateActivity, startEditingCell],
  );

  /**
   * セルの編集終了（更新なし）
   */
  const handleStopEditingCell = useCallback(
    (staffId: string, date: string) => {
      stopEditingCell(staffId, date);
    },
    [stopEditingCell],
  );

  /**
   * ユーザーアクティビティの記録
   */
  const handleUpdateUserActivity = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  /**
   * 手動同期
   */
  const handleTriggerSync = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  /**
   * コメント追加
   */
  const handleAddComment = useCallback(
    async (
      cellKey: string,
      content: string,
      mentions: Mention[],
    ): Promise<CellComment> => {
      return addComment(
        cellKey,
        currentUserId,
        currentUserName,
        activeUsers.find((u) => u.userId === currentUserId)?.color || "#1976d2",
        content,
        mentions,
      );
    },
    [addComment, currentUserId, currentUserName, activeUsers],
  );

  /**
   * コメント更新
   */
  const handleUpdateComment = useCallback(
    async (
      commentId: string,
      content: string,
      mentions: Mention[],
    ): Promise<CellComment> => {
      const updated = updateComment(commentId, content, mentions);
      if (!updated) {
        throw new Error(`Comment ${commentId} not found`);
      }
      return updated;
    },
    [updateComment],
  );

  /**
   * コメント削除
   */
  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      deleteComment(commentId);
    },
    [deleteComment],
  );

  /**
   * セルのコメント取得
   */
  const handleGetCommentsByCell = useCallback(
    (cellKey: string): CellComment[] => {
      return getCommentsByCell(cellKey);
    },
    [getCommentsByCell],
  );

  /**
   * コメントに返信
   */
  const handleReplyToComment = useCallback(
    async (
      parentCommentId: string,
      content: string,
      mentions: Mention[],
    ): Promise<CellComment> => {
      const reply = replyToComment(
        parentCommentId,
        currentUserId,
        currentUserName,
        activeUsers.find((u) => u.userId === currentUserId)?.color || "#1976d2",
        content,
        mentions,
      );
      if (!reply) {
        throw new Error(`Parent comment ${parentCommentId} not found`);
      }
      return reply;
    },
    [replyToComment, currentUserId, currentUserName, activeUsers],
  );

  /**
   * 返信削除
   */
  const handleDeleteCommentReply = useCallback(
    async (parentCommentId: string, replyCommentId: string): Promise<void> => {
      deleteCommentReply(parentCommentId, replyCommentId);
    },
    [deleteCommentReply],
  );

  /**
   * 状態をまとめる
   */
  const state: CollaborativeShiftState = useMemo(
    () => ({
      shiftDataMap,
      activeUsers,
      editingCells,
      pendingChanges,
      selectedCells,
      isLoading,
      isSyncing,
      lastSyncedAt,
      error: error || syncError || null,
      connectionState,
      isOnline,
      hasPendingChanges,
    }),
    [
      shiftDataMap,
      activeUsers,
      editingCells,
      pendingChanges,
      selectedCells,
      isLoading,
      isSyncing,
      lastSyncedAt,
      error,
      syncError,
      connectionState,
      isOnline,
      hasPendingChanges,
    ],
  );

  const contextValue: CollaborativeShiftContextType = useMemo(
    () => ({
      state,
      updateShift: handleUpdateShift,
      batchUpdateShifts: handleBatchUpdateShifts,
      isBatchUpdating,
      toggleCellSelection: handleToggleCellSelection,
      startEditingCell: handleStartEditingCell,
      stopEditingCell: handleStopEditingCell,
      isCellBeingEdited,
      getCellEditor,
      forceReleaseCell,
      getAllEditingCells,
      triggerSync: handleTriggerSync,
      pauseSync: pause,
      resumeSync: resume,
      updateUserActivity: handleUpdateUserActivity,
      retryPendingChanges,
      syncPendingChanges,
      // Undo/Redo
      canUndo,
      canRedo,
      undo: undoAction,
      redo: redoAction,
      getLastUndo,
      getLastRedo,
      undoHistory,
      redoHistory,
      showHistory,
      toggleHistory: () => setShowHistory((prev) => !prev),
      // Comments
      addComment: handleAddComment,
      updateComment: handleUpdateComment,
      deleteComment: handleDeleteComment,
      getCommentsByCell: handleGetCommentsByCell,
      replyToComment: handleReplyToComment,
      deleteCommentReply: handleDeleteCommentReply,
    }),
    [
      state,
      handleUpdateShift,
      handleBatchUpdateShifts,
      isBatchUpdating,
      handleToggleCellSelection,
      handleStartEditingCell,
      handleStopEditingCell,
      isCellBeingEdited,
      getCellEditor,
      forceReleaseCell,
      getAllEditingCells,
      handleTriggerSync,
      pause,
      resume,
      handleUpdateUserActivity,
      retryPendingChanges,
      syncPendingChanges,
      canUndo,
      canRedo,
      undoAction,
      redoAction,
      getLastUndo,
      getLastRedo,
      undoHistory,
      redoHistory,
      showHistory,
      handleAddComment,
      handleUpdateComment,
      handleDeleteComment,
      handleGetCommentsByCell,
      handleReplyToComment,
      handleDeleteCommentReply,
    ],
  );

  return (
    <CollaborativeShiftContext.Provider value={contextValue}>
      {children}
    </CollaborativeShiftContext.Provider>
  );
};
