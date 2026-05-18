import { ShiftRequestStatus } from "@shared/api/graphql/types";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useCollaborativeShiftData } from "../useCollaborativeShiftData";
import { createSubscriptionMockHarness } from "./subscriptionMockHarness";

const mockUseGetShiftRequestsQuery = jest.fn();
const mockUpdateShiftCell = jest.fn();
const mockBatchUpdateShiftCells = jest.fn();
const mockCreateShiftRequest = jest.fn();
const mockSubscriptionUnsubscribe = jest.fn();
const mockGraphqlSubscribe = jest.fn();

jest.mock("@entities/shift/api/shiftApi", () => ({
  __esModule: true,
  useGetShiftRequestsQuery: (...args: unknown[]) =>
    mockUseGetShiftRequestsQuery(...args),
  useUpdateShiftCellMutation: () => [mockUpdateShiftCell, {}],
  useBatchUpdateShiftCellsMutation: () => [mockBatchUpdateShiftCells, {}],
  useCreateShiftRequestMutation: () => [mockCreateShiftRequest, {}],
}));

jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn((...args: unknown[]) => mockGraphqlSubscribe(...args)),
  },
}));

describe("useCollaborativeShiftData", () => {
  const setupShiftRequestSubscriptionHarness = () => {
    const harness = createSubscriptionMockHarness<{
      onCreateShiftRequest: unknown;
      onUpdateShiftRequest: unknown;
    }>(mockSubscriptionUnsubscribe);

    mockGraphqlSubscribe
      .mockReturnValueOnce(
        harness.buildSubscriptionResponse("onCreateShiftRequest"),
      )
      .mockReturnValueOnce(
        harness.buildSubscriptionResponse("onUpdateShiftRequest"),
      );

    return harness;
  };

  const baseShiftRequest = {
    __typename: "ShiftRequest",
    id: "req-1",
    staffId: "staff-1",
    targetMonth: "2026-02",
    note: null,
    entries: [
      {
        __typename: "ShiftRequestDayPreference",
        date: "2026-02-01",
        status: ShiftRequestStatus.WORK,
      },
    ],
    summary: null,
    submittedAt: null,
    updatedAt: "2026-02-01T10:00:00Z",
    updatedBy: "admin",
    version: 1,
    histories: null,
    createdAt: "2026-02-01T00:00:00Z",
  } as const;

  const shiftRequests = [baseShiftRequest];

  beforeEach(() => {
    mockUseGetShiftRequestsQuery.mockReset();
    mockUpdateShiftCell.mockReset();
    mockBatchUpdateShiftCells.mockReset();
    mockCreateShiftRequest.mockReset();
    mockSubscriptionUnsubscribe.mockReset();
    mockGraphqlSubscribe.mockReset();

    // デフォルトのサブスクリプションモック
    mockGraphqlSubscribe.mockReturnValue({
      subscribe: jest.fn(() => ({
        unsubscribe: mockSubscriptionUnsubscribe,
      })),
    });
  });

  it("他ユーザーのcreate購読イベントでローカル状態を即時更新する", async () => {
    mockUseGetShiftRequestsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const subscriptionHarness = setupShiftRequestSubscriptionHarness();

    const onAutoSyncReceived = jest.fn();

    const { result } = renderHook(() =>
      useCollaborativeShiftData({
        staffIds: ["staff-2"],
        targetMonth: "2026-02",
        currentUserId: "user-1",
        onAutoSyncReceived,
      }),
    );

    await waitFor(() =>
      expect(
        subscriptionHarness.hasHandler("onCreateShiftRequest"),
      ).toBeTruthy(),
    );
    expect(subscriptionHarness.hasHandler("onUpdateShiftRequest")).toBeTruthy();

    act(() => {
      subscriptionHarness.emit("onCreateShiftRequest", {
        ...baseShiftRequest,
        id: "req-2",
        staffId: "staff-2",
        updatedBy: "other-user",
      });
    });

    await waitFor(() =>
      expect(result.current.shiftDataMap.get("staff-2")?.get("01")?.state).toBe(
        "work",
      ),
    );
    expect(onAutoSyncReceived).toHaveBeenCalledTimes(1);
  });

  it("自分の購読イベントは二重適用せずonAutoSyncReceivedも呼ばない", async () => {
    mockUseGetShiftRequestsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const subscriptionHarness = setupShiftRequestSubscriptionHarness();

    const onAutoSyncReceived = jest.fn();

    const { result } = renderHook(() =>
      useCollaborativeShiftData({
        staffIds: ["staff-2"],
        targetMonth: "2026-02",
        currentUserId: "user-1",
        onAutoSyncReceived,
      }),
    );

    await waitFor(() =>
      expect(
        subscriptionHarness.hasHandler("onCreateShiftRequest"),
      ).toBeTruthy(),
    );
    expect(subscriptionHarness.hasHandler("onUpdateShiftRequest")).toBeTruthy();

    act(() => {
      subscriptionHarness.emit("onCreateShiftRequest", {
        ...baseShiftRequest,
        id: "req-3",
        staffId: "staff-2",
        updatedBy: "user-1",
      });
    });

    await waitFor(() => {
      expect(result.current.shiftDataMap.get("staff-2")?.get("01")?.state).toBe(
        "empty",
      );
    });
    expect(onAutoSyncReceived).not.toHaveBeenCalled();
  });

  it("取得したシフトをShiftDataMapへ反映する", async () => {
    mockUseGetShiftRequestsQuery.mockReturnValue({
      data: shiftRequests,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCollaborativeShiftData({
        staffIds: ["staff-1"],
        targetMonth: "2026-02",
        currentUserId: "user-1",
      }),
    );

    await waitFor(() =>
      expect(result.current.shiftDataMap.get("staff-1")?.get("01")?.state).toBe(
        "work",
      ),
    );
  });

  it("updateShiftでGraphQL更新を呼び出す", async () => {
    mockUseGetShiftRequestsQuery.mockReturnValue({
      data: shiftRequests,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const updatedShiftRequest = {
      ...baseShiftRequest,
      entries: [
        {
          __typename: "ShiftRequestDayPreference",
          date: "2026-02-01",
          status: ShiftRequestStatus.FIXED_OFF,
        },
      ],
      version: 2,
    } as const;

    mockUpdateShiftCell.mockReturnValue({
      unwrap: () => Promise.resolve(updatedShiftRequest),
    });

    const { result } = renderHook(() =>
      useCollaborativeShiftData({
        staffIds: ["staff-1"],
        targetMonth: "2026-02",
        currentUserId: "user-1",
      }),
    );

    await waitFor(() =>
      expect(result.current.shiftDataMap.get("staff-1")?.get("01")?.state).toBe(
        "work",
      ),
    );

    await act(async () => {
      await result.current.updateShift({
        staffId: "staff-1",
        date: "01",
        newState: "fixedOff",
      });
    });

    expect(mockUpdateShiftCell).toHaveBeenCalledTimes(1);
    const payload = mockUpdateShiftCell.mock.calls[0][0];
    expect(payload.input.entries).toEqual([
      {
        date: "2026-02-01",
        status: ShiftRequestStatus.FIXED_OFF,
        isLocked: false,
      },
    ]);
  });

  describe("onPersistCompleted", () => {
    it("updateShift 成功時に onPersistCompleted が正規化済みデータで呼ばれる", async () => {
      mockUseGetShiftRequestsQuery.mockReturnValue({
        data: shiftRequests,
        isLoading: false,
        isFetching: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const updatedShiftRequest = {
        ...baseShiftRequest,
        entries: [
          {
            __typename: "ShiftRequestDayPreference",
            date: "2026-02-01",
            status: ShiftRequestStatus.FIXED_OFF,
          },
        ],
        version: 2,
        histories: [
          {
            version: 2,
            entries: [{ date: "2026-02-01", status: ShiftRequestStatus.FIXED_OFF }],
            recordedAt: "2026-02-01T11:00:00Z",
            recordedByStaffId: "user-1",
          },
        ],
      } as const;

      mockUpdateShiftCell.mockReturnValue({
        unwrap: () => Promise.resolve(updatedShiftRequest),
      });

      const onPersistCompleted = jest.fn();

      const { result } = renderHook(() =>
        useCollaborativeShiftData({
          staffIds: ["staff-1"],
          targetMonth: "2026-02",
          currentUserId: "user-1",
          onPersistCompleted,
        }),
      );

      await waitFor(() =>
        expect(result.current.shiftDataMap.get("staff-1")?.get("01")?.state).toBe("work"),
      );

      await act(async () => {
        await result.current.updateShift({
          staffId: "staff-1",
          date: "01",
          newState: "fixedOff",
        });
      });

      await waitFor(() => {
        expect(onPersistCompleted).toHaveBeenCalledTimes(1);
      });

      const calledArg = onPersistCompleted.mock.calls[0][0];
      expect(calledArg.staffId).toBe("staff-1");
      expect(calledArg.targetMonth).toBe("2026-02");
      // histories が含まれていることを確認
      expect(Array.isArray(calledArg.histories)).toBe(true);
      expect(calledArg.histories).toHaveLength(1);
    });

    it("batchUpdateShifts 成功時に onPersistCompleted が各スタッフ分呼ばれる", async () => {
      const staff2ShiftRequest = {
        __typename: "ShiftRequest",
        id: "req-2",
        staffId: "staff-2",
        targetMonth: "2026-02",
        note: null,
        entries: [
          {
            __typename: "ShiftRequestDayPreference",
            date: "2026-02-01",
            status: ShiftRequestStatus.WORK,
          },
        ],
        summary: null,
        submittedAt: null,
        updatedAt: "2026-02-01T10:00:00Z",
        updatedBy: "admin",
        version: 1,
        histories: null,
        createdAt: "2026-02-01T00:00:00Z",
      } as const;

      mockUseGetShiftRequestsQuery.mockReturnValue({
        data: [baseShiftRequest, staff2ShiftRequest],
        isLoading: false,
        isFetching: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const updatedStaff1 = {
        ...baseShiftRequest,
        entries: [
          {
            __typename: "ShiftRequestDayPreference",
            date: "2026-02-01",
            status: ShiftRequestStatus.FIXED_OFF,
          },
        ],
        version: 2,
      } as const;

      const updatedStaff2 = {
        ...staff2ShiftRequest,
        entries: [
          {
            __typename: "ShiftRequestDayPreference",
            date: "2026-02-01",
            status: ShiftRequestStatus.REQUESTED_OFF,
          },
        ],
        version: 2,
      } as const;

      mockBatchUpdateShiftCells.mockReturnValue({
        unwrap: () =>
          Promise.resolve({
            updatedRequests: [updatedStaff1, updatedStaff2],
            errors: [],
          }),
      });

      const onPersistCompleted = jest.fn();

      const { result } = renderHook(() =>
        useCollaborativeShiftData({
          staffIds: ["staff-1", "staff-2"],
          targetMonth: "2026-02",
          currentUserId: "user-1",
          onPersistCompleted,
        }),
      );

      await waitFor(() =>
        expect(result.current.shiftDataMap.get("staff-1")?.get("01")?.state).toBe("work"),
      );

      await act(async () => {
        await result.current.batchUpdateShifts([
          { staffId: "staff-1", date: "01", newState: "fixedOff" },
          { staffId: "staff-2", date: "01", newState: "requestedOff" },
        ]);
      });

      await waitFor(() => {
        expect(onPersistCompleted).toHaveBeenCalledTimes(2);
      });

      const calledStaffIds = onPersistCompleted.mock.calls.map(
        (call) => call[0].staffId,
      );
      expect(calledStaffIds).toContain("staff-1");
      expect(calledStaffIds).toContain("staff-2");
    });
  });

  it("updateShift失敗時にonSaveFailedコールバックを呼ぶ", async () => {
    mockUseGetShiftRequestsQuery.mockReturnValue({
      data: shiftRequests,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    });

    mockUpdateShiftCell.mockReturnValue({
      unwrap: () => Promise.reject({ message: "Unauthorized" }),
    });

    const onSaveFailed = jest.fn();

    const { result } = renderHook(() =>
      useCollaborativeShiftData({
        staffIds: ["staff-1"],
        targetMonth: "2026-02",
        currentUserId: "user-1",
        onSaveFailed,
      }),
    );

    await waitFor(() =>
      expect(result.current.shiftDataMap.get("staff-1")?.get("01")?.state).toBe(
        "work",
      ),
    );

    await act(async () => {
      await result.current.updateShift({
        staffId: "staff-1",
        date: "01",
        newState: "fixedOff",
      });
    });

    await waitFor(() => {
      expect(onSaveFailed).toHaveBeenCalledWith("権限がありません。");
    });
  });
});
