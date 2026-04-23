import { subscribeWorkflowCommentNotifications } from "@features/workflow/notification/model/workflowNotificationEventService";
import { useWorkflowDetailData } from "@pages/admin/AdminWorkflow/hooks/useWorkflowDetailData";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { getWorkflow } from "@shared/api/graphql/documents/queries";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));

jest.mock(
  "@features/workflow/notification/model/workflowNotificationEventService",
);

jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockGraphql = graphqlClient.graphql as jest.Mock;
const mockSubscribeNotifications =
  subscribeWorkflowCommentNotifications as jest.Mock;

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest
  .fn()
  .mockReturnValue({ unsubscribe: mockUnsubscribe });
const mockUnsubscribeNotification = jest.fn();

const makeWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: "wf-1",
  staffId: "staff-1",
  status: "PENDING",
  createdAt: "1700000000000",
  comments: [],
  ...overrides,
});

/**
 * graphqlClient.graphql を query-aware モックとして設定するヘルパー。
 * getWorkflow クエリには fetchResult を返し、それ以外（subscription）は
 * { subscribe: mockSubscribe } を返す。
 */
const setupGraphqlMock = (
  fetchResult: unknown = { data: { getWorkflow: makeWorkflow() }, errors: [] },
) => {
  mockGraphql.mockImplementation(
    ({ query }: { query: string }) => {
      if (query === getWorkflow) {
        return Promise.resolve(fetchResult);
      }
      return { subscribe: mockSubscribe };
    },
  );
};

describe("useWorkflowDetailData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGraphql.mockReturnValue({ subscribe: mockSubscribe });
    mockSubscribeNotifications.mockReturnValue(mockUnsubscribeNotification);
  });

  it("starts with null workflow and no loading when id is undefined", async () => {
    const { result } = renderHook(() => useWorkflowDetailData(undefined));

    expect(result.current.workflow).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches workflow when id is provided", async () => {
    const workflow = makeWorkflow();
    setupGraphqlMock({ data: { getWorkflow: workflow }, errors: [] });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => {
      expect(result.current.workflow).toBeTruthy();
    });

    expect(result.current.workflow?.id).toBe("wf-1");
    expect(result.current.error).toBeNull();
  });

  it("sets loading to true during fetch and false after", async () => {
    let resolveFetch!: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockGraphql.mockImplementation(({ query }: { query: string }) => {
      if (query === getWorkflow) return fetchPromise;
      return { subscribe: mockSubscribe };
    });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveFetch({
        data: { getWorkflow: makeWorkflow() },
        errors: [],
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets error when workflow is not found", async () => {
    setupGraphqlMock({ data: { getWorkflow: null }, errors: [] });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.workflow).toBeNull();
    expect(result.current.error).toContain("見つかりませんでした");
  });

  it("sets error when graphql throws", async () => {
    mockGraphql.mockImplementation(({ query }: { query: string }) => {
      if (query === getWorkflow) return Promise.reject(new Error("Network error"));
      return { subscribe: mockSubscribe };
    });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toBe("Network error");
  });

  it("sets error when response has GraphQL errors", async () => {
    setupGraphqlMock({ data: null, errors: [{ message: "Unauthorized" }] });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => {
      expect(result.current.error).toBe("Unauthorized");
    });
  });

  it("subscribes to workflow updates when id is provided", async () => {
    setupGraphqlMock();

    const { unmount } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("does not subscribe when id is undefined", () => {
    renderHook(() => useWorkflowDetailData(undefined));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("allows setting workflow via setWorkflow", async () => {
    setupGraphqlMock();

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => expect(result.current.workflow).toBeTruthy());

    const updatedWorkflow = makeWorkflow({ status: "APPROVED" });
    act(() => {
      result.current.setWorkflow(updatedWorkflow as never);
    });

    expect(result.current.workflow?.status).toBe("APPROVED");
  });

  it("subscribes to comment notifications when currentStaffId and onNewComment are provided", async () => {
    setupGraphqlMock();

    const onNewComment = jest.fn();
    const { unmount } = renderHook(() =>
      useWorkflowDetailData("wf-1", {
        currentStaffId: "staff-1",
        onNewComment,
      }),
    );

    await waitFor(() =>
      expect(mockSubscribeNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: "wf-1",
          recipientStaffId: "staff-1",
        }),
      ),
    );

    unmount();
    expect(mockUnsubscribeNotification).toHaveBeenCalled();
  });

  it("does not subscribe to notifications when currentStaffId is missing", async () => {
    setupGraphqlMock();

    renderHook(() =>
      useWorkflowDetailData("wf-1", {
        onNewComment: jest.fn(),
      }),
    );

    await waitFor(() => expect(mockGraphql).toHaveBeenCalled());
    expect(mockSubscribeNotifications).not.toHaveBeenCalled();
  });

  it("calls refetchWorkflow to reload workflow data", async () => {
    const workflow = makeWorkflow();
    const updatedWorkflow = makeWorkflow({ status: "APPROVED" });
    let callCount = 0;

    mockGraphql.mockImplementation(({ query }: { query: string }) => {
      if (query === getWorkflow) {
        callCount++;
        const data = callCount === 1 ? workflow : updatedWorkflow;
        return Promise.resolve({ data: { getWorkflow: data }, errors: [] });
      }
      return { subscribe: mockSubscribe };
    });

    const { result } = renderHook(() => useWorkflowDetailData("wf-1"));

    await waitFor(() => expect(result.current.workflow?.status).toBe("PENDING"));

    await act(async () => {
      await result.current.refetchWorkflow();
    });

    expect(result.current.workflow?.status).toBe("APPROVED");
  });
});
