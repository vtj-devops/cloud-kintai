import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { act, renderHook, waitFor } from "@testing-library/react";

import useCloseDates from "../useCloseDates";

// ---------------------------------------------------------------------------
// Mock CRUD modules
// ---------------------------------------------------------------------------
const fetchCloseDatesMock = jest.fn();
const createCloseDateDataMock = jest.fn();
const updateCloseDateDataMock = jest.fn();
const deleteCloseDateDataMock = jest.fn();

jest.mock("../closeDates/fetchCloseDates", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchCloseDatesMock(...args),
}));

jest.mock("../closeDates/createCloseDateData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => createCloseDateDataMock(...args),
}));

jest.mock("../closeDates/updateCloseDateData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => updateCloseDateDataMock(...args),
}));

jest.mock("../closeDates/deleteCloseDateData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => deleteCloseDateDataMock(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeCloseDate = (overrides = {}) => ({
  id: "date-1",
  closeDate: "2024-01-31",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  version: 1,
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useCloseDates", () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 各テストごとに新しいモックを作成してサブスクリプション呼び出しに対応
    mockUnsubscribe = jest.fn();
    (graphqlClient.graphql as jest.Mock).mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
    });
  });

  // -------------------------------------------------------------------------
  // 初期ロード
  // -------------------------------------------------------------------------
  it("マウント時に closeDates を取得して loading が false になる", async () => {
    const mockDates = [makeCloseDate()];
    fetchCloseDatesMock.mockResolvedValue(mockDates);

    const { result } = renderHook(() => useCloseDates());

    // 初期状態は loading = true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.closeDates).toEqual(mockDates);
    expect(result.current.error).toBeNull();
  });

  it("取得に失敗したとき error をセットして closeDates は空配列のまま", async () => {
    const mockError = new Error("Fetch failed");
    fetchCloseDatesMock.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCloseDates());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.closeDates).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // createCloseDate
  // -------------------------------------------------------------------------
  it("createCloseDate 成功時に closeDates へ追加する", async () => {
    fetchCloseDatesMock.mockResolvedValue([]);
    const newDate = makeCloseDate({ id: "new-1" });
    createCloseDateDataMock.mockResolvedValue(newDate);

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await result.current.createCloseDate({} as any);
    });

    expect(result.current.closeDates).toContainEqual(newDate);
  });

  it("createCloseDate 失敗時に例外をスローし closeDates は変化しない", async () => {
    fetchCloseDatesMock.mockResolvedValue([]);
    createCloseDateDataMock.mockRejectedValue(new Error("Create failed"));

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await result.current.createCloseDate({} as any);
      }),
    ).rejects.toThrow("Create failed");

    expect(result.current.closeDates).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // deleteCloseDate
  // -------------------------------------------------------------------------
  it("deleteCloseDate 成功時に対象 id のアイテムを closeDates から削除する", async () => {
    const existing = makeCloseDate({ id: "del-1" });
    fetchCloseDatesMock.mockResolvedValue([existing]);
    deleteCloseDateDataMock.mockResolvedValue(existing);

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.closeDates).toHaveLength(1));

    await act(async () => {
      await result.current.deleteCloseDate({ id: "del-1" });
    });

    expect(result.current.closeDates).toHaveLength(0);
  });

  it("deleteCloseDate 失敗時に例外をスローし closeDates は変化しない", async () => {
    const existing = makeCloseDate({ id: "del-1" });
    fetchCloseDatesMock.mockResolvedValue([existing]);
    deleteCloseDateDataMock.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.closeDates).toHaveLength(1));

    await expect(
      act(async () => {
        await result.current.deleteCloseDate({ id: "del-1" });
      }),
    ).rejects.toThrow("Delete failed");

    expect(result.current.closeDates).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // updateCloseDate
  // -------------------------------------------------------------------------
  it("updateCloseDate 成功時に対象アイテムを closeDates 内で置き換える", async () => {
    const existing = makeCloseDate({ id: "upd-1" });
    const updated = makeCloseDate({
      id: "upd-1",
      closeDate: "2024-01-28",
      endDate: "2024-01-28",
      version: 2,
    });
    fetchCloseDatesMock.mockResolvedValue([existing]);
    updateCloseDateDataMock.mockResolvedValue(updated);

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.closeDates).toHaveLength(1));

    await act(async () => {
      await result.current.updateCloseDate({
        id: "upd-1",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    expect(result.current.closeDates[0]).toEqual(updated);
  });

  it("updateCloseDate は version + 1 を input に含めて呼び出す", async () => {
    const existing = makeCloseDate({ id: "upd-1", version: 3 });
    const updated = makeCloseDate({ id: "upd-1", version: 4 });
    fetchCloseDatesMock.mockResolvedValue([existing]);
    updateCloseDateDataMock.mockResolvedValue(updated);

    const { result } = renderHook(() => useCloseDates());
    await waitFor(() => expect(result.current.closeDates).toHaveLength(1));

    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await result.current.updateCloseDate({ id: "upd-1" } as any);
    });

    expect(updateCloseDateDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ version: 4 }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // サブスクリプション
  // -------------------------------------------------------------------------
  it("アンマウント時に 3 つのサブスクリプションがすべてアンサブスクライブされる", async () => {
    fetchCloseDatesMock.mockResolvedValue([]);

    const { unmount } = renderHook(() => useCloseDates());
    await waitFor(() => expect(fetchCloseDatesMock).toHaveBeenCalled());

    unmount();

    // create / update / delete の 3 つ
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
  });
});
