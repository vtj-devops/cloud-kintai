import dayjs from "dayjs";

import {
  createMonthSearchParams,
  createMonthSearchParamsFromDate,
  formatMonthQueryValue,
  MONTH_QUERY_KEY,
} from "../monthQuery";

describe("monthQuery", () => {
  it("月クエリ値をYYYY-MM形式で返す", () => {
    expect(formatMonthQueryValue(dayjs("2024-03-15"))).toBe("2024-03");
  });

  it("月クエリのURLSearchParamsを生成する", () => {
    expect(createMonthSearchParams("2024-04").toString()).toBe(
      `${MONTH_QUERY_KEY}=2024-04`,
    );
  });

  it("日付から月クエリのURLSearchParamsを生成する", () => {
    expect(createMonthSearchParamsFromDate(dayjs("2024-05-20")).toString()).toBe(
      `${MONTH_QUERY_KEY}=2024-05`,
    );
  });
});
