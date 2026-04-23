import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  listAttendances,
} from "@shared/api/graphql/documents/queries";
import { renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";

import { useAdminCurrentWorkingStaffCard } from "../useAdminCurrentWorkingStaffCard";

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------
const createSubscriptionMock = () => ({
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
});

const mockAttendanceItem = (overrides: Record<string, unknown> = {}) => ({
  staffId: "staff-1",
  workDate: dayjs().format("YYYY-MM-DD"),
  startTime: "2024-06-10T09:00:00+09:00",
  endTime: null, // 勤務中
  rests: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// useAdminCurrentWorkingStaffCard
// ---------------------------------------------------------------------------
describe("useAdminCurrentWorkingStaffCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // サブスクリプション呼び出しのデフォルトモック
    (graphqlClient.graphql as jest.Mock).mockReturnValue(createSubscriptionMock());
  });

  it("マウント時に isLoading が true になり、取得完了後に false になること", async () => {
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

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("勤務中スタッフがいない場合、countLabel が '0人' であること", async () => {
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

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.countLabel).toBe("0人");
  });

  it("勤務中スタッフが 2 名の場合、countLabel が '2人' であること", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.resolve({
            data: {
              listAttendances: {
                items: [
                  mockAttendanceItem({ staffId: "staff-1", workDate: today }),
                  mockAttendanceItem({ staffId: "staff-2", workDate: today }),
                  // 勤務終了スタッフは除外される
                  mockAttendanceItem({
                    staffId: "staff-3",
                    workDate: today,
                    endTime: "2024-06-10T18:00:00+09:00",
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

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => {
      expect(result.current.countLabel).toBe("2人");
    });
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
                  mockAttendanceItem({ staffId: "staff-1", workDate: today }),
                  mockAttendanceItem({ staffId: "staff-1", workDate: today }),
                ],
                nextToken: null,
              },
            },
          });
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => {
      expect(result.current.countLabel).toBe("1人");
    });
  });

  it("ローディング中は countLabel が '集計中' であること", () => {
    // クエリは解決しない Promise、サブスクリプションは正常なモックを返す
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return new Promise(() => {}); // 解決しない
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    expect(result.current.countLabel).toBe("集計中");
  });

  it("infoLabel が今日の日付と説明テキストを含むこと", async () => {
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

    const today = dayjs().format("YYYY-MM-DD");
    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.infoLabel).toContain(today);
    expect(result.current.infoLabel).toContain("勤務中・休憩中スタッフ数");
  });

  it("API がエラーを返した場合、countLabel が '0人' にフォールバックすること", async () => {
    (graphqlClient.graphql as jest.Mock).mockImplementation(
      ({ query }: { query: unknown }) => {
        if (query === listAttendances) {
          return Promise.reject(new Error("GraphQL error"));
        }
        return createSubscriptionMock();
      },
    );

    const { result } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.countLabel).toBe("0人");
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
          subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
        };
      },
    );

    const { unmount } = renderHook(() => useAdminCurrentWorkingStaffCard());

    await waitFor(() => expect(graphqlClient.graphql).toHaveBeenCalled());

    unmount();

    // create / update / delete の 3 つ
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
  });
});
