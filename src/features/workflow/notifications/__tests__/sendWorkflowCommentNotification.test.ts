import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

import {
  buildWorkflowCommentActorName,
  sendWorkflowCommentNotification,
} from "../sendWorkflowCommentNotification";

const mockGraphql = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: (...args: unknown[]) => mockGraphql(...args) },
}));

jest.mock("@shared/api/graphql/documents/queries", () => ({
  sendMail: "sendMail",
}));

jest.mock("@entities/workflow/lib/workflowLabels", () => ({
  getWorkflowCategoryLabel: jest.fn(() => "有給休暇申請"),
}));

jest.mock("@shared/lib/mail/adminNotification", () => ({
  formatStaffDisplayName: jest.fn(
    (family: string | null, given: string | null, fallback: string) =>
      family && given ? `${family} ${given}` : fallback,
  ),
}));

const BASE_WORKFLOW = {
  __typename: "Workflow" as const,
  id: "wf1",
  staffId: "applicant1",
  status: WorkflowStatus.SUBMITTED,
  category: WorkflowCategory.PAID_LEAVE,
  updatedAt: "2024-03-01T10:00:00Z",
  createdAt: "2024-03-01T09:00:00Z",
};

const ADMIN_STAFF = {
  id: "admin1",
  familyName: "管理",
  givenName: "者",
  mailAddress: "admin@example.com",
  role: "ADMIN",
};

const APPLICANT_STAFF = {
  id: "applicant1",
  familyName: "申請",
  givenName: "者",
  mailAddress: "applicant@example.com",
  role: "STAFF",
};

const BASE_ARGS = {
  workflow: BASE_WORKFLOW,
  actorStaffId: "admin1",
  actorDisplayName: "管理 者",
  commentText: "コメント内容",
  staffs: [ADMIN_STAFF, APPLICANT_STAFF],
};

describe("sendWorkflowCommentNotification", () => {
  beforeAll(() => {
    process.env.VITE_BASE_PATH = "https://example.com";
  });

  afterAll(() => {
    delete process.env.VITE_BASE_PATH;
  });

  beforeEach(() => {
    mockGraphql.mockReset().mockResolvedValue({});
  });

  it("管理者がコメントした場合: 申請者にメールを送る", async () => {
    await sendWorkflowCommentNotification(BASE_ARGS);
    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          data: expect.objectContaining({
            to: ["applicant@example.com"],
          }),
        }),
      }),
    );
  });

  it("管理者がコメントした場合: 申請者メールがない場合は送らない", async () => {
    const staffs = [
      ADMIN_STAFF,
      { ...APPLICANT_STAFF, mailAddress: null as unknown as string },
    ];
    await sendWorkflowCommentNotification({ ...BASE_ARGS, staffs });
    expect(mockGraphql).not.toHaveBeenCalled();
  });

  it("スタッフがコメントした場合: 管理者にメールを送る", async () => {
    await sendWorkflowCommentNotification({
      ...BASE_ARGS,
      actorStaffId: "applicant1",
      actorDisplayName: "申請 者",
    });
    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          data: expect.objectContaining({
            to: ["admin@example.com"],
          }),
        }),
      }),
    );
  });

  it("管理者が存在しない場合は送らない", async () => {
    const staffs = [APPLICANT_STAFF];
    await sendWorkflowCommentNotification({
      ...BASE_ARGS,
      actorStaffId: "applicant1",
      staffs,
    });
    expect(mockGraphql).not.toHaveBeenCalled();
  });

  it("VITE_BASE_PATH 未設定の場合はエラー", async () => {
    delete process.env.VITE_BASE_PATH;
    await expect(sendWorkflowCommentNotification(BASE_ARGS)).rejects.toThrow();
    process.env.VITE_BASE_PATH = "https://example.com";
  });

  it("管理者 URL は /admin/workflow/wf1 になる", async () => {
    await sendWorkflowCommentNotification({
      ...BASE_ARGS,
      actorStaffId: "applicant1",
    });
    const call = mockGraphql.mock.calls[0][0];
    expect(call.variables.data.body).toContain("/admin/workflow/wf1");
  });

  it("コメントが空の場合はデフォルトテキストを使う", async () => {
    await sendWorkflowCommentNotification({ ...BASE_ARGS, commentText: "  " });
    const call = mockGraphql.mock.calls[0][0];
    expect(call.variables.data.body).toContain("(コメント本文なし)");
  });
});

describe("buildWorkflowCommentActorName", () => {
  const STAFFS = [
    { id: "s1", familyName: "山田", givenName: "太郎", mailAddress: "yamada@example.com", role: "STAFF" },
  ];

  it("スタッフが見つかった場合は表示名を返す", () => {
    const result = buildWorkflowCommentActorName(STAFFS, "s1", "フォールバック");
    expect(result).toBe("山田 太郎");
  });

  it("スタッフが見つからない場合はフォールバックを返す", () => {
    const result = buildWorkflowCommentActorName(STAFFS, "unknown", "フォールバック");
    expect(result).toBe("フォールバック");
  });
});
