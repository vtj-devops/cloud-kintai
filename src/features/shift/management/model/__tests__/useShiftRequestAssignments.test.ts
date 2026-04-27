import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import useShiftRequestAssignments from "../useShiftRequestAssignments";

const mockGraphql = jest.fn();
const mockProcessShiftRequestItems = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

jest.mock("../../lib/shiftRequests", () => ({
  processShiftRequestItems: (...args: unknown[]) => mockProcessShiftRequestItems(...args),
  convertHistoryToInput: jest.fn((h) => h),
}));

jest.mock("../../lib/shiftAssignments", () => ({
  buildSummaryFromAssignments: jest.fn(() => ({
    workDays: 1,
    fixedOffDays: 0,
    requestedOffDays: 0,
  })),
}));

const MONTH_START = dayjs("2025-06-01");

const STAFF_1 = {
  id: "staff-1",
  cognitoUserId: "cognito-1",
  name: "Staff One",
  storeId: "store-1",
  email: "staff1@example.com",
  role: "STAFF",
  workType: "SHIFT",
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
} as unknown as StaffType;

// Stable references to avoid infinite render loops from new array references
const EMPTY_STAFFS: StaffType[] = [];
const ONE_STAFF: StaffType[] = [STAFF_1];

const emptyProcessResult = {
  nextAssignments: new Map(),
  nextHistoryMeta: new Map(),
  nextRecords: new Map(),
};

function makeListResponse(items: unknown[] = [], nextToken: string | null = null) {
  return {
    data: {
      listShiftRequests: {
        items,
        nextToken,
      },
    },
    errors: undefined,
  };
}

describe("useShiftRequestAssignments", () => {
  beforeEach(() => {
    mockGraphql.mockReset();
    mockProcessShiftRequestItems.mockReset();
    mockProcessShiftRequestItems.mockReturnValue(emptyProcessResult);
  });

  it("returns initial empty state", () => {
    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: EMPTY_STAFFS, monthStart: MONTH_START })
    );
    expect(result.current.shiftRequestAssignments.size).toBe(0);
    expect(result.current.shiftRequestHistoryMeta.size).toBe(0);
    expect(result.current.shiftRequestRecords.size).toBe(0);
    expect(result.current.shiftRequestsError).toBeNull();
  });

  it("enabled=false → returns empty maps, no fetch", async () => {
    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START, enabled: false })
    );

    await act(async () => {});

    expect(mockGraphql).not.toHaveBeenCalled();
    expect(result.current.shiftRequestAssignments.size).toBe(0);
    expect(result.current.shiftRequestsLoading).toBe(false);
  });

  it("shiftStaffs empty → returns empty maps, no fetch", async () => {
    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: EMPTY_STAFFS, monthStart: MONTH_START })
    );

    await act(async () => {});

    expect(mockGraphql).not.toHaveBeenCalled();
    expect(result.current.shiftRequestAssignments.size).toBe(0);
  });

  it("successful fetch → populates maps via processShiftRequestItems", async () => {
    const mockAssignments = new Map([["staff-1", { "2025-06-01": "work" as const }]]);
    const mockHistoryMeta = new Map([["staff-1", { changeCount: 1, latestChangeAt: "2025-06-01T00:00:00Z" }]]);
    const mockRecords = new Map([["staff-1", { id: "req-1", version: 1, histories: [], targetMonth: "2025-06" }]]);

    mockProcessShiftRequestItems.mockReturnValue({
      nextAssignments: mockAssignments,
      nextHistoryMeta: mockHistoryMeta,
      nextRecords: mockRecords,
    });
    mockGraphql.mockResolvedValue(makeListResponse([{ id: "req-1", staffId: "staff-1" }]));

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestsLoading).toBe(false);
    });

    expect(result.current.shiftRequestAssignments.get("staff-1")).toEqual({ "2025-06-01": "work" });
    expect(result.current.shiftRequestHistoryMeta.get("staff-1")?.changeCount).toBe(1);
    expect(result.current.shiftRequestRecords.get("staff-1")?.id).toBe("req-1");
  });

  it("fetch error → sets shiftRequestsError", async () => {
    mockGraphql.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestsError).toBe("希望シフトの取得に失敗しました。");
    });
  });

  it("loading state is set during fetch", async () => {
    let resolve!: (val: unknown) => void;
    mockGraphql.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestsLoading).toBe(true);
    });

    act(() => {
      resolve(makeListResponse());
    });

    await waitFor(() => {
      expect(result.current.shiftRequestsLoading).toBe(false);
    });
  });

  it("monthStart changes → re-fetches", async () => {
    mockGraphql.mockResolvedValue(makeListResponse());

    const { rerender } = renderHook(
      ({ monthStart }) =>
        useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart }),
      { initialProps: { monthStart: MONTH_START } }
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalledTimes(1));

    rerender({ monthStart: MONTH_START.add(1, "month") });

    await waitFor(() => expect(mockGraphql).toHaveBeenCalledTimes(2));
  });

  it("pagination (nextToken) → loops until nextToken is null", async () => {
    mockProcessShiftRequestItems.mockReturnValue(emptyProcessResult);
    mockGraphql
      .mockResolvedValueOnce(makeListResponse([{ id: "req-1", staffId: "staff-1" }], "token-1"))
      .mockResolvedValueOnce(makeListResponse([{ id: "req-2", staffId: "staff-1" }], null));

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestsLoading).toBe(false);
    });

    expect(mockGraphql).toHaveBeenCalledTimes(2);
    const secondCallArgs = mockGraphql.mock.calls[1][0];
    expect(secondCallArgs.variables.nextToken).toBe("token-1");
  });

  it("persistShiftRequestChanges with no existing record → calls createShiftRequest", async () => {
    mockGraphql
      .mockResolvedValueOnce(makeListResponse())
      .mockResolvedValueOnce({
        data: {
          createShiftRequest: {
            id: "new-req-1",
            staffId: "staff-1",
            targetMonth: "2025-06",
            version: 1,
            note: null,
            submittedAt: "2025-06-01T00:00:00Z",
          },
        },
      });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await act(async () => {
      await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
    });

    expect(mockGraphql).toHaveBeenCalledTimes(2);
    const createCall = mockGraphql.mock.calls[1][0];
    expect(JSON.stringify(createCall.query)).toContain("createShiftRequest");
  });

  it("persistShiftRequestChanges with existing record → calls updateShiftRequest", async () => {
    const mockRecords = new Map([
      ["staff-1", { id: "existing-req-1", version: 1, histories: [], targetMonth: "2025-06", note: null, submittedAt: null }],
    ]);
    mockProcessShiftRequestItems.mockReturnValue({
      ...emptyProcessResult,
      nextRecords: mockRecords,
    });
    mockGraphql
      .mockResolvedValueOnce(makeListResponse([{ id: "existing-req-1", staffId: "staff-1" }]))
      .mockResolvedValueOnce({
        data: {
          updateShiftRequest: {
            id: "existing-req-1",
            version: 2,
            note: null,
            submittedAt: "2025-06-01T00:00:00Z",
            targetMonth: "2025-06",
          },
        },
      });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await act(async () => {
      await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
    });

    const updateCall = mockGraphql.mock.calls[1][0];
    expect(JSON.stringify(updateCall.query)).toContain("updateShiftRequest");
  });

  it("persistShiftRequestChanges → updates local state after success", async () => {
    mockGraphql
      .mockResolvedValueOnce(makeListResponse())
      .mockResolvedValueOnce({
        data: {
          createShiftRequest: {
            id: "new-req-1",
            staffId: "staff-1",
            targetMonth: "2025-06",
            version: 1,
            note: null,
            submittedAt: "2025-06-01T00:00:00Z",
          },
        },
      });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await act(async () => {
      await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
    });

    expect(result.current.shiftRequestAssignments.get("staff-1")?.["2025-06-01"]).toBe("work");
    expect(result.current.shiftRequestRecords.get("staff-1")?.id).toBe("new-req-1");
  });

  it("persistShiftRequestChanges with createShiftRequest error → throws", async () => {
    mockGraphql
      .mockResolvedValueOnce(makeListResponse())
      .mockResolvedValueOnce({ errors: [{ message: "create failed" }] });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
      })
    ).rejects.toThrow();
  });

  it("persistShiftRequestChanges with version conflict → fetches latest and retries merge", async () => {
    const mockRecords = new Map([
      ["staff-1", { id: "existing-req-1", version: 1, histories: [], targetMonth: "2025-06", note: null, submittedAt: null }],
    ]);
    mockProcessShiftRequestItems.mockReturnValue({
      ...emptyProcessResult,
      nextRecords: mockRecords,
    });

    mockGraphql
      // initial fetch
      .mockResolvedValueOnce(makeListResponse([{ id: "existing-req-1", staffId: "staff-1" }]))
      // update conflict
      .mockResolvedValueOnce({ errors: [{ message: "The conditional request failed" }] })
      // fetch latest for merge
      .mockResolvedValueOnce({
        data: {
          listShiftRequests: {
            items: [{
              id: "existing-req-1",
              staffId: "staff-1",
              targetMonth: "2025-06",
              version: 2,
              entries: [],
              histories: [],
              note: null,
            }],
            nextToken: null,
          },
        },
      })
      // retry update
      .mockResolvedValueOnce({
        data: {
          updateShiftRequest: {
            id: "existing-req-1",
            version: 3,
            note: null,
            submittedAt: "2025-06-01T00:00:00Z",
            targetMonth: "2025-06",
          },
        },
      });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await act(async () => {
      await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
    });

    expect(mockGraphql).toHaveBeenCalledTimes(4);
  });

  it("persistShiftRequestChanges returns no data → throws", async () => {
    mockGraphql
      .mockResolvedValueOnce(makeListResponse())
      .mockResolvedValueOnce({ data: { createShiftRequest: null } });

    const { result } = renderHook(() =>
      useShiftRequestAssignments({ shiftStaffs: ONE_STAFF, monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.shiftRequestsLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.persistShiftRequestChanges("staff-1", ["2025-06-01"], "work");
      })
    ).rejects.toThrow("Shift request mutation returned no data");
  });
});
