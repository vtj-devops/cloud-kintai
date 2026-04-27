import { useAppDispatchV2 } from "@app/hooks";
import { useGetWorkflowQuery, workflowApi } from "@entities/workflow/api/workflowApi";
import { useWorkflowLoaderWorkflow, WorkflowEntity } from "@features/workflow/hooks/useWorkflowLoaderWorkflow";
import { subscribeWorkflowCommentNotifications } from "@features/workflow/notification/model/workflowNotificationEventService";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { WorkflowStatus } from "@shared/api/graphql/types";
import { act, renderHook } from "@testing-library/react";

jest.mock("@app/hooks", () => ({ useAppDispatchV2: jest.fn() }));
jest.mock("@entities/workflow/api/workflowApi", () => ({
  useGetWorkflowQuery: jest.fn(),
  workflowApi: { util: { upsertQueryData: jest.fn() } },
}));
jest.mock(
  "@features/workflow/notification/model/workflowNotificationEventService",
  () => ({
    subscribeWorkflowCommentNotifications: jest.fn(),
  }),
);
jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));
jest.mock("@shared/api/graphql/documents/queries", () => ({
  getWorkflow: "GET_WORKFLOW_QUERY",
}));
jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onUpdateWorkflow: "ON_UPDATE_WORKFLOW_SUBSCRIPTION",
}));
jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockDispatch = jest.fn();
const mockUseGetWorkflowQuery = useGetWorkflowQuery as jest.Mock;
const mockSubscribeNotifications = subscribeWorkflowCommentNotifications as jest.Mock;
const mockGraphql = graphqlClient.graphql as jest.Mock;
const mockUpsertQueryData = workflowApi.util.upsertQueryData as jest.Mock;

const makeWorkflow = (overrides: Partial<WorkflowEntity> = {}): WorkflowEntity =>
  ({
    id: "wf-1",
    status: WorkflowStatus.PENDING,
    staffId: "staff-1",
    comments: [],
    ...overrides,
  }) as WorkflowEntity;

const mockUnsubscribe = jest.fn();
const mockSubscriptionUnsubscribe = jest.fn();

function makeGraphqlMock(fetchResult?: Promise<unknown>) {
  return (input: { query: string }) => {
    if (input.query === "ON_UPDATE_WORKFLOW_SUBSCRIPTION") {
      return { subscribe: jest.fn().mockReturnValue({ unsubscribe: mockSubscriptionUnsubscribe }) };
    }
    return fetchResult ?? Promise.resolve({ data: null });
  };
}

describe("useWorkflowLoaderWorkflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppDispatchV2 as jest.Mock).mockReturnValue(mockDispatch);
    mockUseGetWorkflowQuery.mockReturnValue({ data: undefined });
    mockSubscribeNotifications.mockReturnValue(mockUnsubscribe);
    mockGraphql.mockImplementation(makeGraphqlMock());
  });

  describe("workflow derivation", () => {
    it("returns initialWorkflow when RTK Query has no data", () => {
      const wf = makeWorkflow();
      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      expect(result.current.workflow).toBe(wf);
    });

    it("returns RTK Query data when available, overriding initialWorkflow", () => {
      const initial = makeWorkflow({ id: "wf-1" });
      const fetched = makeWorkflow({ id: "wf-1", status: WorkflowStatus.APPROVED });
      mockUseGetWorkflowQuery.mockReturnValue({ data: fetched });

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(initial),
      );

      expect(result.current.workflow).toBe(fetched);
    });

    it("skips RTK Query when initialWorkflow is null", () => {
      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(null),
      );

      expect(mockUseGetWorkflowQuery).toHaveBeenCalledWith(
        "",
        expect.objectContaining({ skip: true }),
      );
      expect(result.current.workflow).toBeNull();
    });
  });

  describe("setWorkflow", () => {
    it("dispatches upsertQueryData when setWorkflow is called", () => {
      mockUpsertQueryData.mockReturnValue({ type: "mock" });
      const wf = makeWorkflow();

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      act(() => {
        result.current.setWorkflow(wf);
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("does not dispatch when workflow has no id", () => {
      const wf = makeWorkflow({ id: undefined });

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(makeWorkflow()),
      );

      act(() => {
        result.current.setWorkflow(wf);
      });

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("refetchWorkflow", () => {
    it("calls graphqlClient with workflow id", async () => {
      const wf = makeWorkflow({ id: "wf-42" });
      mockUseGetWorkflowQuery.mockReturnValue({ data: wf });
      mockUpsertQueryData.mockReturnValue({ type: "mock" });
      const fetchResult = Promise.resolve({
        data: { getWorkflow: { ...wf, status: WorkflowStatus.APPROVED } },
      });
      mockGraphql.mockImplementation(makeGraphqlMock(fetchResult));

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      await act(async () => {
        await result.current.refetchWorkflow();
      });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: "wf-42" } }),
      );
    });

    it("does nothing when workflow has no id", async () => {
      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(null),
      );

      await act(async () => {
        await result.current.refetchWorkflow();
      });

      expect(mockGraphql).not.toHaveBeenCalledWith(
        expect.objectContaining({ variables: expect.anything() }),
      );
    });

    it("throws when graphQL returns errors", async () => {
      const wf = makeWorkflow({ id: "wf-1" });
      mockUseGetWorkflowQuery.mockReturnValue({ data: wf });
      const fetchResult = Promise.resolve({
        errors: [{ message: "Not found" }],
      });
      mockGraphql.mockImplementation(makeGraphqlMock(fetchResult));

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      await expect(
        act(async () => {
          await result.current.refetchWorkflow();
        }),
      ).rejects.toThrow("Not found");
    });

    it("throws when workflow not found in response", async () => {
      const wf = makeWorkflow({ id: "wf-1" });
      mockUseGetWorkflowQuery.mockReturnValue({ data: wf });
      const fetchResult = Promise.resolve({ data: { getWorkflow: null } });
      mockGraphql.mockImplementation(makeGraphqlMock(fetchResult));

      const { result } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      await expect(
        act(async () => {
          await result.current.refetchWorkflow();
        }),
      ).rejects.toThrow("Workflow not found");
    });
  });

  describe("subscription lifecycle", () => {
    it("unsubscribes from workflow update subscription on unmount", () => {
      const wf = makeWorkflow();
      const { unmount } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf),
      );

      unmount();

      expect(mockSubscriptionUnsubscribe).toHaveBeenCalled();
    });

    it("subscribes to comment notifications when currentStaffId and onNewComment are provided", () => {
      const wf = makeWorkflow();
      const onNewComment = jest.fn();

      renderHook(() =>
        useWorkflowLoaderWorkflow(wf, {
          currentStaffId: "staff-1",
          onNewComment,
        }),
      );

      expect(mockSubscribeNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: "wf-1",
          recipientStaffId: "staff-1",
        }),
      );
    });

    it("does not subscribe to notifications when currentStaffId is missing", () => {
      const wf = makeWorkflow();

      renderHook(() =>
        useWorkflowLoaderWorkflow(wf, { onNewComment: jest.fn() }),
      );

      expect(mockSubscribeNotifications).not.toHaveBeenCalled();
    });

    it("unsubscribes from comment notifications on unmount", () => {
      const wf = makeWorkflow();
      const onNewComment = jest.fn();

      const { unmount } = renderHook(() =>
        useWorkflowLoaderWorkflow(wf, {
          currentStaffId: "staff-1",
          onNewComment,
        }),
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
