import { act, renderHook } from "@testing-library/react";

import type { CellChangeRecord } from "../../types/collaborative.types";
import { useCellChangeHistory } from "../useCellChangeHistory";

const makeDbRecord = (
  staffId: string,
  date: string,
  changedAt: number,
  overrides: Partial<CellChangeRecord> = {},
): CellChangeRecord => ({
  id: `db-${staffId}-${date}-${changedAt}`,
  cellKey: `${staffId}#${date}`,
  staffId,
  date,
  changedBy: "admin",
  changedByName: "管理者",
  changedAt,
  source: "db-history",
  ...overrides,
});

describe("useCellChangeHistory", () => {
  describe("seedHistory", () => {
    it("既存のセッション内レコードを保持したまま DB レコードをマージする", () => {
      const { result } = renderHook(() => useCellChangeHistory());

      // 1. manual レコードを追加
      act(() => {
        result.current.recordCellChange(
          { staffId: "staff-1", date: "01", newState: "work" },
          "user-1",
          "ユーザー1",
          "manual",
        );
      });

      // 2. seedHistory で DB レコードを追加
      const dbRecord = makeDbRecord("staff-1", "01", Date.now() - 5000);
      act(() => {
        result.current.seedHistory([dbRecord]);
      });

      // 3. manual レコードが消えていないことを確認
      const records = result.current.historyMap.get("staff-1#01") ?? [];
      const manualRecords = records.filter((r) => r.source === "manual");
      expect(manualRecords).toHaveLength(1);

      // 4. db-history レコードも存在することを確認
      const dbRecords = records.filter((r) => r.source === "db-history");
      expect(dbRecords).toHaveLength(1);
      expect(dbRecords[0].id).toBe(dbRecord.id);
    });

    it("空の historyMap に DB レコードをシードできる", () => {
      const { result } = renderHook(() => useCellChangeHistory());

      const dbRecord = makeDbRecord("staff-2", "05", Date.now() - 3000);
      act(() => {
        result.current.seedHistory([dbRecord]);
      });

      const records = result.current.historyMap.get("staff-2#05") ?? [];
      expect(records).toHaveLength(1);
      expect(records[0].source).toBe("db-history");
      expect(records[0].id).toBe(dbRecord.id);
    });
  });

  describe("mergeHistoryRecords", () => {
    it("新しい db-history レコードを historyMap に追加する", () => {
      const { result } = renderHook(() => useCellChangeHistory());

      const dbRecord = makeDbRecord("staff-3", "10", Date.now() - 10000);
      act(() => {
        result.current.mergeHistoryRecords([dbRecord]);
      });

      const records = result.current.historyMap.get("staff-3#10") ?? [];
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe(dbRecord.id);
    });

    it("±60秒以内に同じ cellKey の db-history レコードが既にある場合は重複追加しない", () => {
      const { result } = renderHook(() => useCellChangeHistory());

      const baseTimestamp = Date.now() - 30000;
      const firstRecord = makeDbRecord("staff-4", "15", baseTimestamp);

      // 初回 seedHistory で追加
      act(() => {
        result.current.seedHistory([firstRecord]);
      });

      // ±60秒以内（30秒後）の同一セルの db-history レコードで mergeHistoryRecords
      const nearDuplicateRecord = makeDbRecord(
        "staff-4",
        "15",
        baseTimestamp + 30_000, // 30秒後 → ±60秒以内
        { id: "db-near-duplicate" },
      );
      act(() => {
        result.current.mergeHistoryRecords([nearDuplicateRecord]);
      });

      // 重複追加されていないことを確認（1件のまま）
      const records = result.current.historyMap.get("staff-4#15") ?? [];
      const dbRecords = records.filter((r) => r.source === "db-history");
      expect(dbRecords).toHaveLength(1);
    });

    it("manual レコードが存在しても db-history レコードを追加できる", () => {
      const { result } = renderHook(() => useCellChangeHistory());

      // manual レコードを先に追加
      act(() => {
        result.current.recordCellChange(
          { staffId: "staff-5", date: "20", newState: "fixedOff" },
          "user-1",
          "ユーザー1",
          "manual",
        );
      });

      // db-history レコードを mergeHistoryRecords で追加
      const dbRecord = makeDbRecord("staff-5", "20", Date.now() - 90_000); // 90秒前 → ±60秒外
      act(() => {
        result.current.mergeHistoryRecords([dbRecord]);
      });

      const records = result.current.historyMap.get("staff-5#20") ?? [];
      expect(records.filter((r) => r.source === "manual")).toHaveLength(1);
      expect(records.filter((r) => r.source === "db-history")).toHaveLength(1);
    });
  });
});
