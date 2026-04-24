import type {
  DailyReport as DailyReportModel,
  DailyReportStatus,
} from "@shared/api/graphql/types";
import { DailyReportReactionType } from "@shared/api/graphql/types";

import {
  buildDefaultTitle,
  buildSavedAtLabel,
  emptyForm,
  formatDateInput,
  mapDailyReport,
  sortReports,
} from "../dailyReportHelpers";
import type { DailyReportItem } from "../dailyReportTypes";

// formatRelativeDateTime のモック (外部依存を排除)
jest.mock("@shared/lib/time", () => ({
  formatRelativeDateTime: jest.fn((v: string | null | undefined) =>
    v ? `relative(${v})` : ""
  ),
}));

// ----------------------------------------------------------------
// formatDateInput
// ----------------------------------------------------------------
describe("formatDateInput", () => {
  it("Date を YYYY-MM-DD 文字列に変換する", () => {
    const d = new Date("2024-06-15T00:00:00.000Z");
    expect(formatDateInput(d)).toBe("2024-06-15");
  });
});

// ----------------------------------------------------------------
// buildDefaultTitle
// ----------------------------------------------------------------
describe("buildDefaultTitle", () => {
  it("date がある場合 '日付の日報' を返す", () => {
    expect(buildDefaultTitle("2024-06-15")).toBe("2024-06-15の日報");
  });

  it("date が空文字のとき '日報' を返す", () => {
    expect(buildDefaultTitle("")).toBe("日報");
  });
});

// ----------------------------------------------------------------
// buildSavedAtLabel
// ----------------------------------------------------------------
describe("buildSavedAtLabel", () => {
  it("savedAt がある場合 formatRelativeDateTime の結果を返す", () => {
    const result = buildSavedAtLabel("2024-06-15T10:00:00Z");
    expect(result).toBe("relative(2024-06-15T10:00:00Z)");
  });

  it("savedAt が null/undefined のとき空文字を返す", () => {
    expect(buildSavedAtLabel(null)).toBe("");
    expect(buildSavedAtLabel(undefined)).toBe("");
  });
});

// ----------------------------------------------------------------
// emptyForm
// ----------------------------------------------------------------
describe("emptyForm", () => {
  it("引数なしで呼ぶと今日の日付のフォームを返す", () => {
    const form = emptyForm();
    expect(form.content).toBe("");
    expect(form.title).toMatch(/の日報$/);
  });

  it("initialDate を渡すとその日付でフォームを生成する", () => {
    const form = emptyForm("2024-03-01", "田中太郎");
    expect(form.date).toBe("2024-03-01");
    expect(form.title).toBe("2024-03-01の日報");
    expect(form.author).toBe("田中太郎");
  });
});

// ----------------------------------------------------------------
// mapDailyReport
// ----------------------------------------------------------------
describe("mapDailyReport", () => {
  const baseRecord: DailyReportModel = {
    __typename: "DailyReport",
    id: "r1",
    staffId: "s1",
    reportDate: "2024-06-15",
    title: "今日の日報",
    content: "業務内容",
    status: "SUBMITTED" as DailyReportStatus,
    updatedAt: "2024-06-15T18:00:00Z",
    createdAt: "2024-06-15T09:00:00Z",
    version: 1,
    reactions: [],
    comments: [],
  };

  it("基本フィールドを正しくマッピングする", () => {
    const result = mapDailyReport(baseRecord, "田中太郎");
    expect(result.id).toBe("r1");
    expect(result.staffId).toBe("s1");
    expect(result.author).toBe("田中太郎");
    expect(result.title).toBe("今日の日報");
    expect(result.content).toBe("業務内容");
    expect(result.reactions).toEqual([]);
    expect(result.comments).toEqual([]);
  });

  it("reactions を集計する", () => {
    const record = {
      ...baseRecord,
      reactions: [
        { __typename: "DailyReportReaction" as const, staffId: "s1", type: DailyReportReactionType.CHEER, createdAt: "" },
        { __typename: "DailyReportReaction" as const, staffId: "s2", type: DailyReportReactionType.CHEER, createdAt: "" },
        { __typename: "DailyReportReaction" as const, staffId: "s3", type: DailyReportReactionType.THANKS, createdAt: "" },
      ],
    };
    const result = mapDailyReport(record, "");
    const cheer = result.reactions.find((r) => r.type === DailyReportReactionType.CHEER);
    const thanks = result.reactions.find((r) => r.type === DailyReportReactionType.THANKS);
    expect(cheer?.count).toBe(2);
    expect(thanks?.count).toBe(1);
  });

  it("comments を新しい順でマッピングする", () => {
    const record = {
      ...baseRecord,
      comments: [
        {
          __typename: "DailyReportComment" as const,
          id: "c1",
          staffId: "s1",
          body: "コメント1",
          authorName: "管理者A",
          createdAt: "2024-06-15T09:00:00Z",
        },
        {
          __typename: "DailyReportComment" as const,
          id: "c2",
          staffId: "s2",
          body: "コメント2",
          authorName: "管理者B",
          createdAt: "2024-06-15T10:00:00Z",
        },
      ],
    };
    const result = mapDailyReport(record, "");
    expect(result.comments[0].id).toBe("c2"); // 新しい順
    expect(result.comments[1].id).toBe("c1");
  });

  it("authorName が空の場合 '管理者' をデフォルトにする", () => {
    const record = {
      ...baseRecord,
      comments: [
        {
          __typename: "DailyReportComment" as const,
          id: "c1",
          staffId: "s1",
          body: "本文",
          authorName: "",
          createdAt: "2024-06-15T09:00:00Z",
        },
      ],
    };
    const result = mapDailyReport(record, "");
    expect(result.comments[0].author).toBe("管理者");
  });

  it("null の reactions/comments は無視される", () => {
    const record = {
      ...baseRecord,
      reactions: [null],
      comments: [null],
    };
    const result = mapDailyReport(record, "");
    expect(result.reactions).toEqual([]);
    expect(result.comments).toEqual([]);
  });
});

// ----------------------------------------------------------------
// sortReports
// ----------------------------------------------------------------
describe("sortReports", () => {
  it("日付の降順で並ぶ", () => {
    const items = [
      { date: "2024-06-13", updatedAt: null },
      { date: "2024-06-15", updatedAt: null },
      { date: "2024-06-14", updatedAt: null },
    ] as unknown as DailyReportItem[];
    const sorted = sortReports(items);
    expect(sorted[0].date).toBe("2024-06-15");
    expect(sorted[1].date).toBe("2024-06-14");
    expect(sorted[2].date).toBe("2024-06-13");
  });

  it("同日付の場合 updatedAt の降順", () => {
    const items = [
      { date: "2024-06-15", updatedAt: "2024-06-15T09:00:00Z" },
      { date: "2024-06-15", updatedAt: "2024-06-15T18:00:00Z" },
    ] as unknown as DailyReportItem[];
    const sorted = sortReports(items);
    expect(sorted[0].updatedAt).toBe("2024-06-15T18:00:00Z");
    expect(sorted[1].updatedAt).toBe("2024-06-15T09:00:00Z");
  });

  it("元の配列を変更しない", () => {
    const items = [
      { date: "2024-06-13", updatedAt: null },
      { date: "2024-06-15", updatedAt: null },
    ] as unknown as DailyReportItem[];
    const originalFirst = items[0].date;
    sortReports(items);
    expect(items[0].date).toBe(originalFirst);
  });
});
