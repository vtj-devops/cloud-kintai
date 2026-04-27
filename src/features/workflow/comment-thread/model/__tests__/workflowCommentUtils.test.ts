import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import {
  commentsToWorkflowMessages,
  formatWorkflowCommentSender,
  shouldTruncateWorkflowMessage,
} from "@features/workflow/comment-thread/model/workflowCommentUtils";
import type { WorkflowComment } from "@shared/api/graphql/types";

const staffFixture = (overrides: Partial<StaffType> = {}): StaffType =>
  ({
    id: "staff-1",
    cognitoUserId: "cognito-1",
    familyName: "山田",
    givenName: "太郎",
    mailAddress: "",
    owner: false,
    role: StaffRole.STAFF,
    enabled: true,
    status: "active" as StaffType["status"],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as StaffType);

const commentFixture = (
  overrides: Partial<WorkflowComment> = {}
): WorkflowComment => ({
  __typename: "WorkflowComment",
  id: "comment-1",
  staffId: "staff-1",
  text: "テスト",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("formatWorkflowCommentSender", () => {
  it("returns システム when sender is missing", () => {
    expect(formatWorkflowCommentSender(undefined)).toBe("システム");
    expect(formatWorkflowCommentSender("   ")).toBe("システム");
  });

  it("normalizes system/bot labels", () => {
    expect(formatWorkflowCommentSender("system")).toBe("システム");
    expect(formatWorkflowCommentSender("system-auto")).toBe("システム");
    expect(formatWorkflowCommentSender("ApprovalBot")).toBe("システム");
  });

  it("returns trimmed sender otherwise", () => {
    expect(formatWorkflowCommentSender(" 田中 ")).toBe("田中");
  });
});

describe("commentsToWorkflowMessages", () => {
  const staffs: StaffType[] = [
    staffFixture(),
    staffFixture({
      id: "staff-2",
      familyName: "佐藤",
      givenName: "",
    }),
  ];

  it("maps comments to display messages with staff names", () => {
    const comments: WorkflowComment[] = [
      commentFixture({ id: "c-1", staffId: "staff-1", text: "こんにちは" }),
      commentFixture({
        id: undefined,
        staffId: "system",
        createdAt: undefined,
        text: "自動通知",
      }),
      commentFixture({ id: "c-3", staffId: "unknown", text: "??" }),
    ];

    const result = commentsToWorkflowMessages(comments, staffs, {
      generateId: () => "generated-id",
      formatTimestamp: (iso) => (iso ? `formatted:${iso}` : ""),
    });

    expect(result).toEqual([
      {
        id: "c-1",
        sender: "山田 太郎",
        staffId: "staff-1",
        text: "こんにちは",
        time: "formatted:2024-01-01T00:00:00Z",
      },
      {
        id: "generated-id",
        sender: "システム",
        staffId: "system",
        text: "自動通知",
        time: "",
      },
      {
        id: "c-3",
        sender: "unknown",
        staffId: "unknown",
        text: "??",
        time: "formatted:2024-01-01T00:00:00Z",
      },
    ]);
  });

  it("uses default formatTimestamp when not provided", () => {
    const comments = [commentFixture({ id: "c-1", staffId: "staff-1", text: "テスト" })];
    const result = commentsToWorkflowMessages(comments, staffs, {
      generateId: () => "gen-id",
    });
    expect(result).toHaveLength(1);
    expect(typeof result[0].time).toBe("string");
  });

  it("ignores null entries", () => {
    const result = commentsToWorkflowMessages(
      [commentFixture(), null],
      staffs,
      {
        generateId: () => "generated-id",
        formatTimestamp: () => "",
      }
    );
    expect(result).toHaveLength(1);
  });
});

describe("shouldTruncateWorkflowMessage", () => {
  it("returns true when line count exceeds five and not expanded", () => {
    const text = "1\n2\n3\n4\n5\n6";
    expect(shouldTruncateWorkflowMessage(text, false)).toBe(true);
  });

  it("returns true when character length exceeds 800", () => {
    const text = "x".repeat(801);
    expect(shouldTruncateWorkflowMessage(text, false)).toBe(true);
  });

  it("returns false when expanded", () => {
    const text = "1\n2\n3\n4\n5\n6";
    expect(shouldTruncateWorkflowMessage(text, true)).toBe(false);
  });
});
