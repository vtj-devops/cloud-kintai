import { ShiftRequestStatus } from "@shared/api/graphql/types";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useCollaborativeShiftData } from "../useCollaborativeShiftData";

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

  it("updateShift失敗時に権限エラーをセットする", async () => {
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

    expect(result.current.error).toBe("権限がありません。");
  });
});
