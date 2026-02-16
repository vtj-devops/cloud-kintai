import { act, renderHook } from "@testing-library/react";

import { ShiftCellUpdate } from "../types/collaborative.types";
import { useUndoRedo } from "./useUndoRedo";

describe("useUndoRedo", () => {
  const mockUpdate: ShiftCellUpdate = {
    staffId: "staff1",
    date: "2025-01-15",
    newState: "work",
  };

  const mockUpdate2: ShiftCellUpdate = {
    staffId: "staff2",
    date: "2025-01-16",
    newState: "fixedOff",
  };

  describe("履歴の記録", () => {
    it("新しい変更を履歴に追加できる", () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoStackSize).toBe(1);
      expect(result.current.canRedo).toBe(false);
    });

    it("複数の変更を履歴に追加できる", () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Update 1");
        result.current.pushHistory([mockUpdate2], "Update 2");
      });

      expect(result.current.undoStackSize).toBe(2);
    });

    it("履歴の上限（50件）を超えると古いものから削除される", () => {
      const { result } = renderHook(() => useUndoRedo({ maxHistorySize: 5 }));

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.pushHistory([mockUpdate], `Update ${i}`);
        }
      });

      expect(result.current.undoStackSize).toBe(5);
    });

    it("新しい変更を追加するとやり直しスタックがクリアされる", () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Update 1");
        result.current.undo();
        result.current.pushHistory([mockUpdate2], "Update 2");
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoStackSize).toBe(0);
    });
  });

  describe("取り消し", () => {
    it("取り消しを実行できる", async () => {
      const onUndo = jest.fn();
      const { result } = renderHook(() => useUndoRedo({ onUndo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
      });

      await act(async () => {
        const success = await result.current.undo();
        expect(success).toBe(true);
      });

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("履歴が空の場合は取り消しできない", async () => {
      const { result } = renderHook(() => useUndoRedo());

      await act(async () => {
        const success = await result.current.undo();
        expect(success).toBe(false);
      });

      expect(result.current.canUndo).toBe(false);
    });

    it("複数の取り消しを実行できる", async () => {
      const onUndo = jest.fn();
      const { result } = renderHook(() => useUndoRedo({ onUndo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Update 1");
        result.current.pushHistory([mockUpdate2], "Update 2");
      });

      await act(async () => {
        await result.current.undo();
        await result.current.undo();
      });

      expect(onUndo).toHaveBeenCalledTimes(2);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.redoStackSize).toBe(2);
    });

    it("getLastUndoで最後の取り消し可能な操作を取得できる", () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
      });

      const lastUndo = result.current.getLastUndo();
      expect(lastUndo).not.toBeNull();
      expect(lastUndo?.description).toBe("Test update");
    });
  });

  describe("やり直し", () => {
    it("やり直しを実行できる", async () => {
      const onRedo = jest.fn();
      const { result } = renderHook(() => useUndoRedo({ onRedo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
      });

      await act(async () => {
        await result.current.undo();
      });

      await act(async () => {
        const success = await result.current.redo();
        expect(success).toBe(true);
      });

      expect(onRedo).toHaveBeenCalledTimes(1);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });

    it("やり直しスタックが空の場合はやり直しできない", async () => {
      const { result } = renderHook(() => useUndoRedo());

      await act(async () => {
        const success = await result.current.redo();
        expect(success).toBe(false);
      });

      expect(result.current.canRedo).toBe(false);
    });

    it("複数のやり直しを実行できる", async () => {
      const onRedo = jest.fn();
      const { result } = renderHook(() => useUndoRedo({ onRedo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Update 1");
        result.current.pushHistory([mockUpdate2], "Update 2");
      });

      await act(async () => {
        await result.current.undo();
        await result.current.undo();
      });

      await act(async () => {
        await result.current.redo();
        await result.current.redo();
      });

      expect(onRedo).toHaveBeenCalledTimes(2);
      expect(result.current.undoStackSize).toBe(2);
      expect(result.current.canRedo).toBe(false);
    });

    it("getLastRedoで最後のやり直し可能な操作を取得できる", async () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
      });

      await act(async () => {
        await result.current.undo();
      });

      const lastRedo = result.current.getLastRedo();
      expect(lastRedo).not.toBeNull();
      expect(lastRedo?.description).toBe("Test update");
    });
  });

  describe("履歴のクリア", () => {
    it("履歴をクリアできる", () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.pushHistory([mockUpdate], "Update 1");
        result.current.pushHistory([mockUpdate2], "Update 2");
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoStackSize).toBe(0);
      expect(result.current.redoStackSize).toBe(0);
    });
  });

  describe("処理中フラグ", () => {
    it("取り消し実行中は処理中フラグがtrueになる", async () => {
      let resolveUndo: () => void;
      const undoDeferred = new Promise<void>((resolve) => {
        resolveUndo = resolve;
      });
      const onUndo = jest.fn(() => undoDeferred);
      const { result } = renderHook(() => useUndoRedo({ onUndo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
        result.current.pushHistory([mockUpdate2], "Test update 2");
      });

      let undoActionPromise: Promise<boolean> | undefined;

      // 取り消しを開始（完了は待たない）
      await act(async () => {
        undoActionPromise = result.current.undo();
        await Promise.resolve();
      });

      // 処理中の間は新しい取り消しができない
      await act(async () => {
        const success = await result.current.undo();
        expect(success).toBe(false);
      });

      // 取り消しを完了させる
      resolveUndo!();

      // 取り消し完了を待つ
      await act(async () => {
        await undoActionPromise;
      });

      // 完了後は再度取り消し可能
      expect(result.current.canUndo).toBe(true);
    });

    it("やり直し実行中は処理中フラグがtrueになる", async () => {
      let resolveRedo: () => void;
      const redoDeferred = new Promise<void>((resolve) => {
        resolveRedo = resolve;
      });
      const onRedo = jest.fn(() => redoDeferred);
      const { result } = renderHook(() => useUndoRedo({ onRedo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
        result.current.pushHistory([mockUpdate2], "Test update 2");
      });

      await act(async () => {
        await result.current.undo();
      });

      let redoActionPromise: Promise<boolean> | undefined;

      // やり直しを開始（完了は待たない）
      await act(async () => {
        redoActionPromise = result.current.redo();
        await Promise.resolve();
      });

      // 処理中の間は新しいやり直しができない
      await act(async () => {
        const success = await result.current.redo();
        expect(success).toBe(false);
      });

      // やり直しを完了させる
      resolveRedo!();

      // やり直し完了を待つ
      await act(async () => {
        await redoActionPromise;
      });

      // 完了後は取り消し可能
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("エラーハンドリング", () => {
    it("取り消し失敗時はスタックを元に戻す", async () => {
      const onUndo = jest.fn(() => Promise.reject(new Error("Test error")));
      const { result } = renderHook(() => useUndoRedo({ onUndo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
        result.current.pushHistory([mockUpdate2], "Test update 2");
      });

      const originalUndoStackSize = result.current.undoStackSize;
      const originalRedoStackSize = result.current.redoStackSize;

      await act(async () => {
        const success = await result.current.undo();
        expect(success).toBe(false);
      });

      // エラー時はスタックが元に戻る
      expect(result.current.undoStackSize).toBe(originalUndoStackSize);
      expect(result.current.redoStackSize).toBe(originalRedoStackSize);
    });

    it("やり直し失敗時はスタックを元に戻す", async () => {
      const onRedo = jest.fn(() => Promise.reject(new Error("Test error")));
      const { result } = renderHook(() => useUndoRedo({ onRedo }));

      act(() => {
        result.current.pushHistory([mockUpdate], "Test update");
        result.current.pushHistory([mockUpdate2], "Test update 2");
      });

      await act(async () => {
        await result.current.undo();
      });

      const originalUndoStackSize = result.current.undoStackSize;
      const originalRedoStackSize = result.current.redoStackSize;

      await act(async () => {
        const success = await result.current.redo();
        expect(success).toBe(false);
      });

      // エラー時はスタックが元に戻る
      expect(result.current.undoStackSize).toBe(originalUndoStackSize);
      expect(result.current.redoStackSize).toBe(originalRedoStackSize);
    });
  });
});
