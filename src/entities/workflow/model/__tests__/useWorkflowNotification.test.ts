import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
// ── helpers ──────────────────────────────────────────────────────────────────
import { isAssignedAsApprover } from "@features/workflow/notification/lib/workflowNotificationUtils";
import { WorkflowCategory } from "@shared/api/graphql/types";
import { act, renderHook } from "@testing-library/react";
import React from "react";

import { useWorkflowNotification } from "../useWorkflowNotification";

// ── mock declarations ────────────────────────────────────────────────────────

const mockGraphql = jest.fn();
const mockNotify = jest.fn();
const mockUseStaffs = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: (...args: unknown[]) => mockGraphql(...args) },
}));

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({ notify: mockNotify }),
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => {
  const actual = jest.requireActual(
    "@entities/staff/model/useStaffs/useStaffs",
  );
  return {
    ...actual,
    useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
  };
});

jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock(
  "@features/workflow/notification/lib/workflowNotificationUtils",
  () => ({
    getCategoryLabel: jest.fn(() => "有給休暇申請"),
    getStaffName: jest.fn(() => "山田 太郎"),
    isAssignedAsApprover: jest.fn(() => true),
  }),
);

const mockIsAssignedAsApprover = isAssignedAsApprover as jest.Mock;

const STAFF_APPROVER = {
  id: "staff-approver",
  cognitoUserId: "cognito-approver",
  familyName: "佐藤",
  givenName: "花子",
  role: StaffRole.ADMIN,
};

const STAFF_SUBMITTER = {
  id: "staff-submitter",
  cognitoUserId: "cognito-submitter",
  familyName: "山田",
  givenName: "太郎",
  role: StaffRole.STAFF,
};

const mockUnsubscribe = jest.fn();

/** graphqlClient.graphql の subscribe を持つ Subscription を返す helper */
const makeSubscription = (
  onNext?: (data: unknown) => void,
  onError?: (error: unknown) => void,
) => ({
  subscribe: jest.fn().mockImplementation(({ next, error }) => {
    if (onNext) onNext(next);
    if (onError) onError(error);
    return { unsubscribe: mockUnsubscribe };
  }),
});

const makeWorkflowEvent = (
  overrides: Record<string, unknown> = {},
) => ({
  id: "wf-1",
  staffId: "staff-submitter",
  category: WorkflowCategory.PAID_LEAVE,
  assignedApproverStaffIds: ["staff-approver"],
  ...overrides,
});

/** AuthContext wrapper for renderHook */
function makeWrapper(
  cognitoUser: { id: string } | null,
  authStatus = "authenticated",
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthContext.Provider,
      {
        value: {
          cognitoUser: cognitoUser as never,
          authStatus: authStatus as never,
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: jest.fn(() => false),
        },
      },
      children,
    );
  }
  return Wrapper;
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("useWorkflowNotification", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseStaffs.mockReturnValue({
      staffs: [STAFF_APPROVER, STAFF_SUBMITTER],
      loading: false,
      error: null,
    });
    mockIsAssignedAsApprover.mockReturnValue(true);
    mockGraphql.mockReturnValue(makeSubscription());
  });

  describe("isSubscribed", () => {
    it("未認証の場合は isSubscribed が false になる", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" }, "unauthenticated");
      const { result } = renderHook(() => useWorkflowNotification(), {
        wrapper,
      });
      expect(result.current.isSubscribed).toBe(false);
    });

    it("enabled=false の場合は isSubscribed が false になる", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      const { result } = renderHook(() => useWorkflowNotification(false), {
        wrapper,
      });
      expect(result.current.isSubscribed).toBe(false);
    });

    it("認証済みで currentStaffId がある場合は isSubscribed が true になる", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      const { result } = renderHook(() => useWorkflowNotification(), {
        wrapper,
      });
      expect(result.current.isSubscribed).toBe(true);
    });

    it("cognitoUser が null の場合は isSubscribed が false になる", () => {
      const wrapper = makeWrapper(null);
      const { result } = renderHook(() => useWorkflowNotification(), {
        wrapper,
      });
      expect(result.current.isSubscribed).toBe(false);
    });

    it("staffs に対応するスタッフが見つからない場合は isSubscribed が false になる", () => {
      mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });
      const wrapper = makeWrapper({ id: "cognito-approver" });
      const { result } = renderHook(() => useWorkflowNotification(), {
        wrapper,
      });
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  describe("GraphQL subscription", () => {
    it("認証済みで currentStaffId がある場合にサブスクリプションを開始する", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });
      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ query: expect.anything() }),
      );
    });

    it("コンポーネントのアンマウント時にサブスクリプションを解除する", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      const { unmount } = renderHook(() => useWorkflowNotification(), {
        wrapper,
      });
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("未認証の場合はサブスクリプションを開始しない", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" }, "unauthenticated");
      renderHook(() => useWorkflowNotification(), { wrapper });
      expect(mockGraphql).not.toHaveBeenCalled();
    });

    it("enabled=false の場合はサブスクリプションを開始しない", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(false), { wrapper });
      expect(mockGraphql).not.toHaveBeenCalled();
    });

    it("currentStaffId がない場合はサブスクリプションを開始しない", () => {
      mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });
      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });
      expect(mockGraphql).not.toHaveBeenCalled();
    });
  });

  describe("通知ロジック", () => {
    it("承認者として割り当てられている場合に通知を表示する", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      const workflowEvent = makeWorkflowEvent();
      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: workflowEvent } });
      });

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "新しい申請があります",
          tone: "info",
        }),
      );
    });

    it("自分が申請者の場合は通知しない", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      // staffId が currentStaffId と同じ場合
      const workflowEvent = makeWorkflowEvent({ staffId: "staff-approver" });
      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: workflowEvent } });
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("承認者として割り当てられていない場合は通知しない", async () => {
      mockIsAssignedAsApprover.mockReturnValue(false);

      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      const workflowEvent = makeWorkflowEvent();
      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: workflowEvent } });
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("ワークフローデータが null の場合は通知しない", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: null } });
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("data が undefined の場合は通知しない", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      await act(async () => {
        capturedNext?.({ data: undefined });
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it("通知には dedupeKey が設定される", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      const workflowEvent = makeWorkflowEvent({ id: "wf-unique" });
      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: workflowEvent } });
      });

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ dedupeKey: "workflow-wf-unique" }),
      );
    });

    it("通知は autoHideMs: null で永続表示される", async () => {
      let capturedNext: ((data: unknown) => void) | undefined;
      mockGraphql.mockReturnValue({
        subscribe: jest.fn().mockImplementation(({ next }) => {
          capturedNext = next;
          return { unsubscribe: mockUnsubscribe };
        }),
      });

      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });

      await act(async () => {
        capturedNext?.({ data: { onCreateWorkflow: makeWorkflowEvent() } });
      });

      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ autoHideMs: null }),
      );
    });
  });

  describe("useStaffs への引数", () => {
    it("認証済みの場合は isAuthenticated: true を渡す", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" });
      renderHook(() => useWorkflowNotification(), { wrapper });
      expect(mockUseStaffs).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true }),
      );
    });

    it("未認証の場合は isAuthenticated: false を渡す", () => {
      const wrapper = makeWrapper({ id: "cognito-approver" }, "unauthenticated");
      renderHook(() => useWorkflowNotification(), { wrapper });
      expect(mockUseStaffs).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: false }),
      );
    });
  });
});
