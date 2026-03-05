import {
  buildCreateWorkflowInput,
  buildUpdateWorkflowInput,
  validateWorkflowForm,
  type WorkflowFormState,
} from "@features/workflow/application-form/model/workflowFormModel";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

const baseState = (
  overrides: Partial<WorkflowFormState> = {},
): WorkflowFormState => ({
  categoryLabel: "",
  startDate: "",
  endDate: "",
  absenceDate: "",
  paidReason: "",
  absenceReason: "",
  overtimeDate: "",
  overtimeStart: "",
  overtimeEnd: "",
  overtimeReason: "",
  customWorkflowTitle: "",
  customWorkflowContent: "",
  ...overrides,
});

describe("validateWorkflowForm", () => {
  it("detects missing paid leave dates", () => {
    const result = validateWorkflowForm(
      baseState({ categoryLabel: "有給休暇申請", startDate: "", endDate: "" }),
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.dateError).toBe("開始日と終了日を入力してください");
  });

  it("detects invalid overtime range", () => {
    const result = validateWorkflowForm(
      baseState({
        categoryLabel: "残業申請",
        overtimeDate: "2024-01-10",
        overtimeStart: "20:00",
        overtimeEnd: "18:00",
      }),
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.overtimeError).toBe(
      "開始時刻は終了時刻より前にしてください",
    );
  });
});

describe("buildCreateWorkflowInput", () => {
  it("builds draft input without comments", () => {
    const input = buildCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: true,
      state: baseState({
        categoryLabel: "残業申請",
        overtimeDate: "2024-01-01",
      }),
      overtimeDateFallbackFactory: () => "2024-01-01",
    });
    expect(input).toEqual({
      staffId: "staff-1",
      status: WorkflowStatus.DRAFT,
      category: WorkflowCategory.OVERTIME,
      overTimeDetails: {
        date: "2024-01-01",
        startTime: "",
        endTime: "",
        reason: "",
      },
    });
  });

  it("appends submission comment when submitted", () => {
    const input = buildCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: false,
      state: baseState({ categoryLabel: "残業申請" }),
      commentOptions: {
        commentText: "custom",
        builderOptions: {
          idFactory: () => "c-1",
          timestampFactory: () => "2024-01-02T00:00:00Z",
        },
      },
    });
    expect(input.comments).toEqual([
      {
        id: "c-1",
        staffId: "system",
        text: "custom",
        createdAt: "2024-01-02T00:00:00Z",
      },
    ]);
  });
});

describe("buildUpdateWorkflowInput", () => {
  it("merges existing comments when submitting", () => {
    const input = buildUpdateWorkflowInput({
      workflowId: "wf-1",
      draftMode: false,
      state: baseState({
        categoryLabel: "残業申請",
        overtimeDate: "2024-01-05",
      }),
      existingComments: [
        {
          id: "c-0",
          staffId: "staff-1",
          text: "initial",
          createdAt: "2024-01-01T00:00:00Z",
        },
      ],
      commentOptions: {
        builderOptions: {
          idFactory: () => "c-2",
          timestampFactory: () => "2024-01-03T00:00:00Z",
        },
      },
    });
    expect(input).toEqual({
      id: "wf-1",
      status: WorkflowStatus.SUBMITTED,
      category: WorkflowCategory.OVERTIME,
      overTimeDetails: {
        date: "2024-01-05",
        startTime: "",
        endTime: "",
        reason: "",
      },
      comments: [
        {
          id: "c-0",
          staffId: "staff-1",
          text: "initial",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "c-2",
          staffId: "system",
          text: "残業申請が提出されました。",
          createdAt: "2024-01-03T00:00:00Z",
        },
      ],
    });
  });
});
