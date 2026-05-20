import {
  useBatchUpdateShiftCellsMutation,
  useCreateShiftRequestMutation,
  useGetShiftRequestsQuery,
  useUpdateShiftCellMutation,
} from "@entities/shift/api/shiftApi";
import { shiftStateWithEmptyToShiftRequestStatus } from "@entities/shift/lib/statusMapping";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  onCreateShiftRequest,
  onUpdateShiftRequest,
} from "@shared/api/graphql/documents/subscriptions";
import type { GraphQLBaseQueryError } from "@shared/api/graphql/graphqlBaseQuery";
import type {
  ShiftRequestDayPreferenceInput,
  ShiftRequestHistoryInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  applyShiftCellUpdateToMap,
  applyShiftRequestToShiftDataMap,
  normalizeShiftRequest,
  transformShiftCellUpdateToGraphQLInput,
  transformShiftRequestToShiftDataMap,
} from "../lib/shiftTransformers";
import {
  PendingChangesMap,
  ShiftCellData,
  ShiftCellUpdate,
  ShiftDataMap,
  ShiftRequestCommentData,
  ShiftRequestData,
} from "../types/collaborative.types";

/**
 * 共同編集シフトデータの取得・更新フック
 */
interface UseCollaborativeShiftDataProps {
  staffIds: string[];
  targetMonth?: string; // "YYYY-MM"
  currentUserId: string;
  onAutoSyncReceived?: () => void;
  onSaveStarted?: () => void;
  onSaveCompleted?: () => void;
  onSaveFailed?: (error: string) => void;
  onRemoteUpdate?: (staffId: string, request: ShiftRequestData) => void;
  onCommentsReceived?: (
    staffId: string,
    comments: ShiftRequestCommentData[],
  ) => void;
  onPersistCompleted?: (request: ShiftRequestData) => void;
}

export const useCollaborativeShiftData = ({
  staffIds,
  targetMonth,
  currentUserId,
  onAutoSyncReceived,
  onSaveStarted,
  onSaveCompleted,
  onSaveFailed,
  onRemoteUpdate,
  onCommentsReceived,
  onPersistCompleted,
}: UseCollaborativeShiftDataProps) => {
  const [shiftDataMap, setShiftDataMap] = useState<ShiftDataMap>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<
    "connected" | "disconnected" | "error"
  >("connected");
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const onAutoSyncReceivedRef = useRef(onAutoSyncReceived);
  const onSaveStartedRef = useRef(onSaveStarted);
  const onSaveCompletedRef = useRef(onSaveCompleted);
  const onSaveFailedRef = useRef(onSaveFailed);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const onCommentsReceivedRef = useRef(onCommentsReceived);
  const onPersistCompletedRef = useRef(onPersistCompleted);

  useEffect(() => {
    onAutoSyncReceivedRef.current = onAutoSyncReceived;
    onSaveStartedRef.current = onSaveStarted;
    onSaveCompletedRef.current = onSaveCompleted;
    onSaveFailedRef.current = onSaveFailed;
    onRemoteUpdateRef.current = onRemoteUpdate;
    onCommentsReceivedRef.current = onCommentsReceived;
    onPersistCompletedRef.current = onPersistCompleted;
  }, [
    onAutoSyncReceived,
    onSaveStarted,
    onSaveCompleted,
    onSaveFailed,
    onRemoteUpdate,
    onCommentsReceived,
    onPersistCompleted,
  ]);

  const [updateShiftCell] = useUpdateShiftCellMutation();
  const [createShiftRequest] = useCreateShiftRequestMutation();
  const [batchUpdateShiftCells] = useBatchUpdateShiftCellsMutation();

  // 保留中の変更を追跡
  const pendingChangesRef = useRef<PendingChangesMap>(new Map());

  const shiftRequestsRef = useRef<Map<string, ShiftRequestData>>(new Map());

  // staffIds参照を安定化（毎回新しい配列参照による不要なrefetchを防ぐ）
  const staffIdsKey = useMemo(() => staffIds.toSorted().join(","), [staffIds]);

  const shouldSkipFetch = staffIds.length === 0 || !targetMonth;
  const {
    data: shiftRequests = [],
    isLoading: isLoadingQuery,
    error: fetchError,
    refetch,
  } = useGetShiftRequestsQuery(
    {
      staffIds,
      targetMonth: targetMonth ?? "",
    },
    {
      skip: shouldSkipFetch,
      // ウィンドウフォーカス時の自動refetchを無効化
      refetchOnFocus: false,
      // ネットワーク接続復帰時の自動refetchを無効化
      refetchOnReconnect: false,
      // 再フェッチ中もキャッシュを表示し続ける（ユーザーが表の再描画を感じないようにする）
      selectFromResult: (result) => ({
        ...result,
        // 初期ロード中のみisLoadingをtrue、再フェッチ時はfalseに
        isLoading: result.isLoading && !result.data,
      }),
    },
  );

  const isLoading = isLoadingQuery;

  const normalizedShiftRequests = useMemo(
    () => shiftRequests.map(normalizeShiftRequest),
    [shiftRequests],
  );

  const buildShiftErrorMessage = useCallback((err: unknown) => {
    const fallback = "シフトデータの処理に失敗しました";

    if (!err || typeof err !== "object") {
      return { message: fallback, connection: "error" as const };
    }

    const baseMessage =
      "message" in err && typeof err.message === "string"
        ? err.message
        : fallback;

    const details =
      "details" in err && err.details
        ? (err.details as GraphQLBaseQueryError["details"])
        : undefined;

    const normalizedMessage = baseMessage.toLowerCase();
    const isUnauthorized =
      normalizedMessage.includes("unauthorized") ||
      normalizedMessage.includes("not authorized") ||
      normalizedMessage.includes("forbidden");
    const isValidation =
      normalizedMessage.includes("validation") ||
      normalizedMessage.includes("invalid");
    const isNetwork =
      normalizedMessage.includes("network") ||
      normalizedMessage.includes("timeout") ||
      (typeof details === "object" && details && "statusCode" in details);
    const isVersionConflict =
      normalizedMessage.includes("conditionalcheckfailed") ||
      normalizedMessage.includes("conditional check failed") ||
      normalizedMessage.includes("the conditional request failed");

    if (isVersionConflict) {
      return {
        message:
          "他のユーザーがシフトを更新しています。画面を再読み込みしてください。",
        connection: "error" as const,
      };
    }

    if (isUnauthorized) {
      return { message: "権限がありません。", connection: "error" as const };
    }

    if (isValidation) {
      return {
        message: "入力内容に誤りがあります。",
        connection: "error" as const,
      };
    }

    if (isNetwork) {
      return {
        message: "ネットワークエラーが発生しました。",
        connection: "disconnected" as const,
      };
    }

    return { message: baseMessage, connection: "error" as const };
  }, []);

  const updateShiftRequestState = useCallback(
    (request: ShiftRequestData) => {
      shiftRequestsRef.current.set(request.staffId, request);
      setShiftDataMap((prev) =>
        targetMonth
          ? applyShiftRequestToShiftDataMap({
              shiftDataMap: prev,
              shiftRequest: request,
              targetMonth,
            })
          : prev,
      );
    },
    [targetMonth],
  );

  useEffect(() => {
    if (!targetMonth) {
      return;
    }

    const nextMap = new Map<string, ShiftRequestData>();
    normalizedShiftRequests.forEach((request) => {
      nextMap.set(request.staffId, request);
    });
    shiftRequestsRef.current = nextMap;

    setShiftDataMap(
      transformShiftRequestToShiftDataMap({
        shiftRequests: normalizedShiftRequests,
        staffIds,
        targetMonth,
      }),
    );
    setLastFetchedAt(Date.now());
  }, [normalizedShiftRequests, staffIdsKey, targetMonth]);

  useEffect(() => {
    if (!fetchError) {
      return;
    }

    const { message, connection } = buildShiftErrorMessage(fetchError);
    setError(message);
    setConnectionState(connection);
  }, [fetchError, buildShiftErrorMessage]);

  /**
   * シフトデータを取得
   */
  const fetchShifts = useCallback(async () => {
    if (shouldSkipFetch) return;

    try {
      setError(null);
      setConnectionState("connected");

      const result = await refetch();
      if ("error" in result && result.error) {
        throw result.error;
      }

      setLastFetchedAt(Date.now());
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
      const { message, connection } = buildShiftErrorMessage(err);
      setConnectionState(connection);
      setError(message);
      throw err;
    }
  }, [shouldSkipFetch, buildShiftErrorMessage]);

  const buildShiftRequestEntries = useCallback(
    (staffData: Map<string, ShiftCellData>) =>
      Array.from(staffData.entries())
        .map(([dayKey, cell]): ShiftRequestDayPreferenceInput | null => {
          if (!targetMonth) {
            return null;
          }
          const status = shiftStateWithEmptyToShiftRequestStatus(cell.state);
          if (!status) return null;
          return {
            date: dayjs(`${targetMonth}-${dayKey}`).format("YYYY-MM-DD"),
            status,
            isLocked: cell.isLocked || undefined,
          };
        })
        .filter(
          (entry): entry is ShiftRequestDayPreferenceInput => entry !== null,
        )
        .toSorted((a, b) => a.date.localeCompare(b.date)),
    [targetMonth],
  );

  const createShiftRequestForStaff = useCallback(
    async (staffId: string, map: ShiftDataMap) => {
      if (!targetMonth) {
        throw new Error("Target month is required");
      }

      const staffData = map.get(staffId) ?? new Map();
      const entries = buildShiftRequestEntries(staffData);
      const timestamp = new Date().toISOString();
      const histories: ShiftRequestHistoryInput[] = [
        {
          version: 1,
          entries,
          recordedAt: timestamp,
          recordedByStaffId: currentUserId,
        },
      ];

      const created = await createShiftRequest({
        input: {
          staffId,
          targetMonth,
          entries,
          updatedBy: currentUserId,
          updatedAt: timestamp,
          histories,
        },
      }).unwrap();

      const normalizedCreated = normalizeShiftRequest(created);
      updateShiftRequestState(normalizedCreated);
      onPersistCompletedRef.current?.(normalizedCreated);
      return created;
    },
    [
      targetMonth,
      buildShiftRequestEntries,
      currentUserId,
      createShiftRequest,
      updateShiftRequestState,
    ],
  );

  const persistShiftUpdate = useCallback(
    async (update: ShiftCellUpdate, currentMap: ShiftDataMap) => {
      if (!targetMonth) {
        throw new Error("Target month is required");
      }

      const shiftRequest = shiftRequestsRef.current.get(update.staffId);
      if (!shiftRequest) {
        return createShiftRequestForStaff(update.staffId, currentMap);
      }

      const payload = transformShiftCellUpdateToGraphQLInput({
        shiftRequest,
        shiftDataMap: currentMap,
        targetMonth,
        updatedBy: currentUserId,
      });

      const updated = await updateShiftCell(payload).unwrap();
      const normalizedUpdated = normalizeShiftRequest(updated);
      updateShiftRequestState(normalizedUpdated);
      onPersistCompletedRef.current?.(normalizedUpdated);

      return updated;
    },
    [
      currentUserId,
      targetMonth,
      updateShiftCell,
      updateShiftRequestState,
      createShiftRequestForStaff,
    ],
  );

  /**
   * シフトを更新
   */
  const updateShift = useCallback(
    async (update: ShiftCellUpdate) => {
      const key = `${update.staffId}-${update.date}`;

      onSaveStartedRef.current?.();

      const prevMap = shiftDataMap;
      const nextMap = applyShiftCellUpdateToMap({
        shiftDataMap: prevMap,
        update,
        currentUserId,
      });

      pendingChangesRef.current.set(key, update);
      setShiftDataMap(nextMap);

      persistShiftUpdate(update, nextMap)
        .then(() => {
          pendingChangesRef.current.delete(key);
          setConnectionState("connected");
          onSaveCompletedRef.current?.();
        })
        .catch((err) => {
          console.error("Failed to update shift:", err);
          pendingChangesRef.current.delete(key);
          setShiftDataMap(prevMap);
          const { message, connection } = buildShiftErrorMessage(err);
          setConnectionState(connection);
          onSaveFailedRef.current?.(message);
        });
    },
    [currentUserId, persistShiftUpdate, buildShiftErrorMessage, shiftDataMap],
  );

  /**
   * バッチ更新
   */
  const batchUpdateShifts = useCallback(
    async (updates: ShiftCellUpdate[]) => {
      if (!targetMonth || updates.length === 0) {
        return;
      }

      setIsBatchUpdating(true);
      onSaveStartedRef.current?.();

      const prevMap = shiftDataMap;

      try {
        const nextMap = updates.reduce(
          (map, update) =>
            applyShiftCellUpdateToMap({
              shiftDataMap: map,
              update,
              currentUserId,
            }),
          shiftDataMap,
        );

        setShiftDataMap(nextMap);
        updates.forEach((update) => {
          const key = `${update.staffId}-${update.date}`;
          pendingChangesRef.current.set(key, update);
        });

        const updatesByStaff = new Map<string, ShiftCellUpdate[]>();
        updates.forEach((update) => {
          const list = updatesByStaff.get(update.staffId) ?? [];
          list.push(update);
          updatesByStaff.set(update.staffId, list);
        });

        const missingStaffIds = Array.from(updatesByStaff.keys()).filter(
          (staffId) => !shiftRequestsRef.current.get(staffId),
        );

        if (missingStaffIds.length > 0) {
          await Promise.all(
            missingStaffIds.map(async (staffId) => {
              await createShiftRequestForStaff(staffId, nextMap);
              const staffUpdates = updatesByStaff.get(staffId) ?? [];
              staffUpdates.forEach((update) => {
                const key = `${update.staffId}-${update.date}`;
                pendingChangesRef.current.delete(key);
              });
            }),
          );
        }

        const payloads = Array.from(updatesByStaff.keys())
          .filter((staffId) => !missingStaffIds.includes(staffId))
          .map((staffId) => {
            const shiftRequest = shiftRequestsRef.current.get(staffId);
            if (!shiftRequest) {
              return null;
            }

            return transformShiftCellUpdateToGraphQLInput({
              shiftRequest,
              shiftDataMap: nextMap,
              targetMonth,
              updatedBy: currentUserId,
            });
          })
          .filter((payload): payload is NonNullable<typeof payload> =>
            Boolean(payload),
          );

        if (payloads.length === 0) {
          setIsBatchUpdating(false);
          return;
        }

        const result = await batchUpdateShiftCells({
          updates: payloads,
        }).unwrap();

        result.updatedRequests.forEach((request) => {
          const normalized = normalizeShiftRequest(request);
          updateShiftRequestState(normalized);
          onPersistCompletedRef.current?.(normalized);
        });

        updates.forEach((update) => {
          const key = `${update.staffId}-${update.date}`;
          pendingChangesRef.current.delete(key);
        });

        if (result.errors.length > 0) {
          onSaveFailedRef.current?.(
            "一部の更新に失敗しました。再試行してください。",
          );
        } else {
          onSaveCompletedRef.current?.();
        }
      } catch (err) {
        console.error("Batch update failed:", err);
        setShiftDataMap(prevMap);
        updates.forEach((update) => {
          const key = `${update.staffId}-${update.date}`;
          pendingChangesRef.current.delete(key);
        });
        const { message, connection } = buildShiftErrorMessage(err);
        setConnectionState(connection);
        onSaveFailedRef.current?.(message);
      } finally {
        setIsBatchUpdating(false);
      }
    },
    [
      targetMonth,
      shiftDataMap,
      currentUserId,
      batchUpdateShiftCells,
      createShiftRequestForStaff,
      buildShiftErrorMessage,
    ],
  );

  const retryPendingChanges = useCallback(async () => {
    const pendingUpdates = Array.from(pendingChangesRef.current.values());
    await batchUpdateShifts(pendingUpdates);
  }, [batchUpdateShifts]);

  /**
   * リアルタイム更新のためのサブスクリプション
   *
   * 同時にアクセスしている他のユーザーによるシフト変更を即座に反映します。
   *
   * 【動作の仕組み】
   * 1. 各スタッフのシフト更新イベント（onUpdateShiftRequest）をサブスクライブ
   * 2. 他のユーザーが変更を保存すると、GraphQLサブスクリプション経由で通知を受信
   * 3. 受信した変更をローカルの shiftDataMap に即座に反映
   *
   * 【自分の更新の扱い】
   * - 自分の更新は楽観的更新（optimistic update）として既にUIに反映済み
   * - サブスクリプションで自分の更新も受信するが、二重適用を防ぐため除外
   * - サーバー応答は persistShiftUpdate 内で処理され、最終的な値を確定
   *
   * 【注意事項】
   * - サブスクリプションは staffIds または targetMonth が変更されると再設定される
   * - クリーンアップ関数で unsubscribe を呼び出し、メモリリークを防止
   */
  useEffect(() => {
    if (!targetMonth || staffIds.length === 0) {
      return;
    }

    const handleRealtimeEvent = (
      request: ShiftRequestData,
      staffId: string,
    ) => {
      // 自分の更新による無限ループと二重適用を防ぐ
      // 自分の更新は楽観的更新として既に反映済みのためスキップ
      if (request.updatedBy === currentUserId) {
        return;
      }

      // 他のユーザーの更新をローカルステートに反映
      updateShiftRequestState(request);
      onAutoSyncReceivedRef.current?.();
      onRemoteUpdateRef.current?.(staffId, request);

      // コメントの更新を通知
      if (request.comments) {
        onCommentsReceivedRef.current?.(staffId, request.comments);
      }
    };

    // 各スタッフのシフト新規作成・更新をサブスクライブ
    const subscriptions = staffIds.flatMap((staffId) => {
      const variables = {
        filter: {
          staffId: { eq: staffId },
          targetMonth: { eq: targetMonth },
        },
      };

      const createSubscription = graphqlClient
        .graphql({
          query: onCreateShiftRequest,
          variables,
          authMode: "userPool",
        })
        .subscribe({
          next: ({ data }) => {
            if (!data?.onCreateShiftRequest) return;

            const createdRequest = normalizeShiftRequest(
              data.onCreateShiftRequest,
            );
            handleRealtimeEvent(createdRequest, staffId);
          },
          error: (error) => {
            console.error(
              `[Subscription Error] Failed to subscribe create for staff ${staffId}:`,
              error,
            );
          },
        });

      const updateSubscription = graphqlClient
        .graphql({
          query: onUpdateShiftRequest,
          variables,
          authMode: "userPool",
        })
        .subscribe({
          next: ({ data }) => {
            if (!data?.onUpdateShiftRequest) return;

            const updatedRequest = normalizeShiftRequest(
              data.onUpdateShiftRequest,
            );
            handleRealtimeEvent(updatedRequest, staffId);
          },
          error: (error) => {
            console.error(
              `[Subscription Error] Failed to subscribe update for staff ${staffId}:`,
              error,
            );
          },
        });

      return [createSubscription, updateSubscription];
    });

    // クリーンアップ：コンポーネントのアンマウント時や依存配列の変更時にサブスクリプションを解除
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [staffIdsKey, targetMonth, currentUserId, updateShiftRequestState]);

  const getShiftRequest = useCallback(
    (staffId: string) => shiftRequestsRef.current.get(staffId),
    [],
  );

  const getAllShiftRequests = useCallback(
    () => Array.from(shiftRequestsRef.current.values()),
    [],
  );

  return {
    shiftDataMap,
    pendingChanges: pendingChangesRef.current,
    isLoading,
    isBatchUpdating,
    error,
    connectionState,
    lastFetchedAt,
    fetchShifts,
    updateShift,
    batchUpdateShifts,
    retryPendingChanges,
    getShiftRequest,
    getAllShiftRequests,
  };
};
