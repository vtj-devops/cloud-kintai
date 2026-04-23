import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import {
  fetchWorkflowById,
  resolveWorkflowLoaderData,
  WorkflowLoaderError,
} from "../loader";

// jsdom 環境では Response が未定義のためポリフィルを追加
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class MockResponse {
    status: number;
    body: string;
    constructor(body: string, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
  } as unknown as typeof Response;
}

// graphqlClient は setupTests.ts でグローバルモック済み
const mockedGraphql = graphqlClient.graphql as jest.Mock;

// store と workflowApi はグローバルモック不要だが loader.ts が import するためモック
jest.mock("@app/store", () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

jest.mock("@entities/workflow/api/workflowApi", () => ({
  workflowApi: {
    util: {
      upsertQueryData: jest.fn(() => ({ type: "mock-action" })),
    },
  },
}));

// ---------------------------------------------------------------------------
// WorkflowLoaderError
// ---------------------------------------------------------------------------

describe("WorkflowLoaderError", () => {
  it("message と status を正しく保持する", () => {
    const err = new WorkflowLoaderError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
  });

  it("Error のインスタンスである", () => {
    const err = new WorkflowLoaderError("Server error", 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WorkflowLoaderError);
  });

  it("status 404 と 500 の両方を正しく設定できる", () => {
    expect(new WorkflowLoaderError("msg", 404).status).toBe(404);
    expect(new WorkflowLoaderError("msg", 500).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// fetchWorkflowById
// ---------------------------------------------------------------------------

describe("fetchWorkflowById", () => {
  beforeEach(() => {
    mockedGraphql.mockReset();
  });

  it("正常レスポンスの場合ワークフローを返す", async () => {
    const mockWorkflow = { id: "wf-1", staffId: "staff-1" };
    mockedGraphql.mockResolvedValue({
      data: { getWorkflow: mockWorkflow },
      errors: undefined,
    });

    const result = await fetchWorkflowById("wf-1");
    expect(result).toEqual(mockWorkflow);
  });

  it("GraphQL エラーがある場合 WorkflowLoaderError をスローする", async () => {
    mockedGraphql.mockResolvedValue({
      data: { getWorkflow: null },
      errors: [{ message: "Unauthorized" }],
    });

    await expect(fetchWorkflowById("wf-1")).rejects.toBeInstanceOf(
      WorkflowLoaderError,
    );

    await expect(fetchWorkflowById("wf-1")).rejects.toMatchObject({
      message: "Unauthorized",
      status: 500,
    });
  });

  it("ワークフローが null の場合 404 の WorkflowLoaderError をスローする", async () => {
    mockedGraphql.mockResolvedValue({
      data: { getWorkflow: null },
      errors: undefined,
    });

    await expect(fetchWorkflowById("wf-999")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("ネットワークエラーの場合もスローする", async () => {
    mockedGraphql.mockRejectedValue(new Error("Network Error"));

    await expect(fetchWorkflowById("wf-1")).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// resolveWorkflowLoaderData
// ---------------------------------------------------------------------------

describe("resolveWorkflowLoaderData", () => {
  beforeEach(() => {
    mockedGraphql.mockReset();
  });

  it("id が undefined の場合 Response(404) をスローする", async () => {
    await expect(
      resolveWorkflowLoaderData({ id: undefined }),
    ).rejects.toBeInstanceOf(Response);
  });

  it("正常にロードできた場合 workflow を返す", async () => {
    const mockWorkflow = { id: "wf-1", staffId: "staff-1" };
    mockedGraphql.mockResolvedValue({
      data: { getWorkflow: mockWorkflow },
      errors: undefined,
    });

    const result = await resolveWorkflowLoaderData({ id: "wf-1" });
    expect(result.workflow).toEqual(mockWorkflow);
  });

  it("WorkflowLoaderError のとき Response に変換してスローする", async () => {
    mockedGraphql.mockResolvedValue({
      data: { getWorkflow: null },
      errors: undefined,
    });

    await expect(
      resolveWorkflowLoaderData({ id: "wf-999" }),
    ).rejects.toBeInstanceOf(Response);
  });
});
