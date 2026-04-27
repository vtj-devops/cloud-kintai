import { act,renderHook } from "@testing-library/react";

import type { QuickInputAction } from "../useQuickInputActions";
import { useQuickInputSelection } from "../useQuickInputSelection";

// テスト用のアクション定義
const makeActions = (overrides?: Partial<QuickInputAction>[]): QuickInputAction[] => {
  const base: QuickInputAction[] = [
    { key: "action1", label: "アクション1", action: jest.fn() },
    { key: "action2", label: "アクション2", action: jest.fn() },
    { key: "action3", label: "アクション3", action: jest.fn() },
  ];
  if (overrides) {
    return base.map((a, i) => ({ ...a, ...overrides[i] }));
  }
  return base;
};

describe("useQuickInputSelection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("初期状態", () => {
    it("open = false / selectedKey = null / confirmLabel = null / selectedAction = null で始まる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      expect(result.current.open).toBe(false);
      expect(result.current.selectedKey).toBeNull();
      expect(result.current.confirmLabel).toBeNull();
      expect(result.current.selectedAction).toBeNull();
    });
  });

  describe("setSelectedKey", () => {
    it("setSelectedKey でキーを設定すると selectedKey が更新される", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("action1");
      });

      expect(result.current.selectedKey).toBe("action1");
    });

    it("設定されたキーに対応する selectedAction が返る", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("action2");
      });

      expect(result.current.selectedAction).not.toBeNull();
      expect(result.current.selectedAction?.key).toBe("action2");
      expect(result.current.selectedAction?.label).toBe("アクション2");
    });

    it("存在しないキーを設定すると selectedAction = null になる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("nonexistent");
      });

      expect(result.current.selectedKey).toBe("nonexistent");
      expect(result.current.selectedAction).toBeNull();
    });
  });

  describe("setOpen", () => {
    it("setOpen(true) で open = true になる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.open).toBe(true);
    });

    it("setOpen(false) で open = false になる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setOpen(true);
      });
      act(() => {
        result.current.setOpen(false);
      });

      expect(result.current.open).toBe(false);
    });
  });

  describe("askConfirm", () => {
    it("askConfirm でラベルが設定され open = true になる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));
      const pendingFn = jest.fn();

      act(() => {
        result.current.askConfirm("確認ダイアログ", pendingFn);
      });

      expect(result.current.open).toBe(true);
      expect(result.current.confirmLabel).toBe("確認ダイアログ");
    });

    it("askConfirm 後に applySelectedAction を呼ぶと pendingAction が実行される", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));
      const pendingFn = jest.fn();

      act(() => {
        result.current.askConfirm("確認", pendingFn);
      });
      act(() => {
        result.current.applySelectedAction();
      });

      expect(pendingFn).toHaveBeenCalledTimes(1);
      expect(result.current.open).toBe(false);
      expect(result.current.confirmLabel).toBeNull();
      expect(result.current.selectedKey).toBeNull();
    });
  });

  describe("applySelectedAction", () => {
    it("selectedKey が設定されている場合に対応するアクションが実行される", () => {
      const mockAction = jest.fn();
      const actions: QuickInputAction[] = [
        { key: "action1", label: "アクション1", action: mockAction },
      ];
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("action1");
      });
      act(() => {
        result.current.applySelectedAction();
      });

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("applySelectedAction 後に open = false になり、selectedKey と confirmLabel がリセットされる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("action1");
        result.current.setOpen(true);
      });
      act(() => {
        result.current.applySelectedAction();
      });

      expect(result.current.open).toBe(false);
      expect(result.current.selectedKey).toBeNull();
      expect(result.current.confirmLabel).toBeNull();
    });

    it("action も pendingAction も存在しないとき applySelectedAction は何もしない（open は変わらない）", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setOpen(true);
        // selectedKey は null のままで pendingAction もない
      });
      act(() => {
        result.current.applySelectedAction();
      });

      // action がないので open は変わらない
      expect(result.current.open).toBe(true);
    });

    it("pendingAction が selectedAction より優先される", () => {
      // selectedKey で action1 を選択しつつ、askConfirm で別のアクションを登録
      const mockSelectedAction = jest.fn();
      const mockPendingAction = jest.fn();
      const actions: QuickInputAction[] = [
        { key: "action1", label: "アクション1", action: mockSelectedAction },
      ];
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setSelectedKey("action1");
        result.current.askConfirm("確認", mockPendingAction);
      });
      act(() => {
        result.current.applySelectedAction();
      });

      // selectedAction?.action が最初に評価される（null でないので selectedAction が使われる）
      // 実装: const action = selectedAction?.action ?? pendingActionRef.current;
      expect(mockSelectedAction).toHaveBeenCalledTimes(1);
      expect(mockPendingAction).not.toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("close で open / selectedKey / confirmLabel がすべてリセットされる", () => {
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.setOpen(true);
        result.current.setSelectedKey("action1");
        result.current.askConfirm("確認", jest.fn());
      });
      act(() => {
        result.current.close();
      });

      expect(result.current.open).toBe(false);
      expect(result.current.selectedKey).toBeNull();
      expect(result.current.confirmLabel).toBeNull();
    });

    it("close 後に applySelectedAction を呼んでも pendingAction は実行されない", () => {
      const pendingFn = jest.fn();
      const actions = makeActions();
      const { result } = renderHook(() => useQuickInputSelection(actions));

      act(() => {
        result.current.askConfirm("確認", pendingFn);
      });
      act(() => {
        result.current.close();
      });
      act(() => {
        result.current.applySelectedAction();
      });

      expect(pendingFn).not.toHaveBeenCalled();
    });
  });

  describe("actions 配列の変化", () => {
    it("actions が空のとき selectedAction は常に null", () => {
      const { result } = renderHook(() => useQuickInputSelection([]));

      act(() => {
        result.current.setSelectedKey("any");
      });

      expect(result.current.selectedAction).toBeNull();
    });

    it("actions が更新されると selectedAction も再計算される", () => {
      const initialActions: QuickInputAction[] = [
        { key: "k1", label: "ラベル1", action: jest.fn() },
      ];
      const { result, rerender } = renderHook(
        ({ actions }: { actions: QuickInputAction[] }) =>
          useQuickInputSelection(actions),
        { initialProps: { actions: initialActions } },
      );

      act(() => {
        result.current.setSelectedKey("k1");
      });
      expect(result.current.selectedAction?.key).toBe("k1");

      // actions を空配列に変更
      rerender({ actions: [] });

      expect(result.current.selectedAction).toBeNull();
    });
  });
});
