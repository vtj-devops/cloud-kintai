import { act, renderHook } from "@testing-library/react";

import { useAutoSave } from "../useAutoSave";

// ─────────────────────────────────────────────────────────────
// useAutoSave の挙動メモ
//
// useEffect([data, delay, enabled, isEqual]) が実行されるとき:
//   1回目（mount）: isFirstRenderRef=true → 早期リターン（baseline 設定）
//   2回目（data 変更）: isFirstEnabledRef=true → 早期リターン（baseline 更新）
//   3回目以降（data 再変更）: データ差分を検出 → timer セット → delay 後に保存
//
// そのため「保存が発生するテスト」は
//   rerender(step1) → rerender(step2) → advanceTimersByTime
// の順で書く。
// ─────────────────────────────────────────────────────────────

describe("useAutoSave", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────
  // 保存しないケース
  // ───────────────────────────────────────
  describe("保存が発生しないケース", () => {
    it("初回マウント時（isFirstRender）は保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      renderHook(() => useAutoSave({ saveFn, data: "initial", delay: 500 }));

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });

    it("最初の data 変更（isFirstEnabled baseline 設定）は保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "initial" } },
      );

      rerender({ data: "step1" }); // isFirstEnabled → skip

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });

    it("データが変わっていない場合は保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "same" } },
      );

      rerender({ data: "step1" }); // baseline
      rerender({ data: "step1" }); // 同じ値 → 変更なし

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });

    it("enabled=false のとき保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data, enabled }) => useAutoSave({ saveFn, data, enabled, delay: 500 }),
        { initialProps: { data: "initial", enabled: false } },
      );

      rerender({ data: "step1", enabled: false });
      rerender({ data: "step2", enabled: false });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });

    it("アンマウント時にタイマーがクリアされ保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender, unmount } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "initial" } },
      );

      rerender({ data: "step1" }); // baseline
      rerender({ data: "step2" }); // timer セット
      unmount(); // タイマークリア

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────
  // 保存が発生するケース
  // ───────────────────────────────────────
  describe("保存が発生するケース", () => {
    it("delay 経過後に saveFn が最新データで呼ばれる", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "initial" } },
      );

      rerender({ data: "step1" }); // baseline
      rerender({ data: "step2" }); // timer セット

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve(); // flush async
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith("step2");
    });

    it("delay 前に再変更した場合、debounce されて最終データのみ保存される", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "initial" } },
      );

      rerender({ data: "step1" }); // baseline
      rerender({ data: "step2" }); // timer セット（500ms）

      act(() => {
        jest.advanceTimersByTime(200); // まだ発火しない
      });

      rerender({ data: "step3" }); // timer リセット

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith("step3");
    });

    it("saveNow を呼ぶと即座に保存される", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "current", delay: 5000 }),
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith("current");
    });
  });

  // ───────────────────────────────────────
  // 状態（isSaving / isPending / lastSavedAt / lastError）
  // ───────────────────────────────────────
  describe("返却状態", () => {
    it("初期状態: isSaving=false, isPending=false, lastSavedAt=null, lastError=null", () => {
      const { result } = renderHook(() =>
        useAutoSave({ saveFn: jest.fn(), data: "x" }),
      );

      expect(result.current.isSaving).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.lastError).toBeNull();
    });

    it("data 変更後 delay 前は isPending=true になる", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, delay: 500 }),
        { initialProps: { data: "initial" } },
      );

      rerender({ data: "step1" }); // baseline
      rerender({ data: "step2" }); // isPending セット

      expect(result.current.isPending).toBe(true);
    });

    it("保存中は isSaving=true になり、完了後に false に戻る", async () => {
      let resolvePromise!: () => void;
      const saveFn = jest.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
      );
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x" }),
      );

      // saveNow を開始（awaitしない）
      act(() => {
        void result.current.saveNow();
      });
      expect(result.current.isSaving).toBe(true);

      // Promise を解決
      await act(async () => {
        resolvePromise();
        await Promise.resolve();
      });
      expect(result.current.isSaving).toBe(false);
    });

    it("保存成功後に lastSavedAt が Date に更新される", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x" }),
      );

      expect(result.current.lastSavedAt).toBeNull();

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });

    it("保存失敗後に lastError が設定される", async () => {
      const error = new Error("save failed");
      const saveFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x" }),
      );

      await act(async () => {
        await result.current.saveNow().catch(() => undefined);
      });

      expect(result.current.lastError).toEqual(error);
    });
  });

  // ───────────────────────────────────────
  // コールバック
  // ───────────────────────────────────────
  describe("コールバック", () => {
    it("保存成功時に onSaveSuccess が呼ばれる", async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      const onSaveSuccess = jest.fn();
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x", onSaveSuccess }),
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    });

    it("保存失敗時に onSaveError が呼ばれる", async () => {
      const error = new Error("fail");
      const saveFn = jest.fn().mockRejectedValue(error);
      const onSaveError = jest.fn();
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x", onSaveError }),
      );

      await act(async () => {
        await result.current.saveNow().catch(() => undefined);
      });

      expect(onSaveError).toHaveBeenCalledTimes(1);
      expect(onSaveError).toHaveBeenCalledWith(error);
    });

    it("Error 以外のエラーも Error に包んで onSaveError に渡す", async () => {
      const saveFn = jest.fn().mockRejectedValue("string-error");
      const onSaveError = jest.fn();
      const { result } = renderHook(() =>
        useAutoSave({ saveFn, data: "x", onSaveError }),
      );

      await act(async () => {
        await result.current.saveNow().catch(() => undefined);
      });

      expect(onSaveError).toHaveBeenCalledWith(expect.any(Error));
      expect(onSaveError.mock.calls[0][0].message).toBe("string-error");
    });
  });

  // ───────────────────────────────────────
  // カスタム isEqual
  // ───────────────────────────────────────
  describe("isEqual オプション", () => {
    it("カスタム isEqual が等値と判定すれば保存されない", () => {
      const saveFn = jest.fn().mockResolvedValue(undefined);
      // 常に等値と判定するカスタム比較関数
      const alwaysEqual = jest.fn().mockReturnValue(true);
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ saveFn, data, isEqual: alwaysEqual, delay: 500 }),
        { initialProps: { data: { v: 1 } } },
      );

      rerender({ data: { v: 2 } }); // baseline
      rerender({ data: { v: 3 } }); // alwaysEqual=true → skip

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(saveFn).not.toHaveBeenCalled();
    });
  });
});
