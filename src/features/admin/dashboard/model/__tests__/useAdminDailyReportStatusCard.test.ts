import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  listDailyReports,
} from "@shared/api/graphql/documents/queries";
import { DailyReportStatus } from "@shared/api/graphql/types";
import { renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import { useAdminDailyReportStatusCard } from "../useAdminDailyReportStatusCard";

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------
const createSubscriptionMock = () => ({
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
});

const makeDailyReportItem = (overrides: Record<string, unknown> = {}) => ({
  staffId: "staff-1",
  reportDate: dayjs().format("YYYY-MM-DD"),
  status: DailyReportStatus.SUBMITTED,
  ...overrides,
});

// ---------------------------------------------------------------------------
// useAdminDailyReportStatusCard
// ---------------------------------------------------------------------------
describe("useAdminDailyReportStatusCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.graphql as jest.Mock).mockReturnValue(createSubscriptionMock());
  });

  it("マウント時に isLoading が true になり、取得完了後に false になること", async () => {
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.resolve({
            data: { listDailyReports: { items: [], nextToken: null } },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("日報がない場合、submittedCountLabel・approvedCountLabel が '0件' であること", async () => {
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.resolve({
            data: { listDailyReports: { items: [], nextToken: null } },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.submittedCountLabel).toBe("0件");
    expect(result.current.approvedCountLabel).toBe("0件");
  });

  it("SUBMITTED ステータスの日報が 2 件、submittedCountLabel が '2件' であること", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.resolve({
            data: {
              listDailyReports: {
                items: [
                  makeDailyReportItem({ staffId: "staff-1", reportDate: today }),
                  makeDailyReportItem({ staffId: "staff-2", reportDate: today }),
                ],
                nextToken: null,
              },
            },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => {
      expect(result.current.submittedCountLabel).toBe("2件");
    });
    expect(result.current.approvedCountLabel).toBe("0件");
  });

  it("APPROVED ステータスは submitted にも counted されること（承認済み ⊂ 提出済み）", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
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

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => {
      expect(result.current.submittedCountLabel).toBe("2件");
    });
    expect(result.current.approvedCountLabel).toBe("1件");
  });

  it("DRAFT ステータスは集計対象外であること", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
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

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.submittedCountLabel).toBe("0件");
    expect(result.current.approvedCountLabel).toBe("0件");
  });

  it("ローディング中は '集計中' を返すこと", () => {
    // クエリは解決しない Promise、サブスクリプションは正常なモックを返す
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return new Promise(() => {}); // 解決しない
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    expect(result.current.submittedCountLabel).toBe("集計中");
    expect(result.current.approvedCountLabel).toBe("集計中");
  });

  it("API エラー時、件数が 0 にフォールバックすること", async () => {
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.reject(new Error("Server error"));
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.submittedCountLabel).toBe("0件");
    expect(result.current.approvedCountLabel).toBe("0件");
  });

  it("同一スタッフが複数件でも 1 件として数えること（Set による重複除去）", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.resolve({
            data: {
              listDailyReports: {
                items: [
                  makeDailyReportItem({ staffId: "staff-1", reportDate: today }),
                  makeDailyReportItem({ staffId: "staff-1", reportDate: today }),
                ],
                nextToken: null,
              },
            },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => {
      expect(result.current.submittedCountLabel).toBe("1件");
    });
  });

  it("アンマウント時にサブスクリプションが解除されること", async () => {
    const mockUnsubscribe = jest.fn();
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listDailyReports) {
          return Promise.resolve({
            data: { listDailyReports: { items: [], nextToken: null } },
          });
        }
        return {
          subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
        };
      },
    );

    const { unmount } = renderHook(() => useAdminDailyReportStatusCard());

    await waitFor(() => expect(graphqlClient.graphql).toHaveBeenCalled());

    unmount();

    // create / update / delete の 3 つ
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
  });
});
