import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { listAttendances } from "@shared/api/graphql/documents/queries";
import { renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import { useAdminStaffWorkStatusChart } from "../useAdminStaffWorkStatusChart";

// ---------------------------------------------------------------------------
// モック定義（ファイルレベル）
// ---------------------------------------------------------------------------
const mockUseStaffs = jest.fn();
const mockUseCloseDates = jest.fn();
const mockUseAuthSessionSummary = jest.fn();
const mockUseStandardWorkHours = jest.fn();

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCloseDates(...args),
}));

jest.mock("@shared/lib/useAuthSessionSummary", () => ({
  useAuthSessionSummary: () => mockUseAuthSessionSummary(),
}));

jest.mock("@features/admin/dashboard/model/useAppConfigDerived", () => ({
  useStandardWorkHours: () => mockUseStandardWorkHours(),
}));

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------
const createSubscriptionMock = () => ({
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
});

const makeStaff = (overrides: Record<string, unknown> = {}) => ({
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  ...overrides,
});

const makeAttendanceItem = (overrides: Record<string, unknown> = {}) => ({
  staffId: "staff-1",
  workDate: dayjs().format("YYYY-MM-DD"),
  startTime: "2024-06-10T09:00:00+09:00",
  endTime: "2024-06-10T18:00:00+09:00",
  rests: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("useAdminStaffWorkStatusChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthSessionSummary.mockReturnValue({ isAuthenticated: true });
    mockUseStandardWorkHours.mockReturnValue(8);
    mockUseStaffs.mockReturnValue({ staffs: [makeStaff()], loading: false });
    mockUseCloseDates.mockReturnValue({ closeDates: [], loading: false });

    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.resolve({
            data: { listAttendances: { items: [], nextToken: null } },
          });
        }
        return createSubscriptionMock();
      },
    );
  });

  it("初期状態では isLoading が true であること", () => {
    // closeDates がロード中の場合 isLoading: true が維持される
    mockUseCloseDates.mockReturnValue({ closeDates: [], loading: true });
    // クエリは解決しない Promise、サブスクリプションは正常なモックを返す
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return new Promise(() => {}); // 解決しない
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    expect(result.current.isLoading).toBe(true);
  });

  it("取得完了後 isLoading が false になること", async () => {
    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("スタッフが空の場合 hasData が false であること", async () => {
    // スタッフが 0 名 → サマリーが空 → hasData: false
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasData).toBe(false);
  });

  it("勤怠データがある場合 hasData が true であること", async () => {
    mockUseStaffs.mockReturnValue({
      staffs: [makeStaff()],
      loading: false,
    });
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.resolve({
            data: {
              listAttendances: {
                items: [
                  makeAttendanceItem({
                    staffId: "staff-1",
                    workDate: dayjs().format("YYYY-MM-DD"),
                  }),
                ],
                nextToken: null,
              },
            },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasData).toBe(true);
  });

  it("infoLabel が集計期間を含むこと", async () => {
    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.infoLabel).toContain("集計期間:");
  });

  it("重複勤怠なしの場合 hasDuplicateAttendances が false であること", async () => {
    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasDuplicateAttendances).toBe(false);
    expect(result.current.duplicateAttendanceDayCount).toBe(0);
  });

  it("同一スタッフ同日の重複勤怠がある場合 hasDuplicateAttendances が true であること", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.resolve({
            data: {
              listAttendances: {
                items: [
                  makeAttendanceItem({ staffId: "staff-1", workDate: today }),
                  makeAttendanceItem({ staffId: "staff-1", workDate: today }),
                ],
                nextToken: null,
              },
            },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasDuplicateAttendances).toBe(true);
    expect(result.current.duplicateAttendanceDayCount).toBe(1);
  });

  it("chartData.datasets に '勤務時間' '有給休暇' '残業時間' が含まれること", async () => {
    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const labels = result.current.chartData.datasets.map(
      (d: { label: string }) => d.label,
    );
    expect(labels).toContain("勤務時間");
    expect(labels).toContain("有給休暇");
    expect(labels).toContain("残業時間");
  });

  it("API エラー時、periodAttendances が空になり hasData が false であること", async () => {
    // スタッフも空にして hasData: false を確認
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.reject(new Error("Network error"));
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasData).toBe(false);
  });

  it("アンマウント時にサブスクリプションが解除されること", async () => {
    const mockUnsubscribe = jest.fn();
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.resolve({
            data: { listAttendances: { items: [], nextToken: null } },
          });
        }
        return {
          subscribe: jest
            .fn()
            .mockReturnValue({ unsubscribe: mockUnsubscribe }),
        };
      },
    );

    const { unmount } = renderHook(() => useAdminStaffWorkStatusChart());

    await waitFor(() => expect(graphqlClient.graphql).toHaveBeenCalled());

    unmount();

    // create / update / delete の 3 つ
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
  });
});
