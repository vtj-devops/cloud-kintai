import {
  useCreateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetWorkflowsQuery,
  useUpdateWorkflowMutation,
} from "@entities/workflow/api/workflowApi";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { act, renderHook } from "@testing-library/react";

import useWorkflows from "../useWorkflows";

jest.mock("@entities/workflow/api/workflowApi");
jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));
jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn(() => ({ version: { eq: 1 } })),
  getNextVersion: jest.fn((v) => (v ?? 0) + 1),
}));
jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onCreateWorkflow: "onCreateWorkflow",
  onUpdateWorkflow: "onUpdateWorkflow",
  onDeleteWorkflow: "onDeleteWorkflow",
}));

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUnsubscribe = jest.fn();

const mockGetQuery = useGetWorkflowsQuery as jest.Mock;
const mockCreateMutation = useCreateWorkflowMutation as jest.Mock;
const mockUpdateMutation = useUpdateWorkflowMutation as jest.Mock;
const mockDeleteMutation = useDeleteWorkflowMutation as jest.Mock;
const mockGraphqlClient = graphqlClient as unknown as { graphql: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();

  mockGetQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: mockRefetch,
  });
  mockCreateMutation.mockReturnValue([mockCreate, { isLoading: false, error: undefined }]);
  mockUpdateMutation.mockReturnValue([mockUpdate, { isLoading: false, error: undefined }]);
  mockDeleteMutation.mockReturnValue([mockDelete, { isLoading: false, error: undefined }]);

  mockGraphqlClient.graphql.mockReturnValue({
    subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
  });
});

describe("useWorkflows", () => {
  it("データがない場合は null を返す", () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    expect(result.current.workflows).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("workflows データを返す", () => {
    const workflows = [{ id: "wf-1", category: WorkflowCategory.PAID_LEAVE }];
    mockGetQuery.mockReturnValue({
      data: workflows,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    expect(result.current.workflows).toEqual(workflows);
  });

  it("isLoading 中は loading = true", () => {
    mockGetQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    expect(result.current.loading).toBe(true);
  });

  it("queryError があれば error 文字列を返す", () => {
    mockGetQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: { message: "fetch failed" },
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    expect(result.current.error).toBe("fetch failed");
  });

  it("fetchWorkflows: 認証済みの場合 refetch を呼ぶ", async () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    await act(async () => {
      await result.current.fetchWorkflows();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("fetchWorkflows: 未認証の場合 refetch を呼ばない", async () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: false }));
    await act(async () => {
      await result.current.fetchWorkflows();
    });
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it("create: mutation を呼ぶ", async () => {
    mockCreate.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ id: "wf-new" }) });
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    await act(async () => {
      await result.current.create({ staffId: "s1", status: WorkflowStatus.DRAFT, category: WorkflowCategory.PAID_LEAVE });
    });
    expect(mockCreate).toHaveBeenCalled();
  });

  it("create: 未認証の場合は例外をスロー", async () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: false }));
    await expect(
      result.current.create({ staffId: "s1", status: WorkflowStatus.DRAFT, category: WorkflowCategory.PAID_LEAVE }),
    ).rejects.toThrow("User is not authenticated");
  });

  it("remove: mutation を呼ぶ", async () => {
    mockDelete.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    await act(async () => {
      await result.current.remove("wf-1");
    });
    expect(mockDelete).toHaveBeenCalledWith({ id: "wf-1" });
  });

  it("remove: 未認証の場合は例外をスロー", async () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: false }));
    await expect(result.current.remove("wf-1")).rejects.toThrow(
      "User is not authenticated",
    );
  });

  it("update: 未認証の場合は例外をスロー", async () => {
    const { result } = renderHook(() => useWorkflows({ isAuthenticated: false }));
    await expect(result.current.update({ id: "wf-1" })).rejects.toThrow(
      "User is not authenticated",
    );
  });

  it("Subscription が購読されアンマウント時に解除される", () => {
    const { unmount } = renderHook(() => useWorkflows({ isAuthenticated: true }));
    expect(mockGraphqlClient.graphql).toHaveBeenCalledTimes(3);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
  });

  it("未認証の場合は Subscription を設定しない", () => {
    renderHook(() => useWorkflows({ isAuthenticated: false }));
    expect(mockGraphqlClient.graphql).not.toHaveBeenCalled();
  });
});
