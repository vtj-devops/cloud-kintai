import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  createShiftEditLock,
  deleteShiftEditLock,
  getShiftEditLock,
  listShiftEditLocks,
  onCreateShiftEditLock,
  onDeleteShiftEditLock,
  onUpdateShiftEditLock,
  updateShiftEditLock,
} from "@shared/api/graphql/documents/shiftEditLock";
import { GraphQLResult } from "aws-amplify/api";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CollaborativeUser,
  EditLockAcquireResult,
  ShiftEditLockData,
} from "../types/collaborative.types";

const EDIT_LOCK_TTL_MS = 90_000;
const EDIT_LOCK_REFRESH_INTERVAL_MS = 30_000;
const EDIT_LOCK_CLEANUP_INTERVAL_MS = 15_000;

type ShiftEditLockMap = Map<
  string,
  {
    id: string;
    userId: string;
    userName: string;
    startTime: number;
    expiresAt: number;
    version: number;
  }
>;

type ShiftEditLockListResponse = {
  listShiftEditLocks?: {
    items?: Array<ShiftEditLockData | null> | null;
    nextToken?: string | null;
  } | null;
};

type ShiftEditLockItemResponse = {
  getShiftEditLock?: ShiftEditLockData | null;
  createShiftEditLock?: ShiftEditLockData | null;
  updateShiftEditLock?: ShiftEditLockData | null;
  deleteShiftEditLock?: ShiftEditLockData | null;
  onCreateShiftEditLock?: ShiftEditLockData | null;
  onUpdateShiftEditLock?: ShiftEditLockData | null;
  onDeleteShiftEditLock?: ShiftEditLockData | null;
};

const EMPTY_EDITING_CELLS: ShiftEditLockMap = new Map();

const toCellKey = (staffId: string, date: string) => `${staffId}_${date}`;
const toLockId = (targetMonth: string, staffId: string, date: string) =>
  `${targetMonth}#${staffId}#${date}`;
const toMs = (value: string) => new Date(value).getTime();
const isActiveLock = (lock: ShiftEditLockData, now = Date.now()) =>
  toMs(lock.expiresAt) > now;

const toEditingMapEntry = (lock: ShiftEditLockData) => ({
  id: lock.id,
  userId: lock.holderUserId,
  userName: lock.holderUserName,
  startTime: toMs(lock.acquiredAt),
  expiresAt: toMs(lock.expiresAt),
  version: lock.version,
});

const toEditingCellsMap = (locks: ShiftEditLockData[]): ShiftEditLockMap =>
  new Map(
    locks.map((lock) => [
      toCellKey(lock.staffId, lock.date),
      toEditingMapEntry(lock),
    ]),
  );

const normalizeErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray(error.errors)
  ) {
    const messages = error.errors
      .map((item) =>
        item &&
        typeof item === "object" &&
        "message" in item &&
        typeof item.message === "string"
          ? item.message
          : null,
      )
      .filter((item): item is string => Boolean(item));

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "編集ロックの処理に失敗しました。";
};

export const buildEditLockConflictMessage = (lock?: ShiftEditLockData | null) => {
  if (!lock) {
    return "編集ロックの取得に失敗しました。最新状態を確認してから再度お試しください。";
  }

  return `${lock.holderUserName} が ${lock.date} 日セルを編集中です。`;
};

interface UseShiftEditLocksProps {
  currentUserId: string;
  currentUserName: string;
  targetMonth?: string;
}

export const useShiftEditLocks = ({
  currentUserId,
  currentUserName,
  targetMonth,
}: UseShiftEditLocksProps) => {
  const [editingCells, setEditingCells] = useState<ShiftEditLockMap>(new Map());
  const editingCellsRef = useRef(editingCells);

  useEffect(() => {
    editingCellsRef.current = editingCells;
  }, [editingCells]);

  const upsertLock = useCallback(
    (lock: ShiftEditLockData) => {
      if (!targetMonth || lock.targetMonth !== targetMonth) {
        return;
      }

      setEditingCells((prev) => {
        const next = new Map(prev);
        if (!isActiveLock(lock)) {
          next.delete(toCellKey(lock.staffId, lock.date));
          return next;
        }

        next.set(toCellKey(lock.staffId, lock.date), toEditingMapEntry(lock));
        return next;
      });
    },
    [targetMonth],
  );

  const removeLock = useCallback((staffId: string, date: string) => {
    setEditingCells((prev) => {
      const cellKey = toCellKey(staffId, date);
      if (!prev.has(cellKey)) {
        return prev;
      }

      const next = new Map(prev);
      next.delete(cellKey);
      return next;
    });
  }, []);

  const fetchLockById = useCallback(async (id: string) => {
    const result = (await graphqlClient.graphql({
      query: getShiftEditLock,
      variables: { id },
      authMode: "userPool",
    })) as GraphQLResult<ShiftEditLockItemResponse>;

    const lock = result.data?.getShiftEditLock ?? null;
    return lock && isActiveLock(lock) ? lock : null;
  }, []);

  const fetchCurrentLocks = useCallback(async (targetMonthValue: string) => {
    const collected: ShiftEditLockData[] = [];
    let nextToken: string | null | undefined = null;

    do {
      const result = (await graphqlClient.graphql({
        query: listShiftEditLocks,
        variables: {
          filter: { targetMonth: { eq: targetMonthValue } },
          limit: 200,
          nextToken,
        },
        authMode: "userPool",
      })) as GraphQLResult<ShiftEditLockListResponse>;

      const connection = result.data?.listShiftEditLocks;
      connection?.items
        ?.filter((item): item is ShiftEditLockData => Boolean(item))
        .filter((item) => isActiveLock(item))
        .forEach((item) => {
          collected.push(item);
        });

      nextToken = connection?.nextToken;
    } while (nextToken);

    return collected;
  }, []);

  const refreshLocks = useCallback(async () => {
    if (!targetMonth) {
      return [];
    }

    const collected = await fetchCurrentLocks(targetMonth);
    setEditingCells(toEditingCellsMap(collected));
    return collected;
  }, [fetchCurrentLocks, targetMonth]);

  useEffect(() => {
    if (!targetMonth) {
      return;
    }

    let active = true;

    void fetchCurrentLocks(targetMonth)
      .then((collected) => {
        if (active) {
          setEditingCells(toEditingCellsMap(collected));
        }
      })
      .catch((error) => {
        console.error("Failed to refresh shift edit locks:", error);
      });

    return () => {
      active = false;
    };
  }, [fetchCurrentLocks, targetMonth]);

  const visibleEditingCells = targetMonth
    ? new Map(
        Array.from(editingCells.entries()).filter(([, lock]) =>
          lock.id.startsWith(`${targetMonth}#`),
        ),
      )
    : EMPTY_EDITING_CELLS;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setEditingCells((prev) => {
        const next = new Map(prev);
        let changed = false;

        next.forEach((lock, cellKey) => {
          if (lock.expiresAt <= now) {
            next.delete(cellKey);
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, EDIT_LOCK_CLEANUP_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!targetMonth) {
      return;
    }

    const variables = { filter: { targetMonth: { eq: targetMonth } } };

    const createSubscription = (graphqlClient
      .graphql({
        query: onCreateShiftEditLock,
        variables,
        authMode: "userPool",
      }) as {
      subscribe: (handlers: {
        next: (value: { data?: ShiftEditLockItemResponse }) => void;
        error: (error: unknown) => void;
      }) => { unsubscribe: () => void };
    })
      .subscribe({
        next: ({ data }: { data?: ShiftEditLockItemResponse }) => {
          const lock = data?.onCreateShiftEditLock;
          if (lock) {
            upsertLock(lock);
          }
        },
        error: (error: unknown) => {
          console.error("Failed to subscribe create shift edit lock:", error);
        },
      });

    const updateSubscription = (graphqlClient
      .graphql({
        query: onUpdateShiftEditLock,
        variables,
        authMode: "userPool",
      }) as {
      subscribe: (handlers: {
        next: (value: { data?: ShiftEditLockItemResponse }) => void;
        error: (error: unknown) => void;
      }) => { unsubscribe: () => void };
    })
      .subscribe({
        next: ({ data }: { data?: ShiftEditLockItemResponse }) => {
          const lock = data?.onUpdateShiftEditLock;
          if (lock) {
            upsertLock(lock);
          }
        },
        error: (error: unknown) => {
          console.error("Failed to subscribe update shift edit lock:", error);
        },
      });

    const deleteSubscription = (graphqlClient
      .graphql({
        query: onDeleteShiftEditLock,
        variables,
        authMode: "userPool",
      }) as {
      subscribe: (handlers: {
        next: (value: { data?: ShiftEditLockItemResponse }) => void;
        error: (error: unknown) => void;
      }) => { unsubscribe: () => void };
    })
      .subscribe({
        next: ({ data }: { data?: ShiftEditLockItemResponse }) => {
          const lock = data?.onDeleteShiftEditLock;
          if (lock) {
            removeLock(lock.staffId, lock.date);
          }
        },
        error: (error: unknown) => {
          console.error("Failed to subscribe delete shift edit lock:", error);
        },
      });

    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [removeLock, targetMonth, upsertLock]);

  const renewLock = useCallback(
    async (lock: ShiftEditLockData) => {
      const now = new Date();
      const result = (await graphqlClient.graphql({
        query: updateShiftEditLock,
        variables: {
          input: {
            id: lock.id,
            targetMonth: lock.targetMonth,
            staffId: lock.staffId,
            date: lock.date,
            holderUserId: currentUserId,
            holderUserName: currentUserName,
            acquiredAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + EDIT_LOCK_TTL_MS).toISOString(),
            version: lock.version + 1,
          },
          condition: {
            version: { eq: lock.version },
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<ShiftEditLockItemResponse>;

      const updatedLock = result.data?.updateShiftEditLock ?? null;
      if (updatedLock) {
        upsertLock(updatedLock);
      }
    },
    [currentUserId, currentUserName, upsertLock],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      Array.from(editingCellsRef.current.values())
        .filter(
          (lock) => lock.userId === currentUserId && lock.expiresAt > Date.now(),
        )
        .forEach((lock) => {
          const [lockTargetMonth, staffId, date] = lock.id.split("#");
          void renewLock({
            id: lock.id,
            targetMonth: lockTargetMonth,
            staffId,
            date,
            holderUserId: lock.userId,
            holderUserName: lock.userName,
            acquiredAt: new Date(lock.startTime).toISOString(),
            expiresAt: new Date(lock.expiresAt).toISOString(),
            version: lock.version,
          }).catch((error) => {
            console.error("Failed to renew shift edit lock:", error);
          });
        });
    }, EDIT_LOCK_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUserId, renewLock]);

  const acquireEditLock = useCallback(
    async (staffId: string, date: string): Promise<EditLockAcquireResult> => {
      if (!targetMonth) {
        return { acquired: false };
      }

      const id = toLockId(targetMonth, staffId, date);
      const now = new Date();
      const baseInput = {
        id,
        targetMonth,
        staffId,
        date,
        holderUserId: currentUserId,
        holderUserName: currentUserName,
        acquiredAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + EDIT_LOCK_TTL_MS).toISOString(),
      };

      const existingLock = await fetchLockById(id);
      if (existingLock && existingLock.holderUserId !== currentUserId) {
        upsertLock(existingLock);
        return { acquired: false, conflict: existingLock };
      }

      try {
        if (!existingLock) {
          const result = (await graphqlClient.graphql({
            query: createShiftEditLock,
            variables: {
              input: {
                ...baseInput,
                version: 1,
              },
            },
            authMode: "userPool",
          })) as GraphQLResult<ShiftEditLockItemResponse>;
          const created = result.data?.createShiftEditLock ?? null;
          if (created) {
            upsertLock(created);
            return { acquired: true, lock: created };
          }
        } else {
          const result = (await graphqlClient.graphql({
            query: updateShiftEditLock,
            variables: {
              input: {
                ...baseInput,
                version: existingLock.version + 1,
              },
              condition: {
                version: { eq: existingLock.version },
              },
            },
            authMode: "userPool",
          })) as GraphQLResult<ShiftEditLockItemResponse>;
          const updated = result.data?.updateShiftEditLock ?? null;
          if (updated) {
            upsertLock(updated);
            return { acquired: true, lock: updated };
          }
        }
      } catch (error) {
        const latestLock = await fetchLockById(id);
        if (latestLock?.holderUserId !== currentUserId) {
          if (latestLock) {
            upsertLock(latestLock);
          }
          return { acquired: false, conflict: latestLock ?? undefined };
        }

        throw new Error(normalizeErrorMessage(error));
      }

      const latestLock = await fetchLockById(id);
      if (latestLock) {
        upsertLock(latestLock);
      }

      return {
        acquired: latestLock?.holderUserId === currentUserId,
        lock: latestLock?.holderUserId === currentUserId ? latestLock : undefined,
        conflict:
          latestLock?.holderUserId !== currentUserId ? latestLock ?? undefined : undefined,
      };
    },
    [
      currentUserId,
      currentUserName,
      fetchLockById,
      targetMonth,
      upsertLock,
    ],
  );

  const releaseEditLock = useCallback(
    async (staffId: string, date: string) => {
      if (!targetMonth) {
        return;
      }

      const id = toLockId(targetMonth, staffId, date);
      const existingLock = await fetchLockById(id);
      if (!existingLock || existingLock.holderUserId !== currentUserId) {
        removeLock(staffId, date);
        return;
      }

      await graphqlClient.graphql({
        query: deleteShiftEditLock,
        variables: {
          input: {
            id,
          },
          condition: {
            version: { eq: existingLock.version },
          },
        },
        authMode: "userPool",
      });

      removeLock(staffId, date);
    },
    [currentUserId, fetchLockById, removeLock, targetMonth],
  );

  const forceReleaseLock = useCallback(
    async (staffId: string, date: string) => {
      if (!targetMonth) {
        return;
      }

      const id = toLockId(targetMonth, staffId, date);
      const existingLock = await fetchLockById(id);
      if (!existingLock) {
        removeLock(staffId, date);
        return;
      }

      await graphqlClient.graphql({
        query: deleteShiftEditLock,
        variables: {
          input: {
            id,
          },
          condition: {
            version: { eq: existingLock.version },
          },
        },
        authMode: "userPool",
      });

      removeLock(staffId, date);
    },
    [fetchLockById, removeLock, targetMonth],
  );

  const isCellBeingEdited = useCallback(
    (staffId: string, date: string) => {
      const editor = visibleEditingCells.get(toCellKey(staffId, date));
      return Boolean(
        editor && editor.userId !== currentUserId && editor.expiresAt > Date.now(),
      );
    },
    [currentUserId, visibleEditingCells],
  );

  const hasEditLock = useCallback(
    (staffId: string, date: string) => {
      const editor = visibleEditingCells.get(toCellKey(staffId, date));
      return Boolean(
        editor && editor.userId === currentUserId && editor.expiresAt > Date.now(),
      );
    },
    [currentUserId, visibleEditingCells],
  );

  const getCellEditor = useCallback(
    (staffId: string, date: string): CollaborativeUser | undefined => {
      const editor = visibleEditingCells.get(toCellKey(staffId, date));
      if (!editor || editor.expiresAt <= Date.now()) {
        return undefined;
      }

      return {
        userId: editor.userId,
        userName: editor.userName,
        color: editor.userId === currentUserId ? "#2196f3" : "#4caf50",
        lastActivity: editor.startTime,
      };
    },
    [currentUserId, visibleEditingCells],
  );

  const getAllEditingCells = useCallback(
    () =>
      Array.from(visibleEditingCells.entries())
        .filter(([, editor]) => editor.expiresAt > Date.now())
        .map(([cellKey, editor]) => {
          const [staffId, date] = cellKey.split("_");
          return {
            cellKey,
            staffId,
            date,
            userId: editor.userId,
            userName: editor.userName,
            startTime: editor.startTime,
          };
        }),
    [visibleEditingCells],
  );

  return {
    editingCells: visibleEditingCells,
    acquireEditLock,
    releaseEditLock,
    forceReleaseLock,
    refreshLocks,
    isCellBeingEdited,
    hasEditLock,
    getCellEditor,
    getAllEditingCells,
  };
};
