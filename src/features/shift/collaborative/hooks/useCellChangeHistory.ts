import { useCallback, useEffect, useRef, useState } from "react";

import {
  CellChangeHistoryMap,
  CellChangeRecord,
  CellChangeSource,
  ShiftCellUpdate,
  ShiftState,
} from "../types/collaborative.types";

interface UseCellChangeHistoryConfig {
  readonly maxRecordsPerCell?: number;
}

const buildCellKey = (staffId: string, date: string) => `${staffId}#${date}`;

const createRecordId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * セル単位の変更履歴を管理するフック
 *
 * 各セルの変更前後の状態・変更者・変更日時・変更元（手動/一括/Undo/Redo/リモートなど）を
 * セルキー単位で蓄積し、任意セルの履歴を時系列で参照できる。
 */
export const useCellChangeHistory = ({
  maxRecordsPerCell = 200,
}: UseCellChangeHistoryConfig = {}) => {
  const [historyMap, setHistoryMap] = useState<CellChangeHistoryMap>(new Map());
  const maxRef = useRef(maxRecordsPerCell);

  useEffect(() => {
    maxRef.current = maxRecordsPerCell;
  }, [maxRecordsPerCell]);

  /**
   * 単一セルの変更を記録
   */
  const recordCellChange = useCallback(
    (
      update: ShiftCellUpdate,
      changedBy: string,
      changedByName: string,
      source: CellChangeSource,
      operationId?: string,
    ) => {
      const cellKey = buildCellKey(update.staffId, update.date);
      const record: CellChangeRecord = {
        id: createRecordId(),
        cellKey,
        staffId: update.staffId,
        date: update.date,
        previousState: update.previousState,
        newState: update.newState,
        previousLocked: update.previousLocked,
        newLocked: update.isLocked,
        changedBy,
        changedByName,
        changedAt: Date.now(),
        source,
        operationId,
      };

      setHistoryMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(cellKey) ?? [];
        const updated = [...existing, record];

        // セルごとの上限を適用
        next.set(
          cellKey,
          updated.length > maxRef.current
            ? updated.slice(updated.length - maxRef.current)
            : updated,
        );
        return next;
      });

      return record;
    },
    [],
  );

  /**
   * 複数セルの変更を一括記録（一括操作用）
   */
  const recordBatchCellChanges = useCallback(
    (
      updates: ShiftCellUpdate[],
      changedBy: string,
      changedByName: string,
      source: CellChangeSource,
    ) => {
      const operationId = createRecordId();
      const now = Date.now();

      const records: CellChangeRecord[] = updates.map((update) => ({
        id: createRecordId(),
        cellKey: buildCellKey(update.staffId, update.date),
        staffId: update.staffId,
        date: update.date,
        previousState: update.previousState,
        newState: update.newState,
        previousLocked: update.previousLocked,
        newLocked: update.isLocked,
        changedBy,
        changedByName,
        changedAt: now,
        source,
        operationId,
      }));

      setHistoryMap((prev) => {
        const next = new Map(prev);
        for (const record of records) {
          const existing = next.get(record.cellKey) ?? [];
          const updated = [...existing, record];
          next.set(
            record.cellKey,
            updated.length > maxRef.current
              ? updated.slice(updated.length - maxRef.current)
              : updated,
          );
        }
        return next;
      });

      return { operationId, records };
    },
    [],
  );

  /**
   * リモート更新を記録（Subscription 経由の変更）
   */
  const recordRemoteChange = useCallback(
    (
      staffId: string,
      date: string,
      previousState: ShiftState | undefined,
      newState: ShiftState | undefined,
      changedBy: string,
      changedByName: string,
    ) => {
      const cellKey = buildCellKey(staffId, date);
      const record: CellChangeRecord = {
        id: createRecordId(),
        cellKey,
        staffId,
        date,
        previousState,
        newState,
        changedBy,
        changedByName,
        changedAt: Date.now(),
        source: "remote",
      };

      setHistoryMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(cellKey) ?? [];
        const updated = [...existing, record];
        next.set(
          cellKey,
          updated.length > maxRef.current
            ? updated.slice(updated.length - maxRef.current)
            : updated,
        );
        return next;
      });

      return record;
    },
    [],
  );

  /**
   * 特定セルの変更履歴を取得（新しい順）
   */
  const getCellHistory = useCallback(
    (cellKey: string): readonly CellChangeRecord[] => {
      const records = historyMap.get(cellKey) ?? [];
      return records.toReversed();
    },
    [historyMap],
  );

  /**
   * 全セルの変更履歴を新しい順で取得
   */
  const getAllCellHistory = useCallback((): readonly CellChangeRecord[] => {
    const all: CellChangeRecord[] = [];
    for (const records of historyMap.values()) {
      all.push(...records);
    }
    return all.toSorted((a, b) => b.changedAt - a.changedAt);
  }, [historyMap]);

  /**
   * 特定スタッフの全セル変更履歴を取得
   */
  const getStaffCellHistory = useCallback(
    (staffId: string): readonly CellChangeRecord[] => {
      const results: CellChangeRecord[] = [];
      for (const [key, records] of historyMap) {
        if (key.startsWith(`${staffId}#`)) {
          results.push(...records);
        }
      }
      return results.toSorted((a, b) => b.changedAt - a.changedAt);
    },
    [historyMap],
  );

  /**
   * DB 取得済みのレコード配列でヒストリを初期化する。
   * セッション中に既に記録がある場合は何もしない（初回ロード専用）。
   */
  const seedHistory = useCallback((records: CellChangeRecord[]) => {
    setHistoryMap(() => {
      const next = new Map<string, CellChangeRecord[]>();
      for (const record of records) {
        const existing = next.get(record.cellKey) ?? [];
        next.set(record.cellKey, [...existing, record]);
      }
      return next;
    });
  }, []);

  /**
   * 変更履歴をクリア
   */
  const clearCellHistory = useCallback(() => {
    setHistoryMap(new Map());
  }, []);

  return {
    historyMap,
    recordCellChange,
    recordBatchCellChanges,
    recordRemoteChange,
    seedHistory,
    getCellHistory,
    getAllCellHistory,
    getStaffCellHistory,
    clearCellHistory,
  };
};
