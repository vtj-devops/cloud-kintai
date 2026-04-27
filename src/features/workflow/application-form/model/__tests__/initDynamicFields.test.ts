import { initDynamicFieldsFromWorkflow } from "@features/workflow/application-form/model/initDynamicFields";
import type { WorkflowEntity } from "@features/workflow/hooks/useWorkflowLoaderWorkflow";

// ---------------------------------------------------------------------------
// isoDateFromTimestamp / parseTimeToISO をモック
// isoDateFromTimestamp は "T" の前の日付部分を返す単純な変換
// parseTimeToISO はタイムゾーン依存のため、モックで固定値を返す
// ---------------------------------------------------------------------------
jest.mock("@shared/lib/time", () => ({
  isoDateFromTimestamp: (ts?: string | null) => (ts ? ts.split("T")[0] : ""),
  parseTimeToISO: (time: string, date: string) => `${date}T${time}:00.000Z`,
}));

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------

type OverrideFields = {
  overTimeDetails?: Partial<{
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }> | null;
  customWorkflowTitle?: string | null;
  customWorkflowContent?: string | null;
};

/** 最小限の WorkflowEntity を構築するヘルパー */
const buildEntity = (overrides: OverrideFields = {}): WorkflowEntity =>
  ({
    id: "wf-1",
    staffId: "staff-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    overTimeDetails: null,
    customWorkflowTitle: null,
    customWorkflowContent: null,
    ...overrides,
  }) as unknown as WorkflowEntity;

// ---------------------------------------------------------------------------
// initDynamicFieldsFromWorkflow
// ---------------------------------------------------------------------------

describe("initDynamicFieldsFromWorkflow", () => {
  describe("有給休暇申請", () => {
    it("overTimeDetails の startTime / endTime / reason を dateRange と reason にマッピングする", () => {
      const entity = buildEntity({
        overTimeDetails: {
          startTime: "2024-03-01",
          endTime: "2024-03-05",
          reason: "旅行",
        },
      });
      const result = initDynamicFieldsFromWorkflow("有給休暇申請", entity);
      expect(result).toEqual({
        dateRange: { start: "2024-03-01", end: "2024-03-05" },
        reason: "旅行",
      });
    });

    it("overTimeDetails が null の場合は空文字でフォールバックする", () => {
      const entity = buildEntity({ overTimeDetails: null });
      const result = initDynamicFieldsFromWorkflow("有給休暇申請", entity);
      expect(result).toEqual({
        dateRange: { start: "", end: "" },
        reason: "",
      });
    });
  });

  describe("欠勤申請", () => {
    it("date を ISO 日付に変換し reason をマッピングする", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-04-10T00:00:00Z", reason: "体調不良" },
      });
      const result = initDynamicFieldsFromWorkflow("欠勤申請", entity);
      expect(result).toEqual({ date: "2024-04-10", reason: "体調不良" });
    });

    it("date が null の場合は空文字を返す", () => {
      const entity = buildEntity({ overTimeDetails: { date: null } });
      const result = initDynamicFieldsFromWorkflow("欠勤申請", entity);
      expect(result).toMatchObject({ date: "" });
    });
  });

  describe("残業申請", () => {
    it("date・timeRange・reason を正しくマッピングする", () => {
      const entity = buildEntity({
        overTimeDetails: {
          date: "2024-05-20",
          startTime: "18:00",
          endTime: "21:00",
          reason: "システム対応",
        },
      });
      const result = initDynamicFieldsFromWorkflow("残業申請", entity);
      expect(result).toMatchObject({
        date: "2024-05-20",
        reason: "システム対応",
      });
      // timeRange の start / end が設定されていること
      const typed = result as {
        timeRange: { start: string | null; end: string | null };
      };
      expect(typed.timeRange.start).toBeTruthy();
      expect(typed.timeRange.end).toBeTruthy();
    });

    it("startTime が null の場合 timeRange.start は null になる", () => {
      const entity = buildEntity({
        overTimeDetails: {
          date: "2024-05-20",
          startTime: null,
          endTime: null,
        },
      });
      const result = initDynamicFieldsFromWorkflow("残業申請", entity) as {
        timeRange: { start: string | null; end: string | null };
      };
      expect(result.timeRange.start).toBeNull();
      expect(result.timeRange.end).toBeNull();
    });
  });

  describe("打刻修正(出勤忘れ)", () => {
    it("date と checkInTime を返す", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-06-01", startTime: "09:00" },
      });
      const result = initDynamicFieldsFromWorkflow(
        "打刻修正(出勤忘れ)",
        entity,
      );
      expect(result).toMatchObject({ date: "2024-06-01" });
      const typed = result as { checkInTime: string | null };
      expect(typed.checkInTime).toBeTruthy();
    });

    it("startTime が null の場合 checkInTime は null になる", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-06-01", startTime: null },
      });
      const result = initDynamicFieldsFromWorkflow(
        "打刻修正(出勤忘れ)",
        entity,
      ) as { checkInTime: string | null };
      expect(result.checkInTime).toBeNull();
    });
  });

  describe("打刻修正(退勤忘れ)", () => {
    it("date と checkOutTime を返す", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-06-02", endTime: "18:00" },
      });
      const result = initDynamicFieldsFromWorkflow(
        "打刻修正(退勤忘れ)",
        entity,
      );
      expect(result).toMatchObject({ date: "2024-06-02" });
      const typed = result as { checkOutTime: string | null };
      expect(typed.checkOutTime).toBeTruthy();
    });

    it("endTime が null の場合 checkOutTime は null になる", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-06-02", endTime: null },
      });
      const result = initDynamicFieldsFromWorkflow(
        "打刻修正(退勤忘れ)",
        entity,
      ) as { checkOutTime: string | null };
      expect(result.checkOutTime).toBeNull();
    });
  });

  describe("振替休暇申請", () => {
    it("targetDate・compensatoryDate・reason を返す", () => {
      const entity = buildEntity({
        overTimeDetails: {
          date: "2024-07-15",
          startTime: "2024-07-20",
          reason: "休日出勤の代休",
        },
      });
      const result = initDynamicFieldsFromWorkflow("振替休暇申請", entity);
      expect(result).toEqual({
        targetDate: "2024-07-15",
        compensatoryDate: "2024-07-20",
        reason: "休日出勤の代休",
      });
    });

    it("startTime が null の場合 compensatoryDate は空文字になる", () => {
      const entity = buildEntity({
        overTimeDetails: { date: "2024-07-15", startTime: null },
      });
      const result = initDynamicFieldsFromWorkflow("振替休暇申請", entity);
      expect(result).toMatchObject({ compensatoryDate: "" });
    });
  });

  describe("その他", () => {
    it("customWorkflowTitle と customWorkflowContent をそのまま返す", () => {
      const entity = buildEntity({
        customWorkflowTitle: "業務相談",
        customWorkflowContent: "詳細内容です",
      });
      const result = initDynamicFieldsFromWorkflow("その他", entity);
      expect(result).toEqual({ title: "業務相談", content: "詳細内容です" });
    });

    it("customWorkflowTitle が null の場合は空文字を返す", () => {
      const entity = buildEntity({
        customWorkflowTitle: null,
        customWorkflowContent: null,
      });
      const result = initDynamicFieldsFromWorkflow("その他", entity);
      expect(result).toEqual({ title: "", content: "" });
    });
  });

  describe("未知のカテゴリー", () => {
    it("空オブジェクトを返す", () => {
      const entity = buildEntity();
      const result = initDynamicFieldsFromWorkflow("存在しないカテゴリー", entity);
      expect(result).toEqual({});
    });
  });
});
