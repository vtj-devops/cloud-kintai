import { useCallback, useEffect, useRef, useState } from "react";

import { CollaborativeUser } from "../types/collaborative.types";

/**
 * アクティブユーザーのプレゼンス管理フック
 */
interface UseShiftPresenceProps {
  currentUserId: string;
  currentUserName: string;
  _shiftRequestId?: string;
  _targetMonth?: string;
}

interface PresenceData {
  userId: string;
  userName: string;
  color: string;
  lastActivity: number;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = "shift_presence_";
const INACTIVE_THRESHOLD = 60000; // 60秒

/**
 * ユーザーごとにユニークな色を生成
 */
const generateUserColor = (userId: string): string => {
  const colors = [
    "#2196f3", // blue
    "#4caf50", // green
    "#ff9800", // orange
    "#f44336", // red
    "#9c27b0", // purple
    "#00bcd4", // cyan
    "#e91e63", // pink
    "#673ab7", // deep purple
  ];
  const hash = userId.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return colors[hash % colors.length];
};

export const useShiftPresence = ({
  currentUserId,
  currentUserName,
}: UseShiftPresenceProps) => {
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [editingCells, setEditingCells] = useState<
    Map<string, { userId: string; userName: string; startTime: number }>
  >(new Map());

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastActivityRef = useRef<number>(0);
  const editTimeoutCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(
    undefined,
  );
  const currentUserColorRef = useRef<string>(generateUserColor(currentUserId));

  /**
   * ユーザーのアクティビティを記録
   */
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * セル編集の開始を通知
   */
  const startEditingCell = useCallback(
    (staffId: string, date: string) => {
      const cellKey = `${staffId}_${date}`;
      setEditingCells((prev) => {
        const next = new Map(prev);
        next.set(cellKey, {
          userId: currentUserId,
          userName: currentUserName,
          startTime: Date.now(),
        });
        return next;
      });
      updateActivity();

      // TODO: Phase 4でWebSocketを使って他のユーザーに通知
      console.log("Start editing cell:", cellKey);
    },
    [currentUserId, currentUserName, updateActivity],
  );

  /**
   * セル編集の終了を通知
   */
  const stopEditingCell = useCallback((staffId: string, date: string) => {
    const cellKey = `${staffId}_${date}`;
    setEditingCells((prev) => {
      const next = new Map(prev);
      next.delete(cellKey);
      return next;
    });

    // TODO: Phase 4でWebSocketを使って他のユーザーに通知
    console.log("Stop editing cell:", cellKey);
  }, []);

  /**
   * 特定のセルが他のユーザーによって編集中かチェック
   */
  const isCellBeingEdited = useCallback(
    (staffId: string, date: string): boolean => {
      const cellKey = `${staffId}_${date}`;
      const editor = editingCells.get(cellKey);
      return editor !== undefined && editor.userId !== currentUserId;
    },
    [editingCells, currentUserId],
  );

  /**
   * 特定のセルを編集中のユーザーを取得
   */
  const getCellEditor = useCallback(
    (staffId: string, date: string): CollaborativeUser | undefined => {
      const cellKey = `${staffId}_${date}`;
      const editor = editingCells.get(cellKey);
      if (!editor) return undefined;

      return activeUsers.find((user) => user.userId === editor.userId);
    },
    [editingCells, activeUsers],
  );

  /**
   * ローカルストレージにプレゼンス情報を保存
   */
  const savePresenceToStorage = useCallback(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${currentUserId}`;
    const presenceData: PresenceData = {
      userId: currentUserId,
      userName: currentUserName,
      color: currentUserColorRef.current,
      lastActivity: lastActivityRef.current,
      timestamp: Date.now(),
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(presenceData));
    } catch (error) {
      console.error("Failed to save presence to storage:", error);
    }
  }, [currentUserId, currentUserName]);

  /**
   * ローカルストレージからアクティブユーザーを読み込み
   */
  const loadActiveUsersFromStorage = useCallback(() => {
    const now = Date.now();
    const allUsers: CollaborativeUser[] = [];

    try {
      // ローカルストレージ内のすべてのユーザープレゼンス情報を取得
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const data = window.localStorage.getItem(key);
          if (data) {
            try {
              const presenceData: PresenceData = JSON.parse(data);
              // タイムアウトしていないユーザーのみを追加
              if (now - presenceData.timestamp < INACTIVE_THRESHOLD) {
                allUsers.push({
                  userId: presenceData.userId,
                  userName: presenceData.userName,
                  color: presenceData.color,
                  lastActivity: presenceData.lastActivity,
                });
              }
            } catch (error) {
              console.warn("Failed to parse presence data:", key, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load active users from storage:", error);
    }

    // ユーザーIDでソートしてデータの一貫性を保つ
    const sortedUsers = allUsers.toSorted((a, b) =>
      a.userId.localeCompare(b.userId),
    );

    // 重複を避けるため、アクティブユーザーが变わった場合のみ更新
    setActiveUsers((prevUsers) => {
      const prevIds = new Set(prevUsers.map((u) => u.userId));
      const newIds = new Set(sortedUsers.map((u) => u.userId));

      if (
        prevIds.size !== newIds.size ||
        ![...prevIds].every((id) => newIds.has(id))
      ) {
        return sortedUsers;
      }

      // ユーザー情報に変更がないか確認
      const hasChanges = sortedUsers.some((newUser) => {
        const prevUser = prevUsers.find((u) => u.userId === newUser.userId);
        return !prevUser || prevUser.lastActivity !== newUser.lastActivity;
      });

      return hasChanges ? sortedUsers : prevUsers;
    });
  }, []);

  /**
   * アクティブユーザーリストの更新
   * ローカルストレージとポーリングで複数ユーザーに対応
   */
  const updateActiveUsers = useCallback(() => {
    // 自身のプレゼンス情報をローカルストレージに保存
    savePresenceToStorage();
    // ローカルストレージからアクティブユーザーを読み込み
    loadActiveUsersFromStorage();
  }, [savePresenceToStorage, loadActiveUsersFromStorage]);

  /**
   * ハートビート送信
   */
  useEffect(() => {
    // 初回のアクティビティ時刻を設定
    lastActivityRef.current = Date.now();

    // 定期的にハートビートを送信（10秒ごと）
    heartbeatIntervalRef.current = setInterval(() => {
      updateActiveUsers();
    }, 10000);

    // マウント直後に1回実行
    const timeoutId = setTimeout(() => {
      updateActiveUsers();
    }, 0);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [updateActiveUsers]);

  /**
   * 非アクティブユーザーの削除
   * Phase 4でWebSocketからの更新に対応
   */
  useEffect(() => {
    const checkInactiveUsers = setInterval(() => {
      const now = Date.now();
      const inactiveThreshold = 60000; // 60秒

      setActiveUsers((prev) =>
        prev.filter((user) => now - user.lastActivity < inactiveThreshold),
      );
    }, 10000); // 10秒ごとにチェック

    return () => clearInterval(checkInactiveUsers);
  }, []);

  /**
   * 編集タイムアウトのチェック
   * 5分間無操作で自動解除
   */
  useEffect(() => {
    const EDIT_TIMEOUT = 5 * 60 * 1000; // 5分

    editTimeoutCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setEditingCells((prev) => {
        const next = new Map(prev);
        let hasChanges = false;

        next.forEach((editor, cellKey) => {
          if (now - editor.startTime > EDIT_TIMEOUT) {
            next.delete(cellKey);
            hasChanges = true;
            console.log("Edit timeout: auto-released cell", cellKey);
          }
        });

        return hasChanges ? next : prev;
      });
    }, 30000); // 30秒ごとにチェック

    return () => {
      if (editTimeoutCheckIntervalRef.current) {
        clearInterval(editTimeoutCheckIntervalRef.current);
      }
    };
  }, []);

  /**
   * 管理者による強制解除
   */
  const forceReleaseCell = useCallback((staffId: string, date: string) => {
    const cellKey = `${staffId}_${date}`;
    setEditingCells((prev) => {
      const next = new Map(prev);
      next.delete(cellKey);
      return next;
    });

    // TODO: Phase 4でWebSocketを使って他のユーザーに通知
    console.log("Force release cell:", cellKey);
  }, []);

  /**
   * すべての編集ロックを取得（管理者用）
   */
  const getAllEditingCells = useCallback(() => {
    return Array.from(editingCells.entries()).map(([cellKey, editor]) => {
      const [staffId, date] = cellKey.split("_");
      return {
        cellKey,
        staffId,
        date,
        ...editor,
      };
    });
  }, [editingCells]);

  return {
    activeUsers,
    editingCells,
    startEditingCell,
    stopEditingCell,
    isCellBeingEdited,
    getCellEditor,
    updateActivity,
    forceReleaseCell,
    getAllEditingCells,
  };
};
