import { CompanyHolidayCalendar,HolidayCalendar } from "@shared/api/graphql/types";
import { createMockAttendance } from "@shared/test-utils";
import { renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import { useAdminStaffAttendanceListViewModel } from "../useAdminStaffAttendanceListViewModel";

// ─────────────────────────────────────────
// モック: @entities/attendance/api/attendanceApi
// ─────────────────────────────────────────
const mockUseListAttendancesByDateRangeQuery = jest.fn();
const mockUseUpdateAttendanceMutation = jest.fn();
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useListAttendancesByDateRangeQuery: (...args: unknown[]) =>
    mockUseListAttendancesByDateRangeQuery(...args),
  useUpdateAttendanceMutation: (...args: unknown[]) =>
    mockUseUpdateAttendanceMutation(...args),
}));

// ─────────────────────────────────────────
// モック: useCloseDates
// ─────────────────────────────────────────
const mockUseCloseDates = jest.fn();
jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: () => mockUseCloseDates(),
}));

// ─────────────────────────────────────────
// モック: useCalendars
// ─────────────────────────────────────────
const mockUseCalendars = jest.fn();
jest.mock("@entities/calendar/model/useCalendars", () => ({
  useCalendars: () => mockUseCalendars(),
}));

// ─────────────────────────────────────────
// モック: fetchStaff
// ─────────────────────────────────────────
const mockFetchStaff = jest.fn();
jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetchStaff(...args),
}));

// ─────────────────────────────────────────
// モック: graphqlClient (サブスクリプション)
// ─────────────────────────────────────────
jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn(() => ({
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
  },
}));

// ─────────────────────────────────────────
// モック: react-redux
// useDispatch だけ差し替え、RTK Query が必要とする useSelector/useStore は実装を維持する
// ─────────────────────────────────────────
jest.mock("react-redux", () => ({
  ...jest.requireActual<typeof import("react-redux")>("react-redux"),
  useDispatch: jest.fn(),
}));

// ─────────────────────────────────────────
// モック: useAdminAttendanceChangeRequests（依存フックをスタブ化）
// ─────────────────────────────────────────
jest.mock("../useAdminAttendanceChangeRequests", () => ({
  useAdminAttendanceChangeRequests: jest.fn(() => ({
    quickViewOpen: false,
    quickViewAttendance: null,
    quickViewChangeRequest: null,
    handleOpenQuickView: jest.fn(),
    handleCloseQuickView: jest.fn(),
    selectedAttendanceIds: [],
    isAttendanceSelected: jest.fn(() => false),
    toggleAttendanceSelection: jest.fn(),
    toggleSelectAllPending: jest.fn(),
    bulkApproving: false,
    canBulkApprove: false,
    handleBulkApprove: jest.fn(),
  })),
}));

// ─────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────

const mockDispatch = jest.fn();

/** デフォルトのモック戻り値をリセット */
function resetDefaultMocks() {
  mockUseListAttendancesByDateRangeQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isUninitialized: true,
    error: undefined,
    refetch: jest.fn(),
  });
  mockUseUpdateAttendanceMutation.mockReturnValue([jest.fn(), {}]);
  mockUseCloseDates.mockReturnValue({
    closeDates: [],
    loading: false,
    error: null,
  });
  mockUseCalendars.mockReturnValue({
    holidayCalendars: [] as HolidayCalendar[],
    companyHolidayCalendars: [] as CompanyHolidayCalendar[],
    isLoading: false,
    error: null,
  });
  mockFetchStaff.mockResolvedValue(null);
}

// ─────────────────────────────────────────
// テスト
// ─────────────────────────────────────────

describe("useAdminStaffAttendanceListViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      jest.requireMock("react-redux") as { useDispatch: jest.Mock }
    ).useDispatch.mockReturnValue(mockDispatch);
    resetDefaultMocks();
  });

  // ── dateRange 計算 ─────────────────────────────────────────────────

  describe("dateRange", () => {
    it("currentMonth が未指定の場合、今月を基準に範囲を計算すること", () => {
      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel(),
      );
      const now = dayjs().startOf("month");
      const expectedStart = now.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
      const expectedEnd = now.endOf("month").format("YYYY-MM-DD");

      // dateRange は内部計算なので attendanceApi の引数から確認
      const callArgs = mockUseListAttendancesByDateRangeQuery.mock.calls[0]?.[0];
      expect(callArgs?.startDate).toBe(expectedStart);
      expect(callArgs?.endDate).toBe(expectedEnd);

      // ViewModel は呼び出せること
      expect(result.current).toBeDefined();
    });

    it("2024-03 を指定した場合、startDate=2024-02-01・endDate=2024-03-31 になること", () => {
      const march2024 = dayjs("2024-03-01");
      renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1", march2024),
      );

      const callArgs = mockUseListAttendancesByDateRangeQuery.mock.calls[0]?.[0];
      expect(callArgs?.startDate).toBe("2024-02-01");
      expect(callArgs?.endDate).toBe("2024-03-31");
    });

    it("2024-01 を指定した場合、startDate=2023-12-01・endDate=2024-01-31 になること", () => {
      const jan2024 = dayjs("2024-01-01");
      renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1", jan2024),
      );

      const callArgs = mockUseListAttendancesByDateRangeQuery.mock.calls[0]?.[0];
      expect(callArgs?.startDate).toBe("2023-12-01");
      expect(callArgs?.endDate).toBe("2024-01-31");
    });
  });

  // ── attendanceLoading ──────────────────────────────────────────────

  describe("attendanceLoading", () => {
    it("staffId が未指定かつエラーなしの場合は attendanceLoading=true であること", () => {
      // shouldFetchAttendances=false なので !shouldFetchAttendances=true → attendanceLoading=true
      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel(),
      );

      expect(result.current.attendanceLoading).toBe(true);
    });

    it("staffId が未指定かつエラーあり（attendancesError）の場合は attendanceLoading=false であること", () => {
      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isUninitialized: true,
        error: { message: "fetch error" },
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel(),
      );

      expect(result.current.attendanceLoading).toBe(false);
    });

    it("staffId あり・isUninitialized=true の場合は attendanceLoading=true であること", () => {
      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isUninitialized: true,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.attendanceLoading).toBe(true);
    });
  });

  // ── duplicateAttendances ───────────────────────────────────────────

  describe("duplicateAttendances", () => {
    it("同じ workDate の勤怠が複数ある場合、重複として検出すること", () => {
      const att1 = createMockAttendance({ id: "att-1", workDate: "2024-03-15" });
      const att2 = createMockAttendance({ id: "att-2", workDate: "2024-03-15" });
      const att3 = createMockAttendance({ id: "att-3", workDate: "2024-03-16" });

      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: [att1, att2, att3],
        isLoading: false,
        isFetching: false,
        isUninitialized: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.duplicateAttendances).toHaveLength(1);
      expect(result.current.duplicateAttendances[0].workDate).toBe("2024-03-15");
      expect(result.current.duplicateAttendances[0].ids).toEqual(
        expect.arrayContaining(["att-1", "att-2"]),
      );
    });

    it("重複がない場合、duplicateAttendances は空配列であること", () => {
      const att1 = createMockAttendance({ id: "att-1", workDate: "2024-03-15" });
      const att2 = createMockAttendance({ id: "att-2", workDate: "2024-03-16" });

      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: [att1, att2],
        isLoading: false,
        isFetching: false,
        isUninitialized: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.duplicateAttendances).toHaveLength(0);
    });

    it("attendancesData が undefined の場合、duplicateAttendances は空配列であること", () => {
      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isUninitialized: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.duplicateAttendances).toHaveLength(0);
    });
  });

  // ── attendances / pendingAttendances ───────────────────────────────

  describe("attendances と pendingAttendances", () => {
    it("attendancesData がある場合、attendances に含まれること", () => {
      const att = createMockAttendance({ id: "att-1" });
      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: [att],
        isLoading: false,
        isFetching: false,
        isUninitialized: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.attendances).toHaveLength(1);
      expect(result.current.attendances[0].id).toBe("att-1");
    });

    it("未承認の変更リクエストを持つ勤怠が pendingAttendances に含まれること", () => {
      const pendingAtt = createMockAttendance({
        id: "att-pending",
        changeRequests: [
          {
            __typename: "AttendanceChangeRequest",
            completed: false,
            startTime: "09:00",
            endTime: "18:00",
            goDirectlyFlag: false,
            returnDirectlyFlag: false,
            remarks: null,
            rests: [],
            hourlyPaidHolidayTimes: [],
            hourlyPaidHolidayHours: null,
            paidHolidayFlag: false,
            specialHolidayFlag: false,
            substituteHolidayDate: null,
            comment: null,
          },
        ],
      });
      const normalAtt = createMockAttendance({
        id: "att-normal",
        changeRequests: [],
      });

      mockUseListAttendancesByDateRangeQuery.mockReturnValue({
        data: [pendingAtt, normalAtt],
        isLoading: false,
        isFetching: false,
        isUninitialized: false,
        error: undefined,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      expect(result.current.pendingAttendances).toHaveLength(1);
      expect(result.current.pendingAttendances[0].id).toBe("att-pending");
    });
  });

  // ── getBadgeContent ────────────────────────────────────────────────

  describe("getBadgeContent", () => {
    it("未承認の変更リクエスト数を返すこと", () => {
      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel(),
      );

      const att = createMockAttendance({
        changeRequests: [
          {
            __typename: "AttendanceChangeRequest",
            completed: false,
            startTime: "09:00",
            endTime: null,
            goDirectlyFlag: false,
            returnDirectlyFlag: false,
            remarks: null,
            rests: [],
            hourlyPaidHolidayTimes: [],
            hourlyPaidHolidayHours: null,
            paidHolidayFlag: false,
            specialHolidayFlag: false,
            substituteHolidayDate: null,
            comment: null,
          },
          {
            __typename: "AttendanceChangeRequest",
            completed: true,
            startTime: "10:00",
            endTime: "19:00",
            goDirectlyFlag: false,
            returnDirectlyFlag: false,
            remarks: null,
            rests: [],
            hourlyPaidHolidayTimes: [],
            hourlyPaidHolidayHours: null,
            paidHolidayFlag: false,
            specialHolidayFlag: false,
            substituteHolidayDate: null,
            comment: null,
          },
        ],
      });

      expect(result.current.getBadgeContent(att)).toBe(1);
    });

    it("変更リクエストがない場合 0 を返すこと", () => {
      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel(),
      );

      const att = createMockAttendance({ changeRequests: [] });
      expect(result.current.getBadgeContent(att)).toBe(0);
    });
  });

  // ── getTableRowVariant ─────────────────────────────────────────────

  describe("getTableRowVariant", () => {
    it("staff.workType が 'shift' かつ isDeemedHoliday=true の場合 'sunday' を返すこと", async () => {
      const shiftStaff = {
        __typename: "Staff" as const,
        id: "staff-shift",
        cognitoUserId: "cognito-shift",
        mailAddress: "shift@example.com",
        role: "Staff",
        enabled: true,
        status: "CONFIRMED",
        owner: false,
        workType: "shift",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      mockFetchStaff.mockResolvedValue(shiftStaff);

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-shift"),
      );

      await waitFor(() => {
        expect(result.current.staff).toBeDefined();
      });

      const att = createMockAttendance({ isDeemedHoliday: true });
      expect(result.current.getTableRowVariant(att)).toBe("sunday");
    });

    it("staff.workType が 'shift' かつ isDeemedHoliday=false の場合 'default' を返すこと", async () => {
      const shiftStaff = {
        __typename: "Staff" as const,
        id: "staff-shift",
        cognitoUserId: "cognito-shift",
        mailAddress: "shift@example.com",
        role: "Staff",
        enabled: true,
        status: "CONFIRMED",
        owner: false,
        workType: "shift",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      mockFetchStaff.mockResolvedValue(shiftStaff);

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-shift"),
      );

      await waitFor(() => {
        expect(result.current.staff).toBeDefined();
      });

      const att = createMockAttendance({ isDeemedHoliday: false });
      expect(result.current.getTableRowVariant(att)).toBe("default");
    });

    it("staff が未取得（undefined）の場合、getAttendanceRowVariant の結果を返すこと", () => {
      // staff=undefined (初期状態)
      mockFetchStaff.mockReturnValue(new Promise(() => {})); // 永遠に解決しない

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      // staff=undefined なので workType !== "shift" → getAttendanceRowVariant へフォールスルー
      const sundayAtt = createMockAttendance({ workDate: "2024-03-17" }); // 日曜日
      // getAttendanceRowVariant が呼ばれる（クラッシュしないことを確認）
      expect(() => result.current.getTableRowVariant(sundayAtt)).not.toThrow();
    });
  });

  // ── fetchStaff 失敗時のエラーハンドリング ─────────────────────────

  describe("fetchStaff エラーハンドリング", () => {
    it("fetchStaff が失敗した場合、staff=null になりエラー通知を dispatch すること", async () => {
      mockFetchStaff.mockRejectedValue(new Error("Staff not found"));

      const { result } = renderHook(() =>
        useAdminStaffAttendanceListViewModel("staff-1"),
      );

      await waitFor(() => {
        expect(result.current.staff).toBeNull();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });
  });
});
