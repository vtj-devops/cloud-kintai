import { shiftRequestStatusToShiftStateWithEmpty } from "@entities/shift/lib/statusMapping";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { updateShiftRequest } from "@shared/api/graphql/documents/mutations";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CollaborativeShiftContext,
  CollaborativeShiftContextType,
} from "../context/CollaborativeShiftContext";
import { useCellChangeHistory } from "../hooks/useCellChangeHistory";
import { useCollaborativeShiftData } from "../hooks/useCollaborativeShiftData";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useShiftComments } from "../hooks/useShiftComments";
import { useShiftEditLocks } from "../hooks/useShiftEditLocks";
import { useShiftPresence } from "../hooks/useShiftPresence";
import { useShiftSync } from "../hooks/useShiftSync";
import { deriveHistoryCellChanges } from "../lib/shiftTransformers";
import {
  CellComment,
  CollaborativeShiftState,
  Mention,
  ShiftCellUpdate,
  ShiftRequestCommentData,
  ShiftRequestData,
  ShiftState,
} from "../types/collaborative.types";

interface CollaborativeShiftProviderProps {
  children: React.ReactNode;
  staffIds: string[];
  targetMonth: string;
  currentUserId: string;
  currentUserName: string;
  shiftRequestId: string;
  staffNameMap?: Map<string, string>;
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
  staffNameMap,
}) => {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<{
    staffId: string;
    timestamp: number;
  } | null>(null);
  const isOnline = useOnlineStatus();

  // コメント管理フック
  const {
    addComment,
    updateComment,
    deleteComment,
    getCommentsByCell,
    replyToComment,
    deleteCommentReply,
    loadCommentsFromShiftRequests,
    mergeRemoteComments,
    getCommentsInputForStaff,
  } = useShiftComments();

  // fetchShifts への参照ブリッジ（同期フックをデータフックより先に初期化するため）
  const fetchShiftsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // セル単位変更履歴フック
  const {
    recordCellChange,
    recordBatchCellChanges,
    recordRemoteChange,
    seedHistory,
    mergeHistoryRecords,
    getCellHistory,
    getAllCellHistory,
    getStaffCellHistory,
    clearCellHistory,
  } = useCellChangeHistory();

  // shiftDataMap への参照（リモート差分計算用）
  const shiftDataMapRef = useRef<
    Map<string, Map<string, { state: ShiftState; isLocked: boolean }>>
  >(new Map());

  const handleRemoteUpdate = useCallback(
    (staffId: string, request: ShiftRequestData) => {
      setLastRemoteUpdate({ staffId, timestamp: Date.now() });

      // リモート更新のセル単位差分を記録
      const currentStaffData = shiftDataMapRef.current.get(staffId);
      const entries = request.entries ?? [];
      for (const entry of entries) {
        const dayKey = entry.date.slice(-2);
        const previousCell = currentStaffData?.get(dayKey);
        const newState = shiftRequestStatusToShiftStateWithEmpty(entry.status);
        const previousState = previousCell?.state;

        // 変化があった場合のみ記録
        if (previousState !== newState) {
          recordRemoteChange(
            staffId,
            dayKey,
            previousState,
            newState,
            request.updatedBy ?? "unknown",
            request.updatedBy ?? "不明",
          );
        }
      }
    },
    [recordRemoteChange],
  );

  /**
   * 自分の mutation 成功時に最新 histories のみ差分化して historyMap へマージ。
   * 自己更新は Subscription で除外されるため、この経路で確定済み履歴を反映する。
   */
  const handlePersistCompleted = useCallback(
    (request: ShiftRequestData) => {
      if (!request.histories || request.histories.length === 0) return;

      // 最新の2件（直前スナップショット → 今回スナップショット）のみ差分化
      const sorted = [...request.histories].toSorted(
        (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
      );
      const recentHistories = sorted.slice(-2);
      if (recentHistories.length === 0) return;

      const getStaffName = (staffId: string) =>
        staffNameMap?.get(staffId) ?? staffId;

      const newRecords = deriveHistoryCellChanges(
        request.staffId,
        recentHistories,
        getStaffName,
      );

      mergeHistoryRecords(newRecords);
    },
    [staffNameMap, mergeHistoryRecords],
  );

  const handleCommentsReceived = useCallback(
    (staffId: string, comments: ShiftRequestCommentData[]) => {
      mergeRemoteComments(staffId, comments);
    },
    [mergeRemoteComments],
  );

  // 同期コーディネータフック（Subscription ファースト）
  const {
    isSyncing,
    syncError,
    triggerSync,
    lastAutoSyncedAt,
    lastSyncedAt,
    dataStatus,
    notifyAutoSyncReceived,
    notifySaveStarted,
    notifySaveCompleted,
    notifySaveFailed,
    clearSyncError,
  } = useShiftSync({
    onManualSync: async () => {
      await fetchShiftsRef.current();
    },
  });

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
    getShiftRequest,
    getAllShiftRequests,
  } = useCollaborativeShiftData({
    staffIds,
    targetMonth,
    currentUserId,
    onAutoSyncReceived: notifyAutoSyncReceived,
    onSaveStarted: notifySaveStarted,
    onSaveCompleted: notifySaveCompleted,
    onSaveFailed: notifySaveFailed,
    onRemoteUpdate: handleRemoteUpdate,
    onCommentsReceived: handleCommentsReceived,
    onPersistCompleted: handlePersistCompleted,
  });

  // fetchShifts 参照を同期
  useEffect(() => {
    fetchShiftsRef.current = fetchShifts;
  }, [fetchShifts]);

  // shiftDataMapRef をリモート差分計算用に同期
  useEffect(() => {
    shiftDataMapRef.current = shiftDataMap;
  }, [shiftDataMap]);

  // 初期データ読み込み時にコメントをロード
  const commentsInitializedRef = useRef(false);
  useEffect(() => {
    if (isLoading || commentsInitializedRef.current) {
      return;
    }
    const allRequests = getAllShiftRequests();
    if (allRequests.length > 0) {
      loadCommentsFromShiftRequests(allRequests);
      commentsInitializedRef.current = true;
    }
  }, [isLoading, getAllShiftRequests, loadCommentsFromShiftRequests]);

  // 月切替時にリセット → ロード完了後に DB 履歴をシード
  const seededMonthRef = useRef<string | null>(null);
  useEffect(() => {
    if (seededMonthRef.current !== null && seededMonthRef.current !== targetMonth) {
      clearCellHistory();
      seededMonthRef.current = null;
    }

    if (isLoading || seededMonthRef.current === targetMonth) return;
    const allRequests = getAllShiftRequests();
    if (allRequests.length === 0) return;

    const getStaffName = (staffId: string) =>
      staffNameMap?.get(staffId) ?? staffId;

    const allRecords = allRequests.flatMap((request) =>
      deriveHistoryCellChanges(
        request.staffId,
        request.histories ?? [],
        getStaffName,
      ),
    );

    seedHistory(allRecords);
    seededMonthRef.current = targetMonth;
  }, [targetMonth, isLoading, getAllShiftRequests, staffNameMap, seedHistory, clearCellHistory]);

  const persistComments = useCallback(
    async (staffId: string) => {
      const shiftRequest = getShiftRequest(staffId);
      if (!shiftRequest) return;

      const commentsInput = getCommentsInputForStaff(staffId);
      try {
        await graphqlClient.graphql({
          query: updateShiftRequest,
          variables: {
            input: {
              id: shiftRequest.id,
              comments: commentsInput,
              updatedBy: currentUserId,
              updatedAt: new Date().toISOString(),
            },
          },
          authMode: "userPool",
        });
      } catch (err) {
        console.error("Failed to persist comments:", err);
      }
    },
    [getShiftRequest, getCommentsInputForStaff, currentUserId],
  );

  // プレゼンス管理フック
  const {
    activeUsers,
    updateActivity,
  } = useShiftPresence({
    currentUserId,
    currentUserName,
    shiftRequestId,
    targetMonth,
  });

  const {
    editingCells,
    acquireEditLock,
    releaseEditLock,
    isCellBeingEdited,
    hasEditLock,
    getCellEditor,
    forceReleaseLock,
    getAllEditingCells,
    refreshLocks,
  } = useShiftEditLocks({
    currentUserId,
    currentUserName,
    targetMonth,
  });

  /**
   * シフトセルを更新
   */
  const handleUpdateShift = useCallback(
    async (update: ShiftCellUpdate) => {
      updateActivity();

      const currentCellData = shiftDataMapRef.current
        .get(update.staffId)
        ?.get(update.date);
      const enrichedUpdate: ShiftCellUpdate = {
        ...update,
        previousState: update.previousState ?? currentCellData?.state,
        previousLocked: update.previousLocked ?? currentCellData?.isLocked,
      };
      recordCellChange(enrichedUpdate, currentUserId, currentUserName, "manual");

      await updateShift(update);
    },
    [
      updateActivity,
      recordCellChange,
      updateShift,
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

      const enrichedUpdates = updates.map((update) => {
        const currentCellData = shiftDataMapRef.current
          .get(update.staffId)
          ?.get(update.date);
        return {
          ...update,
          previousState: update.previousState ?? currentCellData?.state,
          previousLocked: update.previousLocked ?? currentCellData?.isLocked,
        };
      });
      recordBatchCellChanges(enrichedUpdates, currentUserId, currentUserName, "batch");

      await batchUpdateShifts(updates);
    },
    [
      updateActivity,
      recordBatchCellChanges,
      batchUpdateShifts,
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
    async (staffId: string, date: string) => {
      updateActivity();
      return acquireEditLock(staffId, date);
    },
    [updateActivity, acquireEditLock],
  );

  /**
   * セルの編集終了（更新なし）
   */
  const handleStopEditingCell = useCallback(
    async (staffId: string, date: string) => {
      await releaseEditLock(staffId, date);
    },
    [releaseEditLock],
  );

  const handleForceReleaseCell = useCallback(
    async (staffId: string, date: string) => {
      await forceReleaseLock(staffId, date);
    },
    [forceReleaseLock],
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
      const comment = addComment(
        cellKey,
        currentUserId,
        currentUserName,
        activeUsers.find((u) => u.userId === currentUserId)?.color || "#1976d2",
        content,
        mentions,
      );

      // cellKey は "staffId#date" 形式
      const staffId = cellKey.split("#")[0];
      await persistComments(staffId);

      return comment;
    },
    [addComment, currentUserId, currentUserName, activeUsers, persistComments],
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

      const staffId = updated.cellKey.split("#")[0];
      await persistComments(staffId);

      return updated;
    },
    [updateComment, persistComments],
  );

  /**
   * コメント削除
   */
  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      const { cellKey } = deleteComment(commentId);
      if (cellKey) {
        const staffId = cellKey.split("#")[0];
        await persistComments(staffId);
      }
    },
    [deleteComment, persistComments],
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

      const staffId = reply.cellKey.split("#")[0];
      await persistComments(staffId);

      return reply;
    },
    [
      replyToComment,
      currentUserId,
      currentUserName,
      activeUsers,
      persistComments,
    ],
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
      lastAutoSyncedAt,
      dataStatus,
      error: error || syncError || null,
      connectionState,
      isOnline,
      lastRemoteUpdate,
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
      lastAutoSyncedAt,
      dataStatus,
      error,
      syncError,
      connectionState,
      isOnline,
      lastRemoteUpdate,
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
      hasEditLock,
      getCellEditor,
      forceReleaseCell: handleForceReleaseCell,
      getAllEditingCells,
      triggerSync: handleTriggerSync,
      clearSyncError,
      updateUserActivity: handleUpdateUserActivity,
      retryPendingChanges,
      refreshLocks,
      // セル単位変更履歴
      getCellHistory,
      getAllCellHistory,
      getStaffCellHistory,
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
      hasEditLock,
      getCellEditor,
      handleForceReleaseCell,
      getAllEditingCells,
      handleTriggerSync,
      clearSyncError,
      handleUpdateUserActivity,
      retryPendingChanges,
      refreshLocks,
      getCellHistory,
      getAllCellHistory,
      getStaffCellHistory,
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
