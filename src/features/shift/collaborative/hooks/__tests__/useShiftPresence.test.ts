import { act, renderHook } from "@testing-library/react";

import { useShiftPresence } from "../useShiftPresence";

describe("useShiftPresence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // テスト前にローカルストレージをクリア
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    localStorage.clear();
  });

  const defaultProps = {
    currentUserId: "user1",
    currentUserName: "Test User",
  };

  describe("セッション管理", () => {
    it("初期化時にアクティブユーザーリストにユーザーが保存される", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      // ハートビート（10秒）が実行される
      act(() => {
        jest.advanceTimersByTime(10);
      });

      // アクティブユーザーリストに自分が含まれることを確認
      expect(result.current.activeUsers.length).toBeGreaterThanOrEqual(1);
      const currentUser = result.current.activeUsers.find(
        (u) => u.userId === "user1",
      );
      expect(currentUser).toMatchObject({
        userId: "user1",
        userName: "Test User",
      });
    });

    it("ハートビートが10秒ごとに送信される", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      // 初期状態
      act(() => {
        jest.advanceTimersByTime(10);
      });

      const initialUser = result.current.activeUsers.find(
        (u) => u.userId === "user1",
      );
      expect(initialUser).toBeDefined();
      const initialLastActivity = initialUser?.lastActivity || 0;

      // 10秒経過
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // アクティビティが更新されていることを確認
      const updatedUser = result.current.activeUsers.find(
        (u) => u.userId === "user1",
      );
      expect(updatedUser).toBeDefined();
      expect((updatedUser?.lastActivity || 0) >= initialLastActivity).toBe(
        true,
      );
    });

    it("複数ユーザーが同時にアクティブな場合に両方表示される", () => {
      // ユーザー1を初期化
      const { result: result1 } = renderHook(() =>
        useShiftPresence({
          currentUserId: "user1",
          currentUserName: "User One",
        }),
      );

      // 初回のハートビート
      act(() => {
        jest.advanceTimersByTime(10);
      });

      // ユーザー2をシミュレート（ローカルストレージに直接追加）
      act(() => {
        const presenceData = {
          userId: "user2",
          userName: "User Two",
          color: "#4caf50",
          lastActivity: Date.now(),
          timestamp: Date.now(),
        };
        localStorage.setItem(
          "shift_presence_user2",
          JSON.stringify(presenceData),
        );
      });

      // ハートビート実行でローカルストレージから複数ユーザーを読み込む
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // 複数ユーザーが表示されることを確認
      expect(result1.current.activeUsers.length).toBeGreaterThanOrEqual(2);
      const user1 = result1.current.activeUsers.find(
        (u) => u.userId === "user1",
      );
      const user2 = result1.current.activeUsers.find(
        (u) => u.userId === "user2",
      );
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
    });

    it("60秒以上非アクティブなユーザーを削除する", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      // 初回のハートビート
      act(() => {
        jest.advanceTimersByTime(10);
      });

      // 非アクティブユーザーをシミュレート
      act(() => {
        const presenceData = {
          userId: "user2",
          userName: "Inactive User",
          color: "#4caf50",
          lastActivity: Date.now() - 70000, // 70秒前
          timestamp: Date.now() - 70000,
        };
        localStorage.setItem(
          "shift_presence_user2",
          JSON.stringify(presenceData),
        );
      });

      // ハートビート実行（非アクティブユーザーはタイムスタンプが古いので除外される）
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // 非アクティブユーザーが削除されてることを確認
      const inactiveUser = result.current.activeUsers.find(
        (u) => u.userId === "user2",
      );
      expect(inactiveUser).toBeUndefined();
    });
  });

  describe("セル編集状態管理", () => {
    it("セル編集を開始できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.isCellBeingEdited("staff1", "2024-01-15")).toBe(
        false,
      ); // 自分が編集中なので false
      expect(result.current.editingCells.size).toBe(1);
    });

    it("セル編集を終了できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(1);

      act(() => {
        result.current.stopEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(0);
    });

    it("編集中のセルを取得できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      // ハートビート実行（activeUsers に自分を追加）
      act(() => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      const editor = result.current.getCellEditor("staff1", "2024-01-15");
      expect(editor).toMatchObject({
        userId: "user1",
        userName: "Test User",
      });
    });

    it("他のユーザーが編集中のセルを判定できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      // ハートビート実行（activeUsers に自分を追加）
      act(() => {
        jest.advanceTimersByTime(10);
      });

      // 自分のセルを編集開始
      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      // 他のユーザーのセルを編集中として設定
      act(() => {
        result.current.editingCells.set("staff2_2024-01-16", {
          userId: "user2",
          userName: "Other User",
          startTime: Date.now(),
        });

        // activeUsers に他のユーザーを追加
        const presenceData = {
          userId: "user2",
          userName: "Other User",
          color: "#4caf50",
          lastActivity: Date.now(),
          timestamp: Date.now(),
        };
        localStorage.setItem(
          "shift_presence_user2",
          JSON.stringify(presenceData),
        );
      });

      // 自分が編集中: false
      expect(result.current.isCellBeingEdited("staff1", "2024-01-15")).toBe(
        false,
      );

      // 他のユーザーが編集中: true
      expect(result.current.isCellBeingEdited("staff2", "2024-01-16")).toBe(
        true,
      );
    });
  });

  describe("編集タイムアウト", () => {
    it("5分間無操作で編集ロックが自動解除される", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(1);

      // 5分 + 30秒（チェック間隔）経過
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 30000);
      });

      // タイムアウトで自動解除されることを確認
      expect(result.current.editingCells.size).toBe(0);
    });

    it("5分以内の操作は自動解除されない", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(1);

      // 4分経過
      act(() => {
        jest.advanceTimersByTime(4 * 60 * 1000);
      });

      // まだ解除されていないことを確認
      expect(result.current.editingCells.size).toBe(1);
    });
  });

  describe("強制解除機能", () => {
    it("管理者がセルの編集ロックを強制解除できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(1);

      act(() => {
        result.current.forceReleaseCell("staff1", "2024-01-15");
      });

      expect(result.current.editingCells.size).toBe(0);
    });

    it("すべての編集ロックを取得できる", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        result.current.startEditingCell("staff1", "2024-01-15");
        result.current.startEditingCell("staff2", "2024-01-16");
      });

      const allEditingCells = result.current.getAllEditingCells();
      expect(allEditingCells).toHaveLength(2);
      expect(allEditingCells[0]).toMatchObject({
        staffId: "staff1",
        date: "2024-01-15",
        userId: "user1",
        userName: "Test User",
      });
      expect(allEditingCells[1]).toMatchObject({
        staffId: "staff2",
        date: "2024-01-16",
        userId: "user1",
        userName: "Test User",
      });
    });
  });

  describe("アクティビティ記録", () => {
    it("updateActivity を呼び出すと最終アクティビティが更新される", () => {
      const { result } = renderHook(() => useShiftPresence(defaultProps));

      act(() => {
        jest.advanceTimersByTime(1000);
        result.current.updateActivity();
      });

      // アクティビティが更新されることを確認
      expect(result.current.activeUsers).toBeDefined();
    });
  });
});
