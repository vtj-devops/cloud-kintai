import { useDynamicWorkflowForm } from "@features/workflow/application-form/model/useDynamicWorkflowForm";
import { extractExistingWorkflowComments } from "@features/workflow/comment-thread/model/workflowCommentBuilder";
import { useWorkflowEditLoaderState } from "@features/workflow/hooks/useWorkflowEditLoaderState";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { act, renderHook } from "@testing-library/react";

jest.mock("@features/workflow/application-form/model/initDynamicFields", () => ({
  initDynamicFieldsFromWorkflow: jest.fn(() => ({ note: "" })),
}));
jest.mock("@features/workflow/application-form/model/useDynamicWorkflowForm");
jest.mock("@features/workflow/comment-thread/model/workflowCommentBuilder");
jest.mock("@entities/workflow/lib/workflowLabels", () => ({
  CATEGORY_LABELS: { PAID_LEAVE: "有給休暇", ABSENCE: "欠勤" },
  resolveClockCorrectionLabel: jest.fn(() => "時刻修正"),
}));
jest.mock("@shared/lib/time", () => ({
  formatDateSlash: jest.fn((d: string) => d?.replace(/-/g, "/") ?? ""),
  isoDateFromTimestamp: jest.fn((ts: string) => ts ?? ""),
}));

const mockExtractComments = extractExistingWorkflowComments as jest.Mock;
const mockUseDynamicWorkflowForm = useDynamicWorkflowForm as jest.Mock;

const stableReset = jest.fn();
const stableSetField = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockExtractComments.mockReturnValue([]);
  mockUseDynamicWorkflowForm.mockReturnValue({
    fields: { note: "" },
    setFieldValue: stableSetField,
    resetFields: stableReset,
    isDirty: false,
  });
});

const makeWorkflow = (overrides = {}) => ({
  id: "wf-1",
  staffId: "staff-1",
  organizationId: "org-1",
  category: WorkflowCategory.PAID_LEAVE,
  status: WorkflowStatus.SUBMITTED,
  overTimeDetails: null,
  createdAt: "2024-03-01T00:00:00.000Z",
  ...overrides,
});

const STAFFS = [
  { id: "staff-1", familyName: "山田", givenName: "太郎" },
  { id: "staff-2", familyName: "鈴木", givenName: "花子" },
];

describe("useWorkflowEditLoaderState", () => {
  it("初期状態でカテゴリラベルが設定される", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.category).toBe("有給休暇");
  });

  it("staffId が一致するスタッフを applicant に設定する", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.applicant?.id).toBe("staff-1");
  });

  it("staffId が staffs に存在しない場合はフォールバックスタッフを返す", () => {
    const workflow = makeWorkflow({ staffId: "unknown" });
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.applicant?.id).toBe("unknown");
    expect(result.current.applicant?.familyName).toBe("");
  });

  it("staffId が null の場合は applicant が null", () => {
    const workflow = makeWorkflow({ staffId: null });
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.applicant).toBeNull();
  });

  it("DRAFT ステータスでは draftMode = true", () => {
    const workflow = makeWorkflow({ status: WorkflowStatus.DRAFT });
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.draftMode).toBe(true);
  });

  it("SUBMITTED ステータスでは draftMode = false", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.draftMode).toBe(false);
  });

  it("setCategory でカテゴリを変更できる", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    act(() => {
      result.current.setCategory("欠勤");
    });
    expect(result.current.category).toBe("欠勤");
  });

  it("setDraftMode で draftMode を変更できる", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    act(() => {
      result.current.setDraftMode(true);
    });
    expect(result.current.draftMode).toBe(true);
  });

  it("extractExistingWorkflowComments の結果が existingComments に設定される", () => {
    const comments = [{ commentId: "c1", content: "hello", createdAt: "" }];
    mockExtractComments.mockReturnValue(comments);
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.existingComments).toEqual(comments);
  });

  it("setExistingComments でコメントを更新できる", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    const newComments = [{ commentId: "c2", content: "new", createdAt: "" }];
    act(() => {
      result.current.setExistingComments(newComments);
    });
    expect(result.current.existingComments).toEqual(newComments);
  });

  it("CLOCK_CORRECTION カテゴリは resolveClockCorrectionLabel を使う", () => {
    const workflow = makeWorkflow({ category: WorkflowCategory.CLOCK_CORRECTION });
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.category).toBe("時刻修正");
  });

  it("applicationDate が createdAt から設定される", () => {
    const workflow = makeWorkflow();
    const { result } = renderHook(() =>
      useWorkflowEditLoaderState(workflow, STAFFS),
    );
    expect(result.current.applicationDate).not.toBe("");
  });
});
