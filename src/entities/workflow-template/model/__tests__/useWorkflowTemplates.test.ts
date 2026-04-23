import {
  useCreateWorkflowTemplateMutation,
  useDeleteWorkflowTemplateMutation,
  useGetWorkflowTemplatesQuery,
  useUpdateWorkflowTemplateMutation,
} from "@entities/workflow-template/api/workflowTemplateApi";
import { act,renderHook } from "@testing-library/react";

import useWorkflowTemplates from "../useWorkflowTemplates";

jest.mock("@entities/workflow-template/api/workflowTemplateApi");
jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn(() => ({ version: { eq: 1 } })),
  getNextVersion: jest.fn((v) => (v ?? 0) + 1),
}));

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockGetQuery = useGetWorkflowTemplatesQuery as jest.Mock;
const mockCreateMutation = useCreateWorkflowTemplateMutation as jest.Mock;
const mockUpdateMutation = useUpdateWorkflowTemplateMutation as jest.Mock;
const mockDeleteMutation = useDeleteWorkflowTemplateMutation as jest.Mock;

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
});

describe("useWorkflowTemplates", () => {
  const defaultParams = { isAuthenticated: true, organizationId: "org-1" };

  it("データがない場合は空配列を返す", () => {
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    expect(result.current.templates).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("templates を返す", () => {
    const templates = [{ id: "t1", title: "テンプレート1" }];
    mockGetQuery.mockReturnValue({
      data: templates,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    expect(result.current.templates).toEqual(templates);
  });

  it("isLoading 中は loading = true", () => {
    mockGetQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    expect(result.current.loading).toBe(true);
  });

  it("queryError があれば error を返す", () => {
    mockGetQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: { message: "fetch error" },
      refetch: mockRefetch,
    });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    expect(result.current.error).toBe("fetch error");
  });

  it("fetchTemplates: 認証済みの場合 refetch を呼ぶ", async () => {
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    await act(async () => {
      await result.current.fetchTemplates();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("fetchTemplates: 未認証の場合 refetch を呼ばない", async () => {
    const { result } = renderHook(() =>
      useWorkflowTemplates({ isAuthenticated: false, organizationId: "org-1" }),
    );
    await act(async () => {
      await result.current.fetchTemplates();
    });
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it("createTemplate: mutation を呼ぶ", async () => {
    mockCreate.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ id: "new-1" }) });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    await act(async () => {
      await result.current.createTemplate({ title: "New", content: "{}" });
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New", organizationId: "org-1" }),
    );
  });

  it("createTemplate: 未認証の場合は例外をスロー", async () => {
    const { result } = renderHook(() =>
      useWorkflowTemplates({ isAuthenticated: false, organizationId: "org-1" }),
    );
    await expect(result.current.createTemplate({ title: "New", content: "{}" })).rejects.toThrow(
      "User is not authenticated",
    );
  });

  it("removeTemplate: mutation を呼ぶ", async () => {
    mockDelete.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    await act(async () => {
      await result.current.removeTemplate("t1");
    });
    expect(mockDelete).toHaveBeenCalledWith({ id: "t1" });
  });

  it("removeTemplate: 未認証の場合は例外をスロー", async () => {
    const { result } = renderHook(() =>
      useWorkflowTemplates({ isAuthenticated: false, organizationId: "org-1" }),
    );
    await expect(result.current.removeTemplate("t1")).rejects.toThrow(
      "User is not authenticated",
    );
  });

  it("updateTemplate: mutation を呼ぶ", async () => {
    const templates = [{ id: "t1", title: "Old", version: 2 }];
    mockGetQuery.mockReturnValue({
      data: templates,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
    });
    mockUpdate.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ id: "t1" }) });
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    await act(async () => {
      await result.current.updateTemplate({ id: "t1", title: "New" });
    });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("string 型のエラーも error として返す", () => {
    mockCreateMutation.mockReturnValue([mockCreate, { isLoading: false, error: "string error" }]);
    const { result } = renderHook(() => useWorkflowTemplates(defaultParams));
    expect(result.current.error).toBe("string error");
  });
});
