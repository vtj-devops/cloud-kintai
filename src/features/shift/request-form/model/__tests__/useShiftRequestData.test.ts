import { ShiftRequestStatus } from "@shared/api/graphql/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import { useShiftRequestData } from "../useShiftRequestData";

const mockDispatch = jest.fn();
const fetchStaffMock = jest.fn();
const mockGraphql = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchStaffMock(...args),
}));

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((p) => ({ type: "notification/push", payload: p })),
}));

const MONTH_START = dayjs("2025-06-01");

const MOCK_STAFF = {
  id: "staff-1",
  cognitoUserId: "cognito-1",
  name: "Test Staff",
  storeId: "store-1",
  email: "test@example.com",
  role: "STAFF",
  workType: "SHIFT",
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

function makeShiftRequestResponse(items: unknown[]) {
  return {
    data: {
      shiftRequestsByStaffId: {
        items,
        nextToken: null,
      },
    },
  };
}

describe("useShiftRequestData", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    fetchStaffMock.mockReset();
    mockGraphql.mockReset();
  });

  it("cognitoUserId undefined → staff=null, isLoadingStaff=false", async () => {
    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: undefined, monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.isLoadingStaff).toBe(false);
    });

    expect(result.current.staff).toBeNull();
    expect(fetchStaffMock).not.toHaveBeenCalled();
  });

  it("cognitoUserId provided → fetchStaff is called, staff is set", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(makeShiftRequestResponse([]));

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.staff).toEqual(MOCK_STAFF);
    });

    expect(fetchStaffMock).toHaveBeenCalledWith("cognito-1");
  });

  it("fetchStaff error → staff=null, notification dispatched", async () => {
    fetchStaffMock.mockRejectedValue(new Error("fetch failed"));

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.isLoadingStaff).toBe(false);
    });

    expect(result.current.staff).toBeNull();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("staff loaded, shift request found → selectedDates populated, shiftRequestId set", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(
      makeShiftRequestResponse([
        {
          id: "req-1",
          staffId: "staff-1",
          targetMonth: "2025-06",
          note: "test note",
          entries: [
            { date: "2025-06-01", status: ShiftRequestStatus.WORK },
            { date: "2025-06-02", status: ShiftRequestStatus.FIXED_OFF },
          ],
          histories: [],
        },
      ])
    );

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestId).toBe("req-1");
    });

    expect(result.current.selectedDates["2025-06-01"]).toEqual({ status: "work" });
    expect(result.current.selectedDates["2025-06-02"]).toEqual({ status: "fixedOff" });
  });

  it("staff loaded, no shift request → state reset", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(makeShiftRequestResponse([]));

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    // Wait for staff to load, then shift request fetch to complete
    await waitFor(() => {
      expect(result.current.staff).toEqual(MOCK_STAFF);
    });
    await waitFor(() => {
      expect(result.current.isLoadingShiftRequest).toBe(false);
    });

    expect(result.current.shiftRequestId).toBeNull();
    expect(result.current.selectedDates).toEqual({});
    expect(result.current.note).toBe("");
    expect(result.current.histories).toEqual([]);
  });

  it("shift request fetch error → notification dispatched, state reset", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockRejectedValue(new Error("graphql error"));

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    expect(result.current.shiftRequestId).toBeNull();
  });

  it("shift request has entries → selectedDates mapped correctly", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(
      makeShiftRequestResponse([
        {
          id: "req-1",
          staffId: "staff-1",
          targetMonth: "2025-06",
          note: null,
          entries: [
            { date: "2025-06-03", status: ShiftRequestStatus.REQUESTED_OFF },
            { date: "2025-06-04", status: ShiftRequestStatus.AUTO },
          ],
          histories: [],
        },
      ])
    );

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.shiftRequestId).toBe("req-1");
    });

    expect(result.current.selectedDates["2025-06-03"]).toEqual({ status: "requestedOff" });
    expect(result.current.selectedDates["2025-06-04"]).toEqual({ status: "auto" });
  });

  it("shift request has histories → histories sorted by version", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(
      makeShiftRequestResponse([
        {
          id: "req-1",
          staffId: "staff-1",
          targetMonth: "2025-06",
          note: null,
          entries: [],
          histories: [
            { version: 3, recordedAt: "2025-06-03T00:00:00Z", entries: [], summary: null, note: null, submittedAt: null, updatedAt: null, recordedByStaffId: null, changeReason: null },
            { version: 1, recordedAt: "2025-06-01T00:00:00Z", entries: [], summary: null, note: null, submittedAt: null, updatedAt: null, recordedByStaffId: null, changeReason: null },
            { version: 2, recordedAt: "2025-06-02T00:00:00Z", entries: [], summary: null, note: null, submittedAt: null, updatedAt: null, recordedByStaffId: null, changeReason: null },
          ],
        },
      ])
    );

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.histories.length).toBe(3);
    });

    expect(result.current.histories[0].version).toBe(1);
    expect(result.current.histories[1].version).toBe(2);
    expect(result.current.histories[2].version).toBe(3);
  });

  it("note is set from shift request", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(
      makeShiftRequestResponse([
        {
          id: "req-1",
          staffId: "staff-1",
          targetMonth: "2025-06",
          note: "my note",
          entries: [],
          histories: [],
        },
      ])
    );

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => {
      expect(result.current.note).toBe("my note");
    });
  });

  it("setSelectedDates callback works", async () => {
    fetchStaffMock.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.isLoadingStaff).toBe(false));

    act(() => {
      result.current.setSelectedDates({ "2025-06-01": { status: "work" } });
    });

    expect(result.current.selectedDates["2025-06-01"]).toEqual({ status: "work" });
  });

  it("setNote callback works", async () => {
    fetchStaffMock.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.isLoadingStaff).toBe(false));

    act(() => {
      result.current.setNote("updated note");
    });

    expect(result.current.note).toBe("updated note");
  });

  it("setHistories callback works", async () => {
    fetchStaffMock.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.isLoadingStaff).toBe(false));

    act(() => {
      result.current.setHistories([{ version: 1, recordedAt: "2025-06-01T00:00:00Z" }]);
    });

    expect(result.current.histories.length).toBe(1);
  });

  it("setShiftRequestId callback works", async () => {
    fetchStaffMock.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useShiftRequestData({ cognitoUserId: "cognito-1", monthStart: MONTH_START })
    );

    await waitFor(() => expect(result.current.isLoadingStaff).toBe(false));

    act(() => {
      result.current.setShiftRequestId("new-id");
    });

    expect(result.current.shiftRequestId).toBe("new-id");
  });

  it("targetMonthKey changes → re-fetches", async () => {
    fetchStaffMock.mockResolvedValue(MOCK_STAFF);
    mockGraphql.mockResolvedValue(makeShiftRequestResponse([]));

    const { rerender } = renderHook(
      ({ monthStart }) =>
        useShiftRequestData({ cognitoUserId: "cognito-1", monthStart }),
      { initialProps: { monthStart: MONTH_START } }
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalledTimes(1));

    rerender({ monthStart: MONTH_START.add(1, "month") });

    await waitFor(() => expect(mockGraphql).toHaveBeenCalledTimes(2));
  });
});
