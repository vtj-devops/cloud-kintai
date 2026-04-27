import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import {
  type NotificationStaff,
  publishWorkflowCommentNotifications,
  subscribeWorkflowCommentNotifications,
  type WorkflowData,
} from "../workflowNotificationEventService";

// graphqlClient は setupTests.ts でグローバルモック済み
const mockedGraphql = graphqlClient.graphql as jest.Mock;

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------

const buildWorkflow = (overrides: Partial<WorkflowData> = {}): WorkflowData =>
  ({
    id: "wf-1",
    staffId: "applicant-1",
    ...overrides,
  }) as WorkflowData;

const buildStaff = (overrides: Partial<NotificationStaff> = {}): NotificationStaff => ({
  id: "staff-1",
  familyName: "田中",
  givenName: "花子",
  role: "Staff",
  ...overrides,
});

// ---------------------------------------------------------------------------
// publishWorkflowCommentNotifications
// ---------------------------------------------------------------------------

describe("publishWorkflowCommentNotifications", () => {
  beforeEach(() => {
    mockedGraphql.mockReset();
    mockedGraphql.mockResolvedValue({ data: { createWorkflowNotificationEvent: { id: "evt-1" } }, errors: undefined });
  });

  it("管理者がコメントした場合、申請者に通知を送信する", async () => {
    const workflow = buildWorkflow({ staffId: "applicant-1" });
    const staffs = [
      buildStaff({ id: "admin-1", role: "Admin" }),
      buildStaff({ id: "applicant-1", role: "Staff" }),
    ];

    await publishWorkflowCommentNotifications({
      workflow,
      actorStaffId: "admin-1",
      actorDisplayName: "田中管理者",
      commentId: "comment-1",
      staffs,
    });

    expect(mockedGraphql).toHaveBeenCalledTimes(1);
    const callArgs = mockedGraphql.mock.calls[0][0] as {
      variables: { input: { recipientStaffId: string } };
    };
    expect(callArgs.variables.input.recipientStaffId).toBe("applicant-1");
  });

  it("スタッフがコメントした場合、ADMINS に通知を送信する", async () => {
    const workflow = buildWorkflow({ staffId: "applicant-1" });
    const staffs = [
      buildStaff({ id: "applicant-1", role: "Staff" }),
    ];

    await publishWorkflowCommentNotifications({
      workflow,
      actorStaffId: "applicant-1",
      actorDisplayName: "申請者",
      commentId: "comment-2",
      staffs,
    });

    expect(mockedGraphql).toHaveBeenCalledTimes(1);
    const callArgs = mockedGraphql.mock.calls[0][0] as {
      variables: { input: { recipientStaffId: string } };
    };
    expect(callArgs.variables.input.recipientStaffId).toBe("ADMINS");
  });

  it("管理者が自分の申請にコメントした場合は通知を送らない", async () => {
    // 管理者が applicant かつ actor の場合 → 受信者なし
    const workflow = buildWorkflow({ staffId: "admin-1" });
    const staffs = [
      buildStaff({ id: "admin-1", role: "Admin" }),
    ];

    await publishWorkflowCommentNotifications({
      workflow,
      actorStaffId: "admin-1",
      actorDisplayName: "管理者",
      commentId: "comment-3",
      staffs,
    });

    // applicantId === actorStaffId なので recipients は空 → graphql 未呼び出し
    expect(mockedGraphql).not.toHaveBeenCalled();
  });

  it("StaffAdmin ロールも管理者として判定し申請者に通知を送信する", async () => {
    const workflow = buildWorkflow({ staffId: "applicant-1" });
    const staffs = [
      buildStaff({ id: "staff-admin-1", role: "StaffAdmin" }),
      buildStaff({ id: "applicant-1", role: "Staff" }),
    ];

    await publishWorkflowCommentNotifications({
      workflow,
      actorStaffId: "staff-admin-1",
      actorDisplayName: "スタッフ管理者",
      commentId: "comment-4",
      staffs,
    });

    expect(mockedGraphql).toHaveBeenCalledTimes(1);
    const callArgs = mockedGraphql.mock.calls[0][0] as {
      variables: { input: { recipientStaffId: string } };
    };
    expect(callArgs.variables.input.recipientStaffId).toBe("applicant-1");
  });

  it("Owner ロールも管理者として判定し申請者に通知を送信する", async () => {
    const workflow = buildWorkflow({ staffId: "applicant-1" });
    const staffs = [
      buildStaff({ id: "owner-1", role: "Owner" }),
      buildStaff({ id: "applicant-1", role: "Staff" }),
    ];

    await publishWorkflowCommentNotifications({
      workflow,
      actorStaffId: "owner-1",
      actorDisplayName: "オーナー",
      commentId: "comment-5",
      staffs,
    });

    expect(mockedGraphql).toHaveBeenCalledTimes(1);
    const callArgs = mockedGraphql.mock.calls[0][0] as {
      variables: { input: { recipientStaffId: string } };
    };
    expect(callArgs.variables.input.recipientStaffId).toBe("applicant-1");
  });

  it("GraphQL エラーの場合もスローせず（Promise.allSettled）処理を完了する", async () => {
    mockedGraphql.mockResolvedValue({
      data: {},
      errors: [{ message: "Some error" }],
    });

    const workflow = buildWorkflow({ staffId: "applicant-1" });
    const staffs = [buildStaff({ id: "applicant-1", role: "Staff" })];

    // エラーがあっても例外は投げない（allSettled で吸収）
    await expect(
      publishWorkflowCommentNotifications({
        workflow,
        actorStaffId: "applicant-1",
        actorDisplayName: "申請者",
        commentId: "comment-6",
        staffs,
      }),
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// subscribeWorkflowCommentNotifications
// ---------------------------------------------------------------------------

describe("subscribeWorkflowCommentNotifications", () => {
  it("購読を開始し受信したイベントを onReceived に渡す", () => {
    const unsubscribeMock = jest.fn();
    const subscribeMock = jest.fn().mockReturnValue({ unsubscribe: unsubscribeMock });
    mockedGraphql.mockReturnValue({ subscribe: subscribeMock });

    const onReceived = jest.fn();
    const unsubscribe = subscribeWorkflowCommentNotifications({
      workflowId: "wf-1",
      recipientStaffId: "staff-1",
      onReceived,
    });

    // subscribe が呼ばれていること
    expect(subscribeMock).toHaveBeenCalledTimes(1);

    // subscribe コールバックを手動で呼び出してイベント受信をシミュレート
    const observer = subscribeMock.mock.calls[0][0] as {
      next: (payload: unknown) => void;
    };
    observer.next({
      data: {
        onCreateWorkflowNotificationEvent: {
          id: "evt-1",
          recipientStaffId: "staff-1",
          actorStaffId: "actor-1",
          workflowId: "wf-1",
          eventType: "WORKFLOW_COMMENT",
          title: "新着コメント",
          body: "コメントが届きました",
          isRead: false,
          eventAt: "2024-01-01T00:00:00Z",
        },
      },
    });

    expect(onReceived).toHaveBeenCalledTimes(1);

    // unsubscribe 関数が返されること
    unsubscribe();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("onCreateWorkflowNotificationEvent が null の場合 onReceived を呼ばない", () => {
    const subscribeMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    mockedGraphql.mockReturnValue({ subscribe: subscribeMock });

    const onReceived = jest.fn();
    subscribeWorkflowCommentNotifications({
      workflowId: "wf-1",
      recipientStaffId: "staff-1",
      onReceived,
    });

    const observer = subscribeMock.mock.calls[0][0] as {
      next: (payload: unknown) => void;
    };
    observer.next({ data: { onCreateWorkflowNotificationEvent: null } });

    expect(onReceived).not.toHaveBeenCalled();
  });

  it("workflowId が未指定の場合でも購読できる", () => {
    const subscribeMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    mockedGraphql.mockReturnValue({ subscribe: subscribeMock });

    subscribeWorkflowCommentNotifications({
      workflowId: undefined,
      recipientStaffId: "staff-1",
      onReceived: jest.fn(),
    });

    // workflowId なしでも subscribe が呼ばれる
    expect(subscribeMock).toHaveBeenCalledTimes(1);
  });

  it("エラーハンドラーが提供された場合はそちらを呼び出す", () => {
    const subscribeMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    mockedGraphql.mockReturnValue({ subscribe: subscribeMock });

    const onError = jest.fn();
    subscribeWorkflowCommentNotifications({
      workflowId: "wf-1",
      recipientStaffId: "staff-1",
      onReceived: jest.fn(),
      onError,
    });

    const observer = subscribeMock.mock.calls[0][0] as {
      error: (err: unknown) => void;
    };
    observer.error(new Error("Connection failed"));

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
