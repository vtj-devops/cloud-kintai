import dayjs from "dayjs";

import { resolveAggregationDateRange } from "../resolveAggregationDateRange";

// ---------------------------------------------------------------------------
// resolveAggregationDateRange
// ---------------------------------------------------------------------------
describe("resolveAggregationDateRange", () => {
  it("closeDates が空の場合、月の開始〜終了を返すこと", () => {
    const month = dayjs("2024-06-15");
    const result = resolveAggregationDateRange(month, []);
    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  it("当月と重複する closeDates がある場合、その期間の start/end を返すこと", () => {
    // 過去の月で今日を含む期間が不在のため、最新 updatedAt を持つ期間を返す
    const pastMonth = dayjs("2021-06-15");
    const result = resolveAggregationDateRange(pastMonth, [
      {
        startDate: "2021-06-01",
        endDate: "2021-06-30",
        closeDate: "2021-06-25",
        updatedAt: "2021-06-20T00:00:00.000Z",
      },
    ]);
    expect(result.start.format("YYYY-MM-DD")).toBe("2021-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2021-06-30");
  });

  it("無効な startDate を持つ closeDates は無視され月のデフォルト範囲を返すこと", () => {
    const month = dayjs("2024-06-15");
    const result = resolveAggregationDateRange(month, [
      { startDate: "invalid", endDate: "2024-06-30" },
    ]);
    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  it("当月と重複しない closeDates のみの場合、月のデフォルト範囲を返すこと", () => {
    const month = dayjs("2024-06-15");
    const result = resolveAggregationDateRange(month, [
      { startDate: "2024-04-01", endDate: "2024-04-30" },
    ]);
    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  it("複数の closeDates がある場合、最新 updatedAt を持つ期間を返すこと", () => {
    const pastMonth = dayjs("2021-03-15");
    const result = resolveAggregationDateRange(pastMonth, [
      {
        startDate: "2021-03-01",
        endDate: "2021-03-15",
        closeDate: "2021-03-15",
        updatedAt: "2021-03-10T00:00:00.000Z",
      },
      {
        startDate: "2021-03-16",
        endDate: "2021-03-31",
        closeDate: "2021-03-31",
        updatedAt: "2021-03-20T00:00:00.000Z", // こちらが新しい
      },
    ]);
    expect(result.start.format("YYYY-MM-DD")).toBe("2021-03-16");
    expect(result.end.format("YYYY-MM-DD")).toBe("2021-03-31");
  });

  it("返り値が dayjs.Dayjs の start/end プロパティを持つこと", () => {
    const month = dayjs("2024-06-15");
    const result = resolveAggregationDateRange(month, []);
    expect(dayjs.isDayjs(result.start)).toBe(true);
    expect(dayjs.isDayjs(result.end)).toBe(true);
  });
});
