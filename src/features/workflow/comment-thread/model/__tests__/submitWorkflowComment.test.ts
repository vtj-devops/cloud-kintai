import { submitWorkflowComment } from "../submitWorkflowComment";

const mockGraphql = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: (...args: unknown[]) => mockGraphql(...args) },
}));

jest.mock("@shared/api/graphql/documents/queries", () => ({
  getWorkflow: "getWorkflow",
}));

jest.mock("@shared/api/graphql/documents/mutations", () => ({
  updateWorkflow: "updateWorkflow",
}));

jest.mock("@features/workflow/notification/model/workflowNotificationEventService", () => ({
  publishWorkflowCommentNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@features/workflow/notifications/sendWorkflowCommentNotification", () => ({
  buildWorkflowCommentActorName: jest.fn((_s: unknown, _id: unknown, name: string) => name),
  sendWorkflowCommentNotification: jest.fn().mockResolvedValue(undefined),
}));

const BASE_WORKFLOW = {
  id: "wf1",
  version: 1,
  updatedAt: "2024-01-01T00:00:00Z",
  comments: [],
};

const NEW_COMMENT = {
  id: "c1",
  staffId: "s1",
  text: "テストコメント",
  createdAt: "2024-01-01T01:00:00Z",
};

const ARGS = {
  workflowId: "wf1",
  newComment: NEW_COMMENT,
  actorStaffId: "s1",
  actorDisplayName: "山田 太郎",
  staffs: [],
};

describe("submitWorkflowComment", () => {
  beforeEach(() => {
    mockGraphql.mockReset();
  });

  it("正常系: コメントを追加して更新済みワークフローを返す", async () => {
    const updated = { ...BASE_WORKFLOW, comments: [NEW_COMMENT], version: 2 };
    mockGraphql
      .mockResolvedValueOnce({ data: { getWorkflow: BASE_WORKFLOW } })
      .mockResolvedValueOnce({ data: { updateWorkflow: updated } });

    const result = await submitWorkflowComment(ARGS);
    expect(result).toEqual(updated);
  });

  it("同じコメントが既に存在する場合は最新ワークフローをそのまま返す", async () => {
    const workflowWithComment = { ...BASE_WORKFLOW, comments: [NEW_COMMENT] };
    mockGraphql.mockResolvedValueOnce({ data: { getWorkflow: workflowWithComment } });

    const result = await submitWorkflowComment(ARGS);
    expect(result).toEqual(workflowWithComment);
    expect(mockGraphql).toHaveBeenCalledTimes(1);
  });

  it("getWorkflow でエラーが返った場合はスロー", async () => {
    mockGraphql.mockResolvedValueOnce({
      errors: [{ message: "fetch error" }],
      data: null,
    });
    await expect(submitWorkflowComment(ARGS)).rejects.toThrow("fetch error");
  });

  it("ワークフローが見つからない場合はスロー", async () => {
    mockGraphql.mockResolvedValueOnce({ data: { getWorkflow: null } });
    await expect(submitWorkflowComment(ARGS)).rejects.toThrow(
      "指定されたワークフローが見つかりませんでした",
    );
  });

  it("updateWorkflow が null の場合はスロー", async () => {
    mockGraphql
      .mockResolvedValueOnce({ data: { getWorkflow: BASE_WORKFLOW } })
      .mockResolvedValueOnce({ data: { updateWorkflow: null } });
    await expect(submitWorkflowComment(ARGS)).rejects.toThrow(
      "コメント更新結果を取得できませんでした",
    );
  });

  it("updateWorkflow でエラーが返った場合はスロー", async () => {
    mockGraphql
      .mockResolvedValueOnce({ data: { getWorkflow: BASE_WORKFLOW } })
      .mockResolvedValueOnce({ errors: [{ message: "update failed" }], data: null });
    await expect(submitWorkflowComment(ARGS)).rejects.toThrow("update failed");
  });

  it("ConditionalCheckFailed でリトライして成功する", async () => {
    const updated = { ...BASE_WORKFLOW, comments: [NEW_COMMENT], version: 2 };
    mockGraphql
      .mockResolvedValueOnce({ data: { getWorkflow: BASE_WORKFLOW } })
      .mockResolvedValueOnce({
        errors: [{ message: "ConditionalCheckFailed" }],
        data: null,
      })
      .mockResolvedValueOnce({ data: { getWorkflow: { ...BASE_WORKFLOW, version: 2 } } })
      .mockResolvedValueOnce({ data: { updateWorkflow: updated } });

    const result = await submitWorkflowComment(ARGS);
    expect(result).toEqual(updated);
    expect(mockGraphql).toHaveBeenCalledTimes(4);
  }, 10000);

  it("メール通知失敗は握りつぶして成功を返す", async () => {
    const { sendWorkflowCommentNotification } = jest.requireMock(
      "@features/workflow/notifications/sendWorkflowCommentNotification",
    ) as { sendWorkflowCommentNotification: jest.Mock };
    sendWorkflowCommentNotification.mockRejectedValueOnce(new Error("mail error"));

    const updated = { ...BASE_WORKFLOW, comments: [NEW_COMMENT], version: 2 };
    mockGraphql
      .mockResolvedValueOnce({ data: { getWorkflow: BASE_WORKFLOW } })
      .mockResolvedValueOnce({ data: { updateWorkflow: updated } });

    await expect(submitWorkflowComment(ARGS)).resolves.toEqual(updated);
  });
});
