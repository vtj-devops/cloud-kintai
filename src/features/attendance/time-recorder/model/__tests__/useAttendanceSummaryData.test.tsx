import type { AuthContextProps } from "@app/providers/auth/AuthContext";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { createMockAttendance, createMockUser } from "@shared/test-utils";
import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";

import { useAttendanceSummaryData } from "../useAttendanceSummaryData";

// -------------------------------------------------------------------
// モック: 勤怠 API
// -------------------------------------------------------------------
const mockUseListAttendancesByDateRangeQuery = jest.fn();
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useListAttendancesByDateRangeQuery: (...args: unknown[]) =>
    mockUseListAttendancesByDateRangeQuery(...args),
}));

// -------------------------------------------------------------------
// モック: useCloseDates
// -------------------------------------------------------------------
const mockUseCloseDates = jest.fn();
jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: () => mockUseCloseDates(),
}));

// -------------------------------------------------------------------
// モック: aggregationDateRange — テスト用に非常に広い範囲を返す
// -------------------------------------------------------------------
jest.mock("@entities/attendance/lib/aggregationDateRange", () => {
  const realDayjs = jest.requireActual<typeof dayjs>("dayjs");
  return {
    getEffectiveDateRange: jest.fn(() => ({
      start: realDayjs("2020-01-01"),
      end: realDayjs("2030-12-31"),
      hasValidPeriod: false,
    })),
    getAttendanceQueryDateRange: jest.fn(() => ({
      start: realDayjs("2020-01-01"),
      end: realDayjs("2030-12-31"),
    })),
  };
});

// -------------------------------------------------------------------
// ヘルパー
// -------------------------------------------------------------------
const mockUser = createMockUser();

function createWrapper(override?: Partial<AuthContextProps>) {
  const value: AuthContextProps = {
    session: { roles: [] },
    cognitoUser: mockUser,
    signOut: jest.fn(),
    signIn: jest.fn(),
    isCognitoUserRole: jest.fn(() => false),
    ...override,
  };
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  };
}

/** デフォルトのモック戻り値をリセットするユーティリティ */
function resetDefaultMocks() {
  mockUseCloseDates.mockReturnValue({
    closeDates: [],
    loading: false,
    error: null,
  });
  mockUseListAttendancesByDateRangeQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isFetching: false,
    isUninitialized: false,
    error: null,
  });
}

// -------------------------------------------------------------------
// テスト
// -------------------------------------------------------------------
describe("useAttendanceSummaryData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDefaultMocks();
  });

  it("通常時は isLoading=false, hasError=false, filteredAttendances=[] を返す", () => {
    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.filteredAttendances).toEqual([]);
  });

  it("closeDatesLoading=true のとき isLoading=true を返す", () => {
    mockUseCloseDates.mockReturnValue({
      closeDates: [],
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("attendanceLoading=true のとき isLoading=true を返す", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("attendanceFetching=true のとき isLoading=true を返す", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: true,
      isUninitialized: false,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("attendanceUninitialized=true のとき isLoading=true を返す", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isUninitialized: true,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("closeDatesError がある場合 hasError=true を返す", () => {
    mockUseCloseDates.mockReturnValue({
      closeDates: [],
      loading: false,
      error: new Error("close dates error"),
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasError).toBe(true);
  });

  it("attendancesError がある場合 hasError=true を返す", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: { status: 500, message: "Server Error" },
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasError).toBe(true);
  });

  it("workDate が null の勤怠はフィルタリングされる", () => {
    const noDateAttendance = {
      ...createMockAttendance(),
      workDate: null as unknown as string,
    };
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [noDateAttendance],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.filteredAttendances).toHaveLength(0);
  });

  it("過去の終了済み勤怠は filteredAttendances に含まれる", () => {
    // 2024-06-15 は実行時の「今日」より確実に過去かつ effectiveDateRange (2020〜2030) 内
    const pastAttendance = createMockAttendance({
      workDate: "2024-06-15",
      startTime: "2024-06-15T09:00:00Z",
      endTime: "2024-06-15T18:00:00Z",
    });
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [pastAttendance],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.filteredAttendances).toHaveLength(1);
    expect(result.current.filteredAttendances[0].workDate).toBe("2024-06-15");
  });

  it("今日の日付で endTime がない勤怠はフィルタリングされる", () => {
    // "today" を取得して今日の勤怠を生成
    const todayStr = dayjs().format("YYYY-MM-DD");
    const todayAttendance = createMockAttendance({
      workDate: todayStr,
      startTime: `${todayStr}T09:00:00Z`,
      endTime: null as unknown as string, // まだ退勤していない
    });
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [todayAttendance],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.filteredAttendances).toHaveLength(0);
  });

  it("effectiveDateRange を返す（start/end が Dayjs オブジェクト）", () => {
    const { result } = renderHook(() => useAttendanceSummaryData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.effectiveDateRange).toBeDefined();
    expect(result.current.effectiveDateRange.start).toBeDefined();
    expect(result.current.effectiveDateRange.end).toBeDefined();
  });
});
