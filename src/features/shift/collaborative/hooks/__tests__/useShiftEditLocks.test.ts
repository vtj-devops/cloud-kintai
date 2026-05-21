import { act, renderHook, waitFor } from "@testing-library/react";

import { useShiftEditLocks } from "../useShiftEditLocks";
import {
  createGraphqlQueryRouter,
  createSubscriptionMockHarness,
} from "./subscriptionMockHarness";

type HookProps = {
  targetMonth?: string;
};

const mockGraphql = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

describe("useShiftEditLocks", () => {
  const activeLock = {
    __typename: "ShiftEditLock",
    id: "2026-03#staff-1#01",
    targetMonth: "2026-03",
    staffId: "staff-1",
    date: "01",
    holderUserId: "other-user",
    holderUserName: "他ユーザー",
    acquiredAt: "2026-03-01T10:00:00.000Z",
    expiresAt: "2099-03-01T10:01:30.000Z",
    version: 3,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  };

  type ShiftEditLockSubscriptionEvents = {
    onCreateShiftEditLock: typeof activeLock;
    onUpdateShiftEditLock: typeof activeLock;
    onDeleteShiftEditLock: typeof activeLock;
  };

  const createEditLockSubscriptionHarness = () =>
    createSubscriptionMockHarness<ShiftEditLockSubscriptionEvents>(
      mockUnsubscribe,
    );

  const setupEditLockGraphqlMock = ({
    subscriptionHarness,
    listItems = [],
    getShiftEditLockResponse = null,
    captureCreateEvent = false,
    captureDeleteEvent = false,
    deleteShiftEditLockBase,
  }: {
    subscriptionHarness: ReturnType<typeof createEditLockSubscriptionHarness>;
    listItems?: Array<typeof activeLock>;
    getShiftEditLockResponse?: typeof activeLock | null;
    captureCreateEvent?: boolean;
    captureDeleteEvent?: boolean;
    deleteShiftEditLockBase?: typeof activeLock;
  }) => {
    mockGraphql.mockImplementation(
      createGraphqlQueryRouter(
        [
          {
            contains: "ListShiftEditLocks",
            resolve: () =>
              Promise.resolve({
                data: {
                  listShiftEditLocks: {
                    items: listItems,
                    nextToken: null,
                  },
                },
              }),
          },
          {
            contains: "GetShiftEditLock",
            resolve: () =>
              Promise.resolve({
                data: { getShiftEditLock: getShiftEditLockResponse },
              }),
          },
          {
            contains: "OnCreateShiftEditLock",
            resolve: () =>
              captureCreateEvent
                ? subscriptionHarness.buildSubscriptionResponse(
                    "onCreateShiftEditLock",
                  )
                : subscriptionHarness.buildPassiveSubscriptionResponse(),
          },
          {
            contains: "OnUpdateShiftEditLock",
            resolve: () => subscriptionHarness.buildPassiveSubscriptionResponse(),
          },
          {
            contains: "OnDeleteShiftEditLock",
            resolve: () =>
              captureDeleteEvent
                ? subscriptionHarness.buildSubscriptionResponse(
                    "onDeleteShiftEditLock",
                  )
                : subscriptionHarness.buildPassiveSubscriptionResponse(),
          },
          {
            contains: "DeleteShiftEditLock",
            resolve: ({ variables }) =>
              Promise.resolve({
                data: {
                  deleteShiftEditLock: deleteShiftEditLockBase
                    ? {
                        ...deleteShiftEditLockBase,
                        ...(variables?.input as
                          | Record<string, unknown>
                          | undefined),
                      }
                    : null,
                },
              }),
          },
        ],
        () => Promise.resolve({ data: {} }),
      ),
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockGraphql.mockReset();
    mockUnsubscribe.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("他ユーザーがロック中のセルは取得失敗として返す", async () => {
    const subscriptionHarness = createEditLockSubscriptionHarness();
    setupEditLockGraphqlMock({
      subscriptionHarness,
      getShiftEditLockResponse: activeLock,
    });

    const { result } = renderHook(() =>
      useShiftEditLocks({
        currentUserId: "user-1",
        currentUserName: "User One",
        targetMonth: "2026-03",
      }),
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalled());

    let acquireResult:
      | Awaited<ReturnType<typeof result.current.acquireEditLock>>
      | undefined;

    await act(async () => {
      acquireResult = await result.current.acquireEditLock("staff-1", "01");
    });

    expect(acquireResult).toEqual({
      acquired: false,
      conflict: activeLock,
    });
    expect(result.current.isCellBeingEdited("staff-1", "01")).toBe(true);
  });

  it("subscriptionイベントでロック状態を即時反映する", async () => {
    const subscriptionHarness = createEditLockSubscriptionHarness();
    setupEditLockGraphqlMock({
      subscriptionHarness,
      captureCreateEvent: true,
      captureDeleteEvent: true,
    });

    const { result } = renderHook(() =>
      useShiftEditLocks({
        currentUserId: "user-1",
        currentUserName: "User One",
        targetMonth: "2026-03",
      }),
    );

    await waitFor(() =>
      expect(
        subscriptionHarness.hasHandler("onCreateShiftEditLock"),
      ).toBeTruthy(),
    );
    expect(subscriptionHarness.hasHandler("onDeleteShiftEditLock")).toBeTruthy();

    act(() => {
      subscriptionHarness.emit("onCreateShiftEditLock", activeLock);
    });

    await waitFor(() =>
      expect(result.current.isCellBeingEdited("staff-1", "01")).toBe(true),
    );

    act(() => {
      subscriptionHarness.emit("onDeleteShiftEditLock", activeLock);
    });

    await waitFor(() =>
      expect(result.current.isCellBeingEdited("staff-1", "01")).toBe(false),
    );
  });

  it("targetMonth がないときは公開状態を空として扱う", async () => {
    const subscriptionHarness = createEditLockSubscriptionHarness();
    setupEditLockGraphqlMock({
      subscriptionHarness,
      listItems: [activeLock],
    });

    const initialProps: HookProps = { targetMonth: "2026-03" };

    const { result, rerender } = renderHook(
      ({ targetMonth }: HookProps) =>
        useShiftEditLocks({
          currentUserId: "user-1",
          currentUserName: "User One",
          targetMonth,
        }),
      {
        initialProps,
      },
    );

    await waitFor(() =>
      expect(result.current.isCellBeingEdited("staff-1", "01")).toBe(true),
    );

    rerender({ targetMonth: undefined });

    expect(result.current.editingCells.size).toBe(0);
    expect(result.current.isCellBeingEdited("staff-1", "01")).toBe(false);
    expect(result.current.getAllEditingCells()).toEqual([]);
  });

  it("releaseEditLock は deleteShiftEditLock に id のみを渡す", async () => {
    const ownLock = {
      ...activeLock,
      holderUserId: "user-1",
      holderUserName: "User One",
    };

    const subscriptionHarness = createEditLockSubscriptionHarness();
    setupEditLockGraphqlMock({
      subscriptionHarness,
      getShiftEditLockResponse: ownLock,
      deleteShiftEditLockBase: ownLock,
    });

    const { result } = renderHook(() =>
      useShiftEditLocks({
        currentUserId: "user-1",
        currentUserName: "User One",
        targetMonth: "2026-03",
      }),
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalled());

    await act(async () => {
      await result.current.releaseEditLock("staff-1", "01");
    });

    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining("DeleteShiftEditLock"),
        variables: {
          input: { id: "2026-03#staff-1#01" },
          condition: {
            version: { eq: 3 },
          },
        },
        authMode: "userPool",
      }),
    );
  });

  it("forceReleaseLock は deleteShiftEditLock に id のみを渡す", async () => {
    const subscriptionHarness = createEditLockSubscriptionHarness();
    setupEditLockGraphqlMock({
      subscriptionHarness,
      getShiftEditLockResponse: activeLock,
      deleteShiftEditLockBase: activeLock,
    });

    const { result } = renderHook(() =>
      useShiftEditLocks({
        currentUserId: "user-1",
        currentUserName: "User One",
        targetMonth: "2026-03",
      }),
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalled());

    await act(async () => {
      await result.current.forceReleaseLock("staff-1", "01");
    });

    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining("DeleteShiftEditLock"),
        variables: {
          input: { id: "2026-03#staff-1#01" },
          condition: {
            version: { eq: 3 },
          },
        },
        authMode: "userPool",
      }),
    );
  });
});
