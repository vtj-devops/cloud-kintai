import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  listAttendances,
  listDailyReports,
} from "@shared/api/graphql/documents/queries";
import { DailyReportStatus } from "@shared/api/graphql/types";
import { renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import React from "react";

import { useAdminDashboard } from "../useAdminDashboard";

// ---------------------------------------------------------------------------
// モック定義（ファイルレベル）
// ---------------------------------------------------------------------------
const mockUseStaffs = jest.fn();
const mockUseCloseDates = jest.fn();

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCloseDates(...args),
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

const makeDailyReportItem = (overrides: Record<string, unknown> = {}) => ({
  staffId: "staff-1",
  reportDate: dayjs().format("YYYY-MM-DD"),
  status: DailyReportStatus.SUBMITTED,
  ...overrides,
});

const mockGetStandardWorkHours = jest.fn();

const mockAuthContextValue = {
  authStatus: "authenticated" as const,
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn().mockReturnValue(false),
  isAuthenticated: true,
};

const mockAppConfigContextValue = {
  getStandardWorkHours: mockGetStandardWorkHours,
};

function buildWrapper() {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthContext.Provider,
      {
        value: mockAuthContextValue as unknown as React.ContextType<
          typeof AuthContext
        >,
      },
      React.createElement(
        AppConfigContext.Provider,
        {
          value: mockAppConfigContextValue as unknown as React.ContextType<
            typeof AppConfigContext
          >,
        },
        children,
      ),
    );
  }
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
}

const wrapper = buildWrapper();

// ---------------------------------------------------------------------------
// セットアップ / ティアダウン
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();

  mockGetStandardWorkHours.mockReturnValue(8);
  mockUseStaffs.mockReturnValue({ staffs: [makeStaff()], loading: false });
  mockUseCloseDates.mockReturnValue({ closeDates: [], loading: false });

  (graphqlClient.graphql as jest.Mock).mockImplementation(
    ({ query }: { query: unknown }) => {
      if (query === listAttendances) {
        return Promise.resolve({
          data: { listAttendances: { items: [], nextToken: null } },
        });
      }
      if (query === listDailyReports) {
        return Promise.resolve({
          data: { listDailyReports: { items: [], nextToken: null } },
        });
      }
      return createSubscriptionMock();
    },
  );
});

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------
describe("useAdminDashboard", () => {
  // =========================================================================
  // ローディング状態
  // =========================================================================
  describe("ローディング状態", () => {
    it("マウント時に isLoadingCurrentWorkingStaffCount が true であること", () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) return new Promise(() => {});
          if (query === listDailyReports) return new Promise(() => {});
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      expect(result.current.isLoadingCurrentWorkingStaffCount).toBe(true);
    });

    it("取得完了後に isLoadingCurrentWorkingStaffCount が false になること", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingCurrentWorkingStaffCount).toBe(false);
      });
    });

    it("取得完了後に isLoadingDailyReportStatus が false になること", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingDailyReportStatus).toBe(false);
      });
    });

    it("closeDatesLoading が true のとき closeDatesLoading が true を返し fetchPeriodAttendances が呼ばれないこと", () => {
      mockUseCloseDates.mockReturnValue({ closeDates: [], loading: true });

      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) return new Promise(() => {});
          if (query === listDailyReports) return new Promise(() => {});
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      // closeDatesLoading が true のとき、fetchPeriodAttendances は呼ばれない
      // そのため isLoadingPeriodAttendances は false のまま
      // closeDatesLoading 自体が true で、ロード中であることを示す
      expect(result.current.closeDatesLoading).toBe(true);
      expect(result.current.isLoadingPeriodAttendances).toBe(false);
    });
  });

  // =========================================================================
  // ラベル
  // =========================================================================
  describe("ラベル", () => {
    it("ローディング中は currentWorkingStaffCountLabel が '集計中' を返すこと", () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) return new Promise(() => {});
          if (query === listDailyReports) return new Promise(() => {});
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      expect(result.current.currentWorkingStaffCountLabel).toBe("集計中");
    });

    it("ローディング中は submittedDailyReportCountLabel が '集計中' を返すこと", () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) return new Promise(() => {});
          if (query === listDailyReports) return new Promise(() => {});
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      expect(result.current.submittedDailyReportCountLabel).toBe("集計中");
    });

    it("ローディング中は approvedDailyReportCountLabel が '集計中' を返すこと", () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) return new Promise(() => {});
          if (query === listDailyReports) return new Promise(() => {});
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      expect(result.current.approvedDailyReportCountLabel).toBe("集計中");
    });

    it("取得完了後に currentWorkingStaffCountLabel が '0人' を返すこと", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentWorkingStaffCountLabel).toBe("0人");
      });
    });

    it("currentWorkingStaffInfoLabel が今日の日付と説明テキストを含むこと", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingCurrentWorkingStaffCount).toBe(false),
      );

      expect(result.current.currentWorkingStaffInfoLabel).toContain(today);
      expect(result.current.currentWorkingStaffInfoLabel).toContain(
        "勤務中・休憩中スタッフ数",
      );
    });

    it("aggregationPeriodInfoLabel が '集計期間:' を含むこと", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.aggregationPeriodInfoLabel).toContain("集計期間:");
    });
  });

  // =========================================================================
  // 勤務中スタッフ数
  // =========================================================================
  describe("勤務中スタッフ数", () => {
    it("勤務中スタッフ数が正しくカウントされること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: {
                listAttendances: {
                  items: [
                    makeAttendanceItem({
                      staffId: "staff-1",
                      workDate: today,
                      endTime: null, // 勤務中
                    }),
                    makeAttendanceItem({
                      staffId: "staff-2",
                      workDate: today,
                      endTime: null, // 勤務中
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentWorkingStaffCountLabel).toBe("2人");
      });
    });

    it("退勤済みスタッフは勤務中カウントから除外されること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: {
                listAttendances: {
                  items: [
                    makeAttendanceItem({
                      staffId: "staff-1",
                      workDate: today,
                      endTime: null, // 勤務中
                    }),
                    makeAttendanceItem({
                      staffId: "staff-2",
                      workDate: today,
                      startTime: "2024-06-10T09:00:00+09:00",
                      endTime: "2024-06-10T18:00:00+09:00", // 退勤済み
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentWorkingStaffCountLabel).toBe("1人");
      });
    });

    it("API エラー時に currentWorkingStaffCountLabel が '0人' にフォールバックすること", async () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.reject(new Error("Network error"));
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingCurrentWorkingStaffCount).toBe(false),
      );

      expect(result.current.currentWorkingStaffCountLabel).toBe("0人");
    });

    it("response.errors がある場合にエラーハンドリングされて '0人' になること", async () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              errors: [{ message: "Unauthorized" }],
              data: null,
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingCurrentWorkingStaffCount).toBe(false),
      );

      expect(result.current.currentWorkingStaffCountLabel).toBe("0人");
    });

    it("同一スタッフIDが複数件でも 1 名として数えること（Set による重複除去）", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: {
                listAttendances: {
                  items: [
                    makeAttendanceItem({
                      staffId: "staff-1",
                      workDate: today,
                      endTime: null,
                    }),
                    makeAttendanceItem({
                      staffId: "staff-1",
                      workDate: today,
                      endTime: null,
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentWorkingStaffCountLabel).toBe("1人");
      });
    });
  });

  // =========================================================================
  // 日報ステータス
  // =========================================================================
  describe("日報ステータス", () => {
    it("SUBMITTED ステータスの日報が正しくカウントされること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: {
                listDailyReports: {
                  items: [
                    makeDailyReportItem({
                      staffId: "staff-1",
                      reportDate: today,
                    }),
                    makeDailyReportItem({
                      staffId: "staff-2",
                      reportDate: today,
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

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.submittedDailyReportCountLabel).toBe("2件");
      });
      expect(result.current.approvedDailyReportCountLabel).toBe("0件");
    });

    it("APPROVED ステータスは submitted にも counted されること（承認済み ⊂ 提出済み）", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: {
                listDailyReports: {
                  items: [
                    makeDailyReportItem({
                      staffId: "staff-1",
                      reportDate: today,
                      status: DailyReportStatus.APPROVED,
                    }),
                    makeDailyReportItem({
                      staffId: "staff-2",
                      reportDate: today,
                      status: DailyReportStatus.SUBMITTED,
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

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.submittedDailyReportCountLabel).toBe("2件");
      });
      expect(result.current.approvedDailyReportCountLabel).toBe("1件");
    });

    it("DRAFT ステータスは集計対象外であること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: {
                listDailyReports: {
                  items: [
                    makeDailyReportItem({
                      staffId: "staff-1",
                      reportDate: today,
                      status: DailyReportStatus.DRAFT,
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

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingDailyReportStatus).toBe(false),
      );

      expect(result.current.submittedDailyReportCountLabel).toBe("0件");
      expect(result.current.approvedDailyReportCountLabel).toBe("0件");
    });

    it("日報 API エラー時にカウントが 0 にフォールバックすること", async () => {
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.reject(new Error("Server error"));
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingDailyReportStatus).toBe(false),
      );

      expect(result.current.submittedDailyReportCountLabel).toBe("0件");
      expect(result.current.approvedDailyReportCountLabel).toBe("0件");
    });

    it("staffId がない日報は集計対象外であること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: {
                listDailyReports: {
                  items: [
                    // staffId なし → 集計対象外
                    makeDailyReportItem({ staffId: null, reportDate: today }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingDailyReportStatus).toBe(false),
      );

      expect(result.current.submittedDailyReportCountLabel).toBe("0件");
    });
  });

  // =========================================================================
  // staffWorkStatusSummary
  // =========================================================================
  describe("staffWorkStatusSummary", () => {
    it("スタッフが存在しない場合 staffWorkStatusSummary が空であること", async () => {
      mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.staffWorkStatusSummary).toHaveLength(0);
    });

    it("勤怠データがある場合 staffWorkStatusSummary にスタッフラベルが含まれること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      mockUseStaffs.mockReturnValue({
        staffs: [
          makeStaff({ id: "staff-1", familyName: "山田", givenName: "太郎" }),
        ],
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
                      workDate: today,
                      startTime: "2024-06-10T09:00:00+09:00",
                      endTime: "2024-06-10T18:00:00+09:00",
                      rests: [],
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      const labels = result.current.staffWorkStatusSummary.map((s) => s.label);
      expect(labels).toContain("山田 太郎");
    });

    it("startTime または endTime がない勤怠は集計対象外であること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      mockUseStaffs.mockReturnValue({
        staffs: [makeStaff({ id: "staff-1" })],
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
                      workDate: today,
                      startTime: "2024-06-10T09:00:00+09:00",
                      endTime: null, // endTime なし
                      rests: [],
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      const summary = result.current.staffWorkStatusSummary.find(
        (s) => s.label === "山田 太郎",
      );
      expect(summary?.workHours).toBe(0);
    });
  });

  // =========================================================================
  // 重複勤怠カウント
  // =========================================================================
  describe("duplicateAttendanceDayCount / hasDuplicateAttendances", () => {
    it("重複勤怠なしの場合 duplicateAttendanceDayCount が 0 であること", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.duplicateAttendanceDayCount).toBe(0);
      expect(result.current.hasDuplicateAttendances).toBe(false);
    });

    it("同一スタッフ同日の重複勤怠がある場合 hasDuplicateAttendances が true であること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      mockUseStaffs.mockReturnValue({
        staffs: [makeStaff({ id: "staff-1" })],
        loading: false,
      });

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
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.hasDuplicateAttendances).toBe(true);
      expect(result.current.duplicateAttendanceDayCount).toBe(1);
    });

    it("異なる日付の場合は重複扱いにならないこと", async () => {
      mockUseStaffs.mockReturnValue({
        staffs: [makeStaff({ id: "staff-1" })],
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
                      workDate: "2024-06-01",
                    }),
                    makeAttendanceItem({
                      staffId: "staff-1",
                      workDate: "2024-06-02",
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.hasDuplicateAttendances).toBe(false);
      expect(result.current.duplicateAttendanceDayCount).toBe(0);
    });
  });

  // =========================================================================
  // チャートデータ
  // =========================================================================
  describe("staffWorkStatusChartData / staffWorkStatusChartOptions", () => {
    it("staffWorkStatusChartData.datasets に '勤務時間' '有給休暇' '残業時間' が含まれること", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      const labels = result.current.staffWorkStatusChartData.datasets.map(
        (d) => d.label,
      );
      expect(labels).toContain("勤務時間");
      expect(labels).toContain("有給休暇");
      expect(labels).toContain("残業時間");
    });

    it("staffWorkStatusChartOptions が responsive: true を返すこと", async () => {
      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.staffWorkStatusChartOptions.responsive).toBe(true);
    });

    it("スタッフが空のとき staffWorkStatusChartData.labels が空であること", async () => {
      mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() =>
        expect(result.current.isLoadingPeriodAttendances).toBe(false),
      );

      expect(result.current.staffWorkStatusChartData.labels).toHaveLength(0);
    });
  });

  // =========================================================================
  // サブスクリプション
  // =========================================================================
  describe("サブスクリプション", () => {
    it("アンマウント時に 6 つのサブスクリプションが解除されること", async () => {
      const mockUnsubscribe = jest.fn();
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return {
            subscribe: jest
              .fn()
              .mockReturnValue({ unsubscribe: mockUnsubscribe }),
          };
        },
      );

      const { unmount } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => expect(graphqlClient.graphql).toHaveBeenCalled());

      unmount();

      // attendance (create/update/delete) + dailyReport (create/update/delete) = 6
      expect(mockUnsubscribe).toHaveBeenCalledTimes(6);
    });

    it("isAuthenticated が false のときサブスクリプションが設定されないこと", async () => {
      function unauthWrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          AuthContext.Provider,
          {
            value: {
              authStatus: "unauthenticated" as const,
              signOut: jest.fn(),
              signIn: jest.fn(),
              isCognitoUserRole: jest.fn().mockReturnValue(false),
            } as unknown as React.ContextType<typeof AuthContext>,
          },
          React.createElement(
            AppConfigContext.Provider,
            {
              value: mockAppConfigContextValue as unknown as React.ContextType<
                typeof AppConfigContext
              >,
            },
            children,
          ),
        );
      }
      unauthWrapper.displayName = "UnauthTestWrapper";

      const mockSubscribe = jest
        .fn()
        .mockReturnValue({ unsubscribe: jest.fn() });
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({ query }: { query: unknown }) => {
          if (query === listAttendances) {
            return Promise.resolve({
              data: { listAttendances: { items: [], nextToken: null } },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return { subscribe: mockSubscribe };
        },
      );

      renderHook(() => useAdminDashboard(), { wrapper: unauthWrapper });

      await waitFor(() => expect(graphqlClient.graphql).toHaveBeenCalled());

      expect(mockSubscribe).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ページネーション（nextToken）
  // =========================================================================
  describe("ページネーション", () => {
    it("nextToken がある場合、複数ページ分の勤怠を取得すること", async () => {
      const today = dayjs().format("YYYY-MM-DD");
      (graphqlClient.graphql as jest.Mock).mockImplementation(
        ({
          query,
          variables,
        }: {
          query: unknown;
          variables?: { nextToken?: string | null };
        }) => {
          if (query === listAttendances) {
            if (!variables?.nextToken) {
              // 1ページ目: nextToken あり
              return Promise.resolve({
                data: {
                  listAttendances: {
                    items: [
                      makeAttendanceItem({
                        staffId: "staff-1",
                        workDate: today,
                        endTime: null,
                      }),
                    ],
                    nextToken: "token-next",
                  },
                },
              });
            }
            // 2ページ目: nextToken なし
            return Promise.resolve({
              data: {
                listAttendances: {
                  items: [
                    makeAttendanceItem({
                      staffId: "staff-2",
                      workDate: today,
                      endTime: null,
                    }),
                  ],
                  nextToken: null,
                },
              },
            });
          }
          if (query === listDailyReports) {
            return Promise.resolve({
              data: { listDailyReports: { items: [], nextToken: null } },
            });
          }
          return createSubscriptionMock();
        },
      );

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentWorkingStaffCountLabel).toBe("2人");
      });
    });
  });
});
