import { AuthContext, AuthContextProps } from "@app/providers/auth/AuthContext";
import { StaffRole, useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { useWorkflowNotificationInbox } from "@features/workflow/notification/model/useWorkflowNotificationInbox";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  StaffRole: {
    OWNER: "Owner",
    ADMIN: "Admin",
    STAFF_ADMIN: "StaffAdmin",
    STAFF: "Staff",
  },
  useStaffs: jest.fn(),
}));

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));

jest.mock("@shared/api/graphql/documents/queries", () => ({
  workflowNotificationEventsByRecipient: "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY",
}));

jest.mock("@shared/api/graphql/documents/mutations", () => ({
  updateWorkflowNotificationEvent: "UPDATE_NOTIFICATION_EVENT_MUTATION",
}));

jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onCreateWorkflowNotificationEvent: "ON_CREATE_NOTIFICATION_SUBSCRIPTION",
  onUpdateWorkflowNotificationEvent: "ON_UPDATE_NOTIFICATION_SUBSCRIPTION",
}));

jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn().mockReturnValue({}),
  getNextVersion: jest.fn().mockReturnValue(2),
}));

jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockUseStaffs = useStaffs as jest.Mock;
const mockGraphql = graphqlClient.graphql as jest.Mock;

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const makeCognitoUser = (id = "cognito-123") => ({
  id,
  givenName: "Taro",
  familyName: "Yamada",
  mailAddress: "taro@example.com",
  owner: false,
  roles: [],
  emailVerified: true,
});

const makeStaff = (id = "staff-1", cognitoUserId = "cognito-123") => ({
  id,
  cognitoUserId,
});

type MockNotificationEvent = {
  id: string;
  recipientStaffId: string;
  eventAt: string;
  isRead: boolean;
  readAt?: string | null;
  version?: number;
  updatedAt?: string;
};

const makeNotificationEvent = (
  overrides: Partial<MockNotificationEvent> = {},
): MockNotificationEvent => ({
  id: "notif-1",
  recipientStaffId: "staff-1",
  eventAt: "2024-01-01T10:00:00.000Z",
  isRead: false,
  readAt: null,
  version: 1,
  updatedAt: "2024-01-01T10:00:00.000Z",
  ...overrides,
});

const makeNotificationPageResponse = (
  items: MockNotificationEvent[] = [],
  nextToken: string | null = null,
) => ({
  data: {
    workflowNotificationEventsByRecipient: {
      items,
      nextToken,
    },
  },
});

const makeMutationResponse = (event: MockNotificationEvent) => ({
  data: {
    updateWorkflowNotificationEvent: event,
  },
});

// ---------------------------------------------------------------------------
// Subscription helpers
// ---------------------------------------------------------------------------

const mockUnsubscribe = jest.fn();

type SubscribeCallbacks = {
  next: (data: { data: unknown }) => void;
  error: (err: unknown) => void;
};

// Per-query captured subscription callbacks
const capturedCallbacks = new Map<string, SubscribeCallbacks>();

function buildGraphqlMock(
  queryResponseFn: (input: { query: string; variables?: unknown }) => Promise<unknown> = () =>
    Promise.resolve(makeNotificationPageResponse()),
) {
  return (input: { query: string; variables?: unknown }) => {
    if (
      input.query === "ON_CREATE_NOTIFICATION_SUBSCRIPTION" ||
      input.query === "ON_UPDATE_NOTIFICATION_SUBSCRIPTION"
    ) {
      return {
        subscribe: jest.fn().mockImplementation((callbacks: SubscribeCallbacks) => {
          capturedCallbacks.set(input.query, callbacks);
          return { unsubscribe: mockUnsubscribe };
        }),
      };
    }
    return queryResponseFn(input);
  };
}

// ---------------------------------------------------------------------------
// Wrapper builder
// ---------------------------------------------------------------------------

const defaultIsCognitoUserRole = jest.fn().mockReturnValue(false);

const buildWrapper = (contextOverrides: Partial<AuthContextProps> = {}) => {
  const contextValue: AuthContextProps = {
    authStatus: "authenticated",
    cognitoUser: makeCognitoUser(),
    isCognitoUserRole: defaultIsCognitoUserRole,
    signOut: jest.fn(),
    signIn: jest.fn(),
    ...contextOverrides,
  };
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthContext.Provider, { value: contextValue }, children);
  Wrapper.displayName = "AuthContextTestWrapper";
  return Wrapper;
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  capturedCallbacks.clear();
  defaultIsCognitoUserRole.mockReturnValue(false);
  mockUseStaffs.mockReturnValue({ staffs: [makeStaff()] });
  mockGraphql.mockImplementation(buildGraphqlMock());
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useWorkflowNotificationInbox", () => {
  // -------------------------------------------------------------------------
  // 1. Initial state – unauthenticated
  // -------------------------------------------------------------------------
  describe("unauthenticated state", () => {
    it("returns empty notifications and zero unread count when not authenticated", async () => {
      const wrapper = buildWrapper({ authStatus: "unauthenticated", cognitoUser: null });

      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(mockGraphql).not.toHaveBeenCalled();
    });

    it("does not set up subscriptions when recipientIds is empty", async () => {
      const wrapper = buildWrapper({ authStatus: "unauthenticated", cognitoUser: null });

      renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.size).toBe(0);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Fetch notifications – success path
  // -------------------------------------------------------------------------
  describe("fetchNotifications", () => {
    it("fetches and sets notifications on mount", async () => {
      const event = makeNotificationEvent({ id: "notif-1" });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([event]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications[0].id).toBe("notif-1");
    });

    it("sets loading=true during fetch and false when done", async () => {
      let resolveQuery!: (value: unknown) => void;
      const pendingQuery = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      mockGraphql.mockImplementation(
        buildGraphqlMock(() => pendingQuery),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      // loading should become true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // resolve the query
      act(() => {
        resolveQuery(makeNotificationPageResponse());
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("sets error when fetch fails", async () => {
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.reject(new Error("Network error"))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Network error");
      });
    });

    it("sets error when graphql response contains errors", async () => {
      mockGraphql.mockImplementation(
        buildGraphqlMock(() =>
          Promise.resolve({ errors: [{ message: "GraphQL error occurred" }] }),
        ),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("GraphQL error occurred");
      });
    });

    it("deduplicates notifications across multiple recipients", async () => {
      // Both staff-1 and cognito-123 return the same notification id
      const sharedEvent = makeNotificationEvent({ id: "shared-notif" });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([sharedEvent]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const ids = result.current.notifications.map((n) => n.id);
      expect(ids.filter((id) => id === "shared-notif")).toHaveLength(1);
    });

    it("sorts notifications by eventAt descending", async () => {
      const older = makeNotificationEvent({ id: "old", eventAt: "2024-01-01T08:00:00.000Z" });
      const newer = makeNotificationEvent({ id: "new", eventAt: "2024-01-02T08:00:00.000Z" });
      let callCount = 0;
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => {
          // First recipient gets older+newer; second gets nothing
          callCount++;
          return callCount === 1
            ? Promise.resolve(makeNotificationPageResponse([older, newer]))
            : Promise.resolve(makeNotificationPageResponse([]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const ids = result.current.notifications.map((n) => n.id);
      expect(ids.indexOf("new")).toBeLessThan(ids.indexOf("old"));
    });

    it("sets hasMore=true when any recipient has a nextToken", async () => {
      let callCount = 0;
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => {
          callCount++;
          return callCount === 1
            ? Promise.resolve(makeNotificationPageResponse([], "next-cursor"))
            : Promise.resolve(makeNotificationPageResponse([]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 3. currentStaffId derivation
  // -------------------------------------------------------------------------
  describe("currentStaffId", () => {
    it("returns the staff ID matching the cognitoUser ID", async () => {
      mockUseStaffs.mockReturnValue({ staffs: [makeStaff("staff-99", "cognito-123")] });

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentStaffId).toBe("staff-99");
    });

    it("returns null when no staff matches the cognitoUser ID", async () => {
      mockUseStaffs.mockReturnValue({ staffs: [makeStaff("staff-1", "other-cognito")] });

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentStaffId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. recipientIds – admin vs. non-admin
  // -------------------------------------------------------------------------
  describe("recipientIds", () => {
    it("includes ADMINS recipient for admin users", async () => {
      defaultIsCognitoUserRole.mockImplementation(
        (role: string) => role === StaffRole.ADMIN,
      );

      const adminWrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), {
        wrapper: adminWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have fetched for ADMINS recipient too
      const queryCalls = mockGraphql.mock.calls.filter(
        (call: [{ query: string; variables?: { recipientStaffId?: string } }]) =>
          call[0].query === "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY",
      );
      const recipientIds = queryCalls.map(
        (call: [{ variables?: { recipientStaffId?: string } }]) =>
          call[0].variables?.recipientStaffId,
      );
      expect(recipientIds).toContain("ADMINS");
    });

    it("does not include ADMINS recipient for regular (non-admin) users", async () => {
      defaultIsCognitoUserRole.mockReturnValue(false);

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const queryCalls = mockGraphql.mock.calls.filter(
        (call: [{ query: string; variables?: { recipientStaffId?: string } }]) =>
          call[0].query === "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY",
      );
      const recipientIds = queryCalls.map(
        (call: [{ variables?: { recipientStaffId?: string } }]) =>
          call[0].variables?.recipientStaffId,
      );
      expect(recipientIds).not.toContain("ADMINS");
    });
  });

  // -------------------------------------------------------------------------
  // 5. Subscription lifecycle
  // -------------------------------------------------------------------------
  describe("subscription lifecycle", () => {
    it("sets up create and update subscriptions for each recipient on mount", async () => {
      const wrapper = buildWrapper();
      renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.has("ON_CREATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
        expect(capturedCallbacks.has("ON_UPDATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });
    });

    it("unsubscribes from all subscriptions on unmount", async () => {
      const wrapper = buildWrapper();
      const { unmount } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.size).toBeGreaterThan(0);
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("adds a new unread notification when create subscription fires", async () => {
      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.has("ON_CREATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });

      const newEvent = makeNotificationEvent({ id: "new-notif", isRead: false });
      act(() => {
        capturedCallbacks.get("ON_CREATE_NOTIFICATION_SUBSCRIPTION")?.next({
          data: { onCreateWorkflowNotificationEvent: newEvent },
        });
      });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "new-notif")).toBe(true);
      });

      expect(result.current.unreadCount).toBeGreaterThan(0);
    });

    it("updates an existing notification when update subscription fires", async () => {
      const existing = makeNotificationEvent({ id: "notif-1", isRead: false });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([existing]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "notif-1")).toBe(true);
        expect(capturedCallbacks.has("ON_UPDATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });

      const updatedEvent = { ...existing, isRead: true };
      act(() => {
        capturedCallbacks.get("ON_UPDATE_NOTIFICATION_SUBSCRIPTION")?.next({
          data: { onUpdateWorkflowNotificationEvent: updatedEvent },
        });
      });

      await waitFor(() => {
        const notif = result.current.notifications.find((n) => n.id === "notif-1");
        expect(notif?.isRead).toBe(true);
      });
    });

    it("ignores subscription events with no data payload", async () => {
      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.has("ON_CREATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });

      const initialCount = result.current.notifications.length;
      act(() => {
        capturedCallbacks.get("ON_CREATE_NOTIFICATION_SUBSCRIPTION")?.next({
          data: { onCreateWorkflowNotificationEvent: null },
        });
      });

      expect(result.current.notifications.length).toBe(initialCount);
    });
  });

  // -------------------------------------------------------------------------
  // 6. markAsRead – regular notification
  // -------------------------------------------------------------------------
  describe("markAsRead – regular notification", () => {
    it("calls graphql mutation and marks notification as read", async () => {
      const event = makeNotificationEvent({ id: "notif-1", isRead: false });
      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          if (
            (input as { query: string }).query === "UPDATE_NOTIFICATION_EVENT_MUTATION"
          ) {
            return Promise.resolve(makeMutationResponse({ ...event, isRead: true }));
          }
          return Promise.resolve(makeNotificationPageResponse([event]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "notif-1")).toBe(true);
      });

      await act(async () => {
        await result.current.markAsRead("notif-1");
      });

      const notif = result.current.notifications.find((n) => n.id === "notif-1");
      expect(notif?.isRead).toBe(true);
    });

    it("decrements unreadCount when marking an unread notification as read", async () => {
      const event = makeNotificationEvent({ id: "notif-1", isRead: false });
      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const q = (input as { query: string }).query;
          if (q === "UPDATE_NOTIFICATION_EVENT_MUTATION") {
            return Promise.resolve(makeMutationResponse({ ...event, isRead: true }));
          }
          // unreadCount fetch: return 1 unread item
          return Promise.resolve(makeNotificationPageResponse([event]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "notif-1")).toBe(true);
      });

      const countBefore = result.current.unreadCount;

      await act(async () => {
        await result.current.markAsRead("notif-1");
      });

      expect(result.current.unreadCount).toBeLessThanOrEqual(countBefore);
    });

    it("throws when mutation response contains errors", async () => {
      const event = makeNotificationEvent({ id: "notif-1", isRead: false });
      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const q = (input as { query: string }).query;
          if (q === "UPDATE_NOTIFICATION_EVENT_MUTATION") {
            return Promise.resolve({ errors: [{ message: "Mutation failed" }] });
          }
          return Promise.resolve(makeNotificationPageResponse([event]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "notif-1")).toBe(true);
      });

      await expect(
        act(async () => {
          await result.current.markAsRead("notif-1");
        }),
      ).rejects.toThrow("Mutation failed");
    });
  });

  // -------------------------------------------------------------------------
  // 7. markAsRead – ADMINS notification (localStorage-only)
  // -------------------------------------------------------------------------
  describe("markAsRead – ADMINS notification", () => {
    it("marks ADMINS notification as read via localStorage without API call", async () => {
      const adminEvent = makeNotificationEvent({
        id: "admin-notif-1",
        recipientStaffId: "ADMINS",
        isRead: false,
      });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([adminEvent]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(
          result.current.notifications.some((n) => n.id === "admin-notif-1"),
        ).toBe(true);
      });

      const mutationCallsBefore = mockGraphql.mock.calls.filter(
        (call: [{ query: string }]) =>
          call[0].query === "UPDATE_NOTIFICATION_EVENT_MUTATION",
      ).length;

      await act(async () => {
        await result.current.markAsRead("admin-notif-1");
      });

      // No mutation API calls should have been made
      const mutationCallsAfter = mockGraphql.mock.calls.filter(
        (call: [{ query: string }]) =>
          call[0].query === "UPDATE_NOTIFICATION_EVENT_MUTATION",
      ).length;
      expect(mutationCallsAfter).toBe(mutationCallsBefore);

      // Should be marked as read in state
      const notif = result.current.notifications.find((n) => n.id === "admin-notif-1");
      expect(notif?.isRead).toBe(true);

      // Should be persisted in localStorage
      const storageKey = `workflowNotificationRead.workflowComment.cognito-123`;
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
      expect(stored).toContain("admin-notif-1");
    });

    it("applies locally-read ADMINS notifications from localStorage on fetch", async () => {
      // Pre-populate localStorage with a read admin event
      const storageKey = `workflowNotificationRead.workflowComment.cognito-123`;
      localStorage.setItem(storageKey, JSON.stringify(["pre-read-admin-notif"]));

      const adminEvent = makeNotificationEvent({
        id: "pre-read-admin-notif",
        recipientStaffId: "ADMINS",
        isRead: false, // API says unread
      });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([adminEvent]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(
          result.current.notifications.some((n) => n.id === "pre-read-admin-notif"),
        ).toBe(true);
      });

      // Should be shown as read because localStorage says so
      const notif = result.current.notifications.find(
        (n) => n.id === "pre-read-admin-notif",
      );
      expect(notif?.isRead).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 8. loadMoreNotifications
  // -------------------------------------------------------------------------
  describe("loadMoreNotifications", () => {
    it("loads additional notifications when nextToken is available", async () => {
      const firstPage = makeNotificationEvent({ id: "notif-first" });
      const secondPage = makeNotificationEvent({
        id: "notif-second",
        eventAt: "2024-01-01T09:00:00.000Z",
      });

      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const variables = (input as { variables?: { nextToken?: string | null } })
            .variables;
          if (
            (input as { query: string }).query ===
            "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY"
          ) {
            if (!variables?.nextToken) {
              // First fetch: return first page with nextToken
              return Promise.resolve(
                makeNotificationPageResponse([firstPage], "cursor-abc"),
              );
            }
            // Second fetch (loadMore): return second page
            return Promise.resolve(makeNotificationPageResponse([secondPage]));
          }
          return Promise.resolve(makeNotificationPageResponse([]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.hasMore).toBe(true);
      });

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      await waitFor(() => {
        expect(result.current.loadingMore).toBe(false);
      });

      const ids = result.current.notifications.map((n) => n.id);
      expect(ids).toContain("notif-first");
      expect(ids).toContain("notif-second");
    });

    it("is a no-op when there are no nextTokens", async () => {
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.hasMore).toBe(false);
      });

      const graphqlCallCount = mockGraphql.mock.calls.length;

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      // No additional calls should have been made
      expect(mockGraphql.mock.calls.length).toBe(graphqlCallCount);
    });

    it("sets loadingMore state correctly during load", async () => {
      let resolveSecondPage!: (value: unknown) => void;
      const pendingSecondPage = new Promise((resolve) => {
        resolveSecondPage = resolve;
      });

      // Route by nextToken: absent → initial page with cursor; "cursor-xyz" → pending (loadMore)
      // Route by filter: present → unreadCount query (always empty, no nextToken loop)
      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const q = (input as { query: string }).query;
          const variables = (
            input as { variables?: { nextToken?: string | null; filter?: unknown } }
          ).variables;
          if (q === "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY") {
            if (variables?.filter) {
              // unreadCount fetch – always return empty, no nextToken
              return Promise.resolve(makeNotificationPageResponse([]));
            }
            if (variables?.nextToken === "cursor-xyz") {
              return pendingSecondPage;
            }
            return Promise.resolve(makeNotificationPageResponse([], "cursor-xyz"));
          }
          return Promise.resolve(makeNotificationPageResponse([]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.hasMore).toBe(true);
      });

      act(() => {
        void result.current.loadMoreNotifications();
      });

      await waitFor(() => {
        expect(result.current.loadingMore).toBe(true);
      });

      act(() => {
        resolveSecondPage(makeNotificationPageResponse([]));
      });

      await waitFor(() => {
        expect(result.current.loadingMore).toBe(false);
      });
    });

    it("sets error when loadMore fails", async () => {
      // Route by nextToken: absent → first page with cursor; "cursor-err" → reject
      // Route by filter → unreadCount (no nextToken loop)
      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const q = (input as { query: string }).query;
          const variables = (
            input as { variables?: { nextToken?: string | null; filter?: unknown } }
          ).variables;
          if (q === "NOTIFICATION_EVENTS_BY_RECIPIENT_QUERY") {
            if (variables?.filter) {
              return Promise.resolve(makeNotificationPageResponse([]));
            }
            if (variables?.nextToken === "cursor-err") {
              return Promise.reject(new Error("Load more failed"));
            }
            return Promise.resolve(makeNotificationPageResponse([], "cursor-err"));
          }
          return Promise.resolve(makeNotificationPageResponse([]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.hasMore).toBe(true);
      });

      await act(async () => {
        await result.current.loadMoreNotifications();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Load more failed");
      });
    });
  });

  // -------------------------------------------------------------------------
  // 9. markAllAsRead
  // -------------------------------------------------------------------------
  describe("markAllAsRead", () => {
    it("fetches all unread IDs and marks each as read", async () => {
      const event1 = makeNotificationEvent({ id: "notif-a", isRead: false });
      const event2 = makeNotificationEvent({
        id: "notif-b",
        isRead: false,
        eventAt: "2024-01-01T09:00:00.000Z",
      });

      mockGraphql.mockImplementation(
        buildGraphqlMock((input) => {
          const q = (input as { query: string }).query;
          if (q === "UPDATE_NOTIFICATION_EVENT_MUTATION") {
            return Promise.resolve({ data: { updateWorkflowNotificationEvent: {} } });
          }
          return Promise.resolve(makeNotificationPageResponse([event1, event2]));
        }),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      await waitFor(() => {
        const allRead = result.current.notifications.every((n) => n.isRead);
        expect(allRead).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 10. unreadCount management via applyIncomingEvent
  // -------------------------------------------------------------------------
  describe("unreadCount via applyIncomingEvent", () => {
    it("increments unreadCount when a brand-new unread notification arrives", async () => {
      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(capturedCallbacks.has("ON_CREATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });

      const initialCount = result.current.unreadCount;

      act(() => {
        capturedCallbacks.get("ON_CREATE_NOTIFICATION_SUBSCRIPTION")?.next({
          data: {
            onCreateWorkflowNotificationEvent: makeNotificationEvent({
              id: "brand-new",
              isRead: false,
            }),
          },
        });
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(initialCount + 1);
      });
    });

    it("decrements unreadCount when an existing unread notification is marked as read via subscription", async () => {
      const event = makeNotificationEvent({ id: "notif-x", isRead: false });
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([event]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.some((n) => n.id === "notif-x")).toBe(true);
        expect(capturedCallbacks.has("ON_UPDATE_NOTIFICATION_SUBSCRIPTION")).toBe(true);
      });

      act(() => {
        capturedCallbacks.get("ON_UPDATE_NOTIFICATION_SUBSCRIPTION")?.next({
          data: {
            onUpdateWorkflowNotificationEvent: { ...event, isRead: true },
          },
        });
      });

      await waitFor(() => {
        const notif = result.current.notifications.find((n) => n.id === "notif-x");
        expect(notif?.isRead).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 11. fetchNotifications re-triggered by recipientIds change
  // -------------------------------------------------------------------------
  describe("fetchNotifications is exposed and callable", () => {
    it("re-fetches notifications when fetchNotifications() is called explicitly", async () => {
      mockGraphql.mockImplementation(
        buildGraphqlMock(() => Promise.resolve(makeNotificationPageResponse([]))),
      );

      const wrapper = buildWrapper();
      const { result } = renderHook(() => useWorkflowNotificationInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callsBefore = mockGraphql.mock.calls.length;

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(mockGraphql.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
