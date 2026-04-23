import { act, renderHook } from "@testing-library/react";

import fetchAdminOperationLogs from "../fetchOperationLogsAdmin";
import useAdminOperationLogs from "../useAdminOperationLogs";

jest.mock("../fetchOperationLogsAdmin", () => jest.fn());

const mockFetchLogs = fetchAdminOperationLogs as jest.Mock;

const makeLog = (overrides: Record<string, unknown> = {}) => ({
  __typename: "OperationLog" as const,
  id: "log-1",
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
  timestamp: "2024-01-15T10:00:00.000Z",
  action: "clock_in",
  staffId: "staff-1",
  resourceKey: "attendance#att-1",
  ...overrides,
});

describe("useAdminOperationLogs", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("loadInitial", () => {
    it("sets logs on success and clears loading", async () => {
      mockFetchLogs.mockResolvedValue({
        items: [makeLog()],
        nextToken: null,
        excludedInvalidRecords: false,
        excludedInvalidRecordCount: 0,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0].id).toBe("log-1");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets nextToken when provided", async () => {
      mockFetchLogs.mockResolvedValue({
        items: [makeLog()],
        nextToken: "token-123",
        excludedInvalidRecords: false,
        excludedInvalidRecordCount: 0,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.nextToken).toBe("token-123");
    });

    it("sorts logs newest-first by timestamp", async () => {
      const older = makeLog({
        id: "old",
        timestamp: "2024-01-10T08:00:00.000Z",
      });
      const newer = makeLog({
        id: "new",
        timestamp: "2024-01-15T10:00:00.000Z",
      });
      mockFetchLogs.mockResolvedValue({
        items: [older, newer],
        nextToken: null,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.logs[0].id).toBe("new");
      expect(result.current.logs[1].id).toBe("old");
    });

    it("falls back to createdAt for sorting when timestamp is null", async () => {
      const older = makeLog({
        id: "old",
        timestamp: null,
        createdAt: "2024-01-10T08:00:00.000Z",
      });
      const newer = makeLog({
        id: "new",
        timestamp: null,
        createdAt: "2024-01-15T10:00:00.000Z",
      });
      mockFetchLogs.mockResolvedValue({
        items: [older, newer],
        nextToken: null,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.logs[0].id).toBe("new");
    });

    it("returns the items from the response", async () => {
      const log = makeLog();
      mockFetchLogs.mockResolvedValue({
        items: [log],
        nextToken: null,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      let returned: unknown;
      await act(async () => {
        returned = await result.current.loadInitial();
      });

      expect(returned).toHaveLength(1);
    });

    it("sets excludedInvalidRecords and count from response", async () => {
      mockFetchLogs.mockResolvedValue({
        items: [makeLog()],
        nextToken: null,
        excludedInvalidRecords: true,
        excludedInvalidRecordCount: 3,
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(result.current.excludedInvalidRecords).toBe(true);
      expect(result.current.excludedInvalidRecordCount).toBe(3);
    });

    it("passes filter and initialLimit to fetchOperationLogs", async () => {
      mockFetchLogs.mockResolvedValue({
        items: [],
        nextToken: null,
      });

      const filter = { staffId: { eq: "staff-1" } };
      const { result } = renderHook(() => useAdminOperationLogs(50, filter));
      await act(async () => {
        await result.current.loadInitial();
      });

      expect(fetchAdminOperationLogs).toHaveBeenCalledWith(null, 50, filter);
    });

    it("sets error state and rethrows on failure", async () => {
      const error = new Error("Fetch failed");
      mockFetchLogs.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial().catch(() => {
          /* expected rejection */
        });
      });

      expect(result.current.error?.message).toBe("Fetch failed");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("loadMore", () => {
    it("returns empty array and skips fetch when nextToken is null", async () => {
      const { result } = renderHook(() => useAdminOperationLogs());
      let returned: unknown;
      await act(async () => {
        returned = await result.current.loadMore();
      });

      expect(returned).toEqual([]);
      expect(fetchAdminOperationLogs).not.toHaveBeenCalled();
    });

    it("appends new logs and sorts merged list newest-first", async () => {
      const initial = makeLog({
        id: "log-1",
        timestamp: "2024-01-10T10:00:00.000Z",
      });
      const additional = makeLog({
        id: "log-2",
        timestamp: "2024-01-15T10:00:00.000Z",
      });
      fetchAdminOperationLogs
        .mockResolvedValueOnce({
          items: [initial],
          nextToken: "token-1",
        })
        .mockResolvedValueOnce({
          items: [additional],
          nextToken: null,
        });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].id).toBe("log-2");
      expect(result.current.nextToken).toBeNull();
    });

    it("updates nextToken to null when response returns null", async () => {
      fetchAdminOperationLogs
        .mockResolvedValueOnce({
          items: [makeLog()],
          nextToken: "token-1",
        })
        .mockResolvedValueOnce({
          items: [],
          nextToken: null,
        });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.nextToken).toBeNull();
    });

    it("accumulates excludedInvalidRecordCount across loadMore calls", async () => {
      fetchAdminOperationLogs
        .mockResolvedValueOnce({
          items: [makeLog({ id: "log-1" })],
          nextToken: "token-1",
          excludedInvalidRecords: true,
          excludedInvalidRecordCount: 1,
        })
        .mockResolvedValueOnce({
          items: [],
          nextToken: null,
          excludedInvalidRecords: true,
          excludedInvalidRecordCount: 2,
        });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.excludedInvalidRecordCount).toBe(3);
    });

    it("sets error state and rethrows on loadMore failure", async () => {
      fetchAdminOperationLogs
        .mockResolvedValueOnce({
          items: [makeLog()],
          nextToken: "token-1",
        })
        .mockRejectedValueOnce(new Error("Load more failed"));

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial();
      });
      await act(async () => {
        await result.current.loadMore().catch(() => {
          /* expected rejection */
        });
      });

      expect(result.current.error?.message).toBe("Load more failed");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("error conversion", () => {
    it("converts string error to Error", async () => {
      mockFetchLogs.mockRejectedValue("string error");

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial().catch(() => {
          /* expected */
        });
      });

      expect(result.current.error?.message).toBe("string error");
    });

    it("converts object with message property to Error", async () => {
      mockFetchLogs.mockRejectedValue({ message: "object error" });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial().catch(() => {
          /* expected */
        });
      });

      expect(result.current.error?.message).toBe("object error");
    });

    it("converts object with errors array to Error using first item", async () => {
      mockFetchLogs.mockRejectedValue({
        errors: [{ message: "errors array msg" }],
      });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial().catch(() => {
          /* expected */
        });
      });

      expect(result.current.error?.message).toBe("errors array msg");
    });

    it("uses fallback message for unrecognised error shape", async () => {
      mockFetchLogs.mockRejectedValue({ weird: "stuff" });

      const { result } = renderHook(() => useAdminOperationLogs());
      await act(async () => {
        await result.current.loadInitial().catch(() => {
          /* expected */
        });
      });

      expect(result.current.error?.message).toBe("ログの取得に失敗しました。");
    });
  });
});
