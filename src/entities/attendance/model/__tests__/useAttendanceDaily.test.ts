import { useLazyGetAttendanceByStaffAndDateQuery } from "@entities/attendance/api/attendanceApi";
import useAttendanceDaily, {
  AttendanceDailyStaff,
} from "@entities/attendance/model/useAttendanceDaily";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  ATTENDANCE_DUPLICATE_CONFLICT: "DUPLICATE_CONFLICT",
  useLazyGetAttendanceByStaffAndDateQuery: jest.fn(),
}));
jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));
jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onCreateAttendance: "ON_CREATE_ATTENDANCE",
  onDeleteAttendance: "ON_DELETE_ATTENDANCE",
  onUpdateAttendance: "ON_UPDATE_ATTENDANCE",
}));

const mockTrigger = jest.fn();
const mockGraphql = graphqlClient.graphql as jest.Mock;

const mockUnsubscribe = jest.fn();
const subscriptionMock = {
  subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
};

const STAFF_A: AttendanceDailyStaff = {
  cognitoUserId: "user-a",
  givenName: "太郎",
  familyName: "山田",
  sortKey: "yamada",
};

const STAFF_B: AttendanceDailyStaff = {
  cognitoUserId: "user-b",
  givenName: "花子",
  familyName: "田中",
  sortKey: "tanaka",
};

const makeAttendance = (staffId: string, workDate = "2024-01-15") => ({
  id: `att-${staffId}`,
  staffId,
  workDate,
  startTime: "09:00",
  endTime: "18:00",
});

describe("useAttendanceDaily", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      useLazyGetAttendanceByStaffAndDateQuery as jest.Mock
    ).mockReturnValue([mockTrigger]);
    mockGraphql.mockReturnValue(subscriptionMock);
  });

  describe("initial state", () => {
    it("returns empty lists and no error when staffs is empty", async () => {
      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs: [] }),
      );

      expect(result.current.attendanceDailyList).toEqual([]);
      expect(result.current.duplicateAttendances).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("skips loading when staffLoading is true", async () => {
      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs: [STAFF_A], staffLoading: true }),
      );

      expect(result.current.loading).toBe(false);
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it("skips loading when staffError is set", async () => {
      const error = new Error("fetch failed");
      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs: [STAFF_A], staffError: error }),
      );

      expect(mockTrigger).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });

  describe("loadAttendanceDataByMonth", () => {
    it("fetches attendance for all staffs in the month", async () => {
      const staffs = [STAFF_A, STAFF_B];
      mockTrigger.mockResolvedValue({ data: makeAttendance("user-a") });

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      expect(mockTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: "user-a",
          workDate: "2024-01-01",
        }),
      );
      expect(mockTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: "user-b",
          workDate: "2024-01-01",
        }),
      );
    });

    it("populates attendanceDailyList with staff data", async () => {
      const staffs = [STAFF_A];
      const attendance = makeAttendance("user-a", "2024-01-15");
      mockTrigger.mockResolvedValue({ data: attendance });

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      await waitFor(() => {
        expect(result.current.attendanceDailyList).toHaveLength(1);
        expect(result.current.attendanceDailyList[0].sub).toBe("user-a");
        expect(result.current.attendanceDailyList[0].attendance).toEqual(
          attendance,
        );
      });
    });

    it("uses cached data on second call for same month", async () => {
      mockTrigger.mockResolvedValue({ data: makeAttendance("user-a") });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      const callCount = mockTrigger.mock.calls.length;

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-20");
      });

      // Same month (2024-01) — should use cache, no extra trigger
      expect(mockTrigger.mock.calls.length).toBe(callCount);
    });

    it("bypasses cache when forceRefresh is true", async () => {
      mockTrigger.mockResolvedValue({ data: makeAttendance("user-a") });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      const callCount = mockTrigger.mock.calls.length;

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15", {
          forceRefresh: true,
        });
      });

      expect(mockTrigger.mock.calls.length).toBeGreaterThan(callCount);
    });

    it("sets error state when trigger throws non-duplicate error", async () => {
      const fetchError = new Error("Network error");
      mockTrigger.mockResolvedValue({ error: fetchError });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await expect(
        act(async () => {
          await result.current.loadAttendanceDataByMonth("2024-01-15");
        }),
      ).rejects.toThrow("Network error");
    });

    it("handles null attendance data gracefully", async () => {
      mockTrigger.mockResolvedValue({ data: null });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      expect(result.current.attendanceDailyList[0].attendance).toBeNull();
    });

    it("records duplicate attendance conflict", async () => {
      const duplicateError = {
        details: {
          code: "DUPLICATE_CONFLICT",
          duplicates: [
            { workDate: "2024-01-10", ids: ["id1", "id2"] },
          ],
        },
      };
      mockTrigger.mockResolvedValue({ error: duplicateError });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      await waitFor(() => {
        expect(result.current.duplicateAttendances).toHaveLength(1);
        expect(result.current.duplicateAttendances[0].staffId).toBe("user-a");
        expect(result.current.duplicateAttendances[0].workDate).toBe(
          "2024-01-10",
        );
      });
    });

    it("ignores duplicate outside the target month range", async () => {
      const duplicateError = {
        details: {
          code: "DUPLICATE_CONFLICT",
          duplicates: [
            { workDate: "2024-03-10", ids: ["id1", "id2"] },
          ],
        },
      };
      mockTrigger.mockResolvedValue({ error: duplicateError });
      const staffs = [STAFF_A];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      expect(result.current.duplicateAttendances).toHaveLength(0);
    });

    it("handles staffs with null name fields", async () => {
      const staffNoName: AttendanceDailyStaff = {
        cognitoUserId: "user-c",
        givenName: null,
        familyName: null,
        sortKey: null,
      };
      mockTrigger.mockResolvedValue({ data: makeAttendance("user-c") });
      const staffs = [staffNoName];

      const { result } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await act(async () => {
        await result.current.loadAttendanceDataByMonth("2024-01-15");
      });

      expect(result.current.attendanceDailyList[0].givenName).toBe("");
      expect(result.current.attendanceDailyList[0].familyName).toBe("");
    });
  });

  describe("subscription lifecycle", () => {
    it("subscribes to create, update, delete attendance on mount", async () => {
      mockTrigger.mockResolvedValue({ data: null });
      const staffs = [STAFF_A];

      renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      await waitFor(() => {
        expect(mockGraphql).toHaveBeenCalledWith(
          expect.objectContaining({ query: "ON_CREATE_ATTENDANCE" }),
        );
        expect(mockGraphql).toHaveBeenCalledWith(
          expect.objectContaining({ query: "ON_UPDATE_ATTENDANCE" }),
        );
        expect(mockGraphql).toHaveBeenCalledWith(
          expect.objectContaining({ query: "ON_DELETE_ATTENDANCE" }),
        );
      });
    });

    it("unsubscribes all subscriptions on unmount", async () => {
      mockTrigger.mockResolvedValue({ data: null });
      const staffs = [STAFF_A];

      const { unmount } = renderHook(() =>
        useAttendanceDaily({ staffs }),
      );

      unmount();

      // 3 subscriptions × 1 unsubscribe each
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });

    it("does not subscribe when staffs is empty", () => {
      renderHook(() =>
        useAttendanceDaily({ staffs: [] }),
      );

      expect(mockGraphql).not.toHaveBeenCalled();
    });
  });
});
