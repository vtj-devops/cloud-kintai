import type { Workflow } from "@shared/api/graphql/types";
import { WorkflowCategory } from "@shared/api/graphql/types";
import { sendAdminNotificationMail } from "@shared/lib/mail/adminNotification";

import { sendWorkflowSubmissionNotification } from "../sendWorkflowSubmissionNotification";

jest.mock("@shared/lib/mail/adminNotification", () => ({
  sendAdminNotificationMail: jest.fn().mockResolvedValue(undefined),
  formatStaffDisplayName: jest.fn(
    (family?: string, given?: string, fallback?: string) =>
      family && given ? `${family} ${given}` : (fallback ?? "不明"),
  ),
  formatBelongingLabel: jest.fn(() => "部署名"),
}));

const mockSendAdminNotificationMail = sendAdminNotificationMail as jest.Mock;

const BASE_PATH = "https://example.com";

beforeAll(() => {
  process.env.VITE_BASE_PATH = BASE_PATH;
});

afterAll(() => {
  delete process.env.VITE_BASE_PATH;
});

beforeEach(() => {
  jest.clearAllMocks();
});

function makeWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: "wf-123",
    category: WorkflowCategory.PAID_LEAVE,
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
    overTimeDetails: {
      date: "2024-03-15",
      startTime: "2024-03-01T00:00:00Z",
      endTime: "2024-03-05T00:00:00Z",
    },
    ...overrides,
  } as Workflow;
}

describe("sendWorkflowSubmissionNotification", () => {
  it("workflow.id がない場合にエラーをスローする", async () => {
    await expect(
      sendWorkflowSubmissionNotification({
        staffs: [],
        applicant: null,
        workflow: makeWorkflow({ id: "" }),
      }),
    ).rejects.toThrow("Workflow identifier is missing.");
  });

  it("VITE_BASE_PATH がない場合にエラーをスローする", async () => {
    delete process.env.VITE_BASE_PATH;
    await expect(
      sendWorkflowSubmissionNotification({
        staffs: [],
        applicant: null,
        workflow: makeWorkflow(),
      }),
    ).rejects.toThrow();
    process.env.VITE_BASE_PATH = BASE_PATH;
  });

  it("sendAdminNotificationMail を適切に呼び出す", async () => {
    await sendWorkflowSubmissionNotification({
      staffs: [],
      applicant: { familyName: "山田", givenName: "太郎" } as never,
      workflow: makeWorkflow(),
    });
    expect(mockSendAdminNotificationMail).toHaveBeenCalledTimes(1);
    const { subject, body } = mockSendAdminNotificationMail.mock.calls[0][0];
    expect(subject).toContain("ワークフロー申請が届きました");
    expect(body).toContain("wf-123");
    expect(body).toContain(`${BASE_PATH}/admin/workflow/wf-123`);
  });

  it("ABSENCE カテゴリで日付範囲形式を使う", async () => {
    const workflow = makeWorkflow({
      category: WorkflowCategory.ABSENCE,
      overTimeDetails: {
        startTime: "2024-03-10T00:00:00Z",
        endTime: "2024-03-12T00:00:00Z",
      },
    });
    await sendWorkflowSubmissionNotification({
      staffs: [],
      applicant: null,
      workflow,
    });
    const { body } = mockSendAdminNotificationMail.mock.calls[0][0];
    expect(body).toContain("〜");
  });

  it("CUSTOM カテゴリで customWorkflowTitle を含む", async () => {
    const workflow = makeWorkflow({
      category: WorkflowCategory.CUSTOM,
      customWorkflowTitle: "特別申請",
      overTimeDetails: { date: "2024-03-15" },
    });
    await sendWorkflowSubmissionNotification({
      staffs: [],
      applicant: null,
      workflow,
    });
    const { body } = mockSendAdminNotificationMail.mock.calls[0][0];
    expect(body).toContain("特別申請");
  });

  it("reason が存在する場合 body に含まれる", async () => {
    const workflow = makeWorkflow({
      overTimeDetails: { date: "2024-03-15", reason: "緊急対応のため" },
    });
    await sendWorkflowSubmissionNotification({
      staffs: [],
      applicant: null,
      workflow,
    });
    const { body } = mockSendAdminNotificationMail.mock.calls[0][0];
    expect(body).toContain("緊急対応のため");
  });
});
