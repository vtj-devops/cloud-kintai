import { getDateRangeDisplayValue } from "../workflowListFiltersShared";

describe("getDateRangeDisplayValue", () => {
  it("from と to 両方ある場合に範囲文字列を返す", () => {
    expect(getDateRangeDisplayValue("2024-01-01", "2024-01-31", "日付を選択")).toBe(
      "2024-01-01 → 2024-01-31",
    );
  });

  it("from だけある場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue("2024-01-01", undefined, "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("to だけある場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue(undefined, "2024-01-31", "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("両方 undefined の場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue(undefined, undefined, "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("空文字は falsy として emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue("", "", "日付を選択")).toBe("日付を選択");
  });
});
