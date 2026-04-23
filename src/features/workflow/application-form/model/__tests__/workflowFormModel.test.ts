import {
  buildDynamicCreateWorkflowInput,
  buildDynamicUpdateWorkflowInput,
  type DynamicWorkflowFormState,
  validateDynamicWorkflowForm,
} from "@features/workflow/application-form/model/dynamicWorkflowFormModel";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

// YAML をテスト用の最小設定で差し替え
jest.mock("@features/workflow/config/workflow-types.yaml", () => ({
  types: [
    {
      id: "PAID_LEAVE",
      label: "有給休暇申請",
      fields: [
        {
          key: "dateRange",
          type: "date_range",
          label: "取得期間",
          required: true,
          validation: { startBeforeEnd: true },
        },
        { key: "reason", type: "text", label: "申請理由" },
      ],
      payload: {
        type: "overTimeDetails",
        mapping: {
          date: "fields.dateRange.start",
          startTime: "fields.dateRange.start",
          endTime: "fields.dateRange.end",
          reason: "fields.reason",
        },
      },
    },
    {
      id: "OVERTIME",
      label: "残業申請",
      fields: [
        { key: "date", type: "date", label: "残業予定日", required: true },
        {
          key: "timeRange",
          type: "time_range",
          label: "残業予定時間",
          required: true,
          validation: { startBeforeEnd: true },
        },
        { key: "reason", type: "text", label: "残業理由" },
      ],
      payload: {
        type: "overTimeDetails",
        mapping: {
          date: "fields.date",
          startTime: "fields.timeRange.start",
          endTime: "fields.timeRange.end",
          reason: "fields.reason",
        },
      },
    },
    {
      id: "SCHEDULE",
      label: "スケジュール申請",
      fields: [
        {
          key: "startTime",
          type: "time",
          label: "開始時刻",
          required: true,
        },
      ],
      payload: { type: "overTimeDetails", mapping: { startTime: "fields.startTime" } },
    },
    {
      id: "CUSTOM",
      label: "その他",
      fields: [
        { key: "template", type: "template_select", label: "テンプレート" },
        { key: "title", type: "text", label: "タイトル", required: true },
        {
          key: "content",
          type: "textarea",
          label: "詳細",
          required: true,
        },
      ],
      payload: {
        type: "custom",
        mapping: {
          customWorkflowTitle: "fields.title",
          customWorkflowContent: "fields.content",
        },
      },
    },
  ],
}));

const state = (
  categoryLabel: string,
  fields: Record<string, unknown> = {},
): DynamicWorkflowFormState => ({ categoryLabel, fields });

// ---------------------------------------------------------------------------
// validateDynamicWorkflowForm
// ---------------------------------------------------------------------------

describe("validateDynamicWorkflowForm", () => {
  it("detects missing paid leave dates", () => {
    const result = validateDynamicWorkflowForm(
      state("有給休暇申請", { dateRange: { start: "", end: "" } }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.dateRange).toBeTruthy();
  });

  it("detects invalid paid leave date range (start > end)", () => {
    const result = validateDynamicWorkflowForm(
      state("有給休暇申請", {
        dateRange: { start: "2024-01-15", end: "2024-01-10" },
      }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.dateRange).toBeTruthy();
  });

  it("passes valid paid leave", () => {
    const result = validateDynamicWorkflowForm(
      state("有給休暇申請", {
        dateRange: { start: "2024-01-10", end: "2024-01-15" },
      }),
    );
    expect(result.isValid).toBe(true);
  });

  it("detects invalid overtime time range (start >= end)", () => {
    const result = validateDynamicWorkflowForm(
      state("残業申請", {
        date: "2024-01-10",
        timeRange: {
          start: "2024-01-10T20:00:00+09:00",
          end: "2024-01-10T18:00:00+09:00",
        },
      }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.timeRange).toBeTruthy();
  });

  it("detects missing custom title", () => {
    const result = validateDynamicWorkflowForm(
      state("その他", { title: "", content: "詳細" }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.title).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// buildDynamicCreateWorkflowInput
// ---------------------------------------------------------------------------

describe("buildDynamicCreateWorkflowInput", () => {
  it("builds draft input for paid leave", () => {
    const input = buildDynamicCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: true,
      state: state("有給休暇申請", {
        dateRange: { start: "2024-01-10", end: "2024-01-15" },
        reason: "私用のため",
      }),
    });

    expect(input).toMatchObject({
      staffId: "staff-1",
      status: WorkflowStatus.DRAFT,
      category: WorkflowCategory.PAID_LEAVE,
      overTimeDetails: {
        date: "2024-01-10",
        startTime: "2024-01-10",
        endTime: "2024-01-15",
        reason: "私用のため",
      },
    });
    expect(input.comments).toBeUndefined();
  });

  it("appends submission comment when submitted", () => {
    const input = buildDynamicCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: false,
      state: state("残業申請", {
        date: "2024-01-10",
        timeRange: { start: null, end: null },
      }),
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

  it("builds custom workflow input", () => {
    const input = buildDynamicCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: true,
      state: state("その他", {
        title: "My Title",
        content: "My Content",
      }),
    });

    expect(input).toMatchObject({
      category: WorkflowCategory.CUSTOM,
      customWorkflowTitle: "My Title",
      customWorkflowContent: "My Content",
    });
  });
});

// ---------------------------------------------------------------------------
// buildDynamicUpdateWorkflowInput
// ---------------------------------------------------------------------------

describe("buildDynamicUpdateWorkflowInput", () => {
  it("merges existing comments when submitting", () => {
    const input = buildDynamicUpdateWorkflowInput({
      workflowId: "wf-1",
      draftMode: false,
      state: state("残業申請", {
        date: "2024-01-05",
        timeRange: { start: null, end: null },
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

    expect(input.id).toBe("wf-1");
    expect(input.status).toBe(WorkflowStatus.SUBMITTED);
    const comments = input.comments!;
    expect(comments).toHaveLength(2);
    expect(comments[0]?.id).toBe("c-0");
    expect(comments[1]?.id).toBe("c-2");
  });
});

// ---------------------------------------------------------------------------
// 追加: 未カバーのバリデーションケース
// ---------------------------------------------------------------------------

describe("validateDynamicWorkflowForm (additional coverage)", () => {
  it("time フィールドが未入力の場合にエラーを返す", () => {
    const result = validateDynamicWorkflowForm(
      state("スケジュール申請", { startTime: null }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.startTime).toBeTruthy();
  });

  it("time フィールドが入力済みの場合に通過する", () => {
    const result = validateDynamicWorkflowForm(
      state("スケジュール申請", { startTime: "2024-03-15T09:00:00+09:00" }),
    );
    expect(result.isValid).toBe(true);
  });

  it("time_range の start のみ欠落でエラー", () => {
    const result = validateDynamicWorkflowForm(
      state("残業申請", {
        date: "2024-01-10",
        timeRange: { start: null, end: "2024-01-10T20:00:00+09:00" },
      }),
    );
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.timeRange).toBeTruthy();
  });

  it("カテゴリラベルが存在しない場合は isValid false を返す", () => {
    const result = validateDynamicWorkflowForm(state("__unknown__"));
    expect(result.isValid).toBe(false);
  });
});

describe("buildDynamicCreateWorkflowInput (custom payload)", () => {
  it("custom payload で customWorkflowTitle と content を設定する", () => {
    const input = buildDynamicCreateWorkflowInput({
      staffId: "staff-1",
      draftMode: false,
      state: state("その他", { title: "テストタイトル", content: "詳細内容" }),
    });
    expect(input.customWorkflowTitle).toBe("テストタイトル");
    expect((input as Record<string, unknown>).customWorkflowContent).toBe("詳細内容");
  });
});
