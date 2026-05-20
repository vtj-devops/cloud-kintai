import dayjs from "dayjs";

import {
  getMonthDateRange,
  getOverlappingCloseDateRanges,
} from "../closeDateRangeUtils";

describe("closeDateRangeUtils", () => {
  test("getMonthDateRange は対象月の開始日と終了日を返すこと", () => {
    const { monthStart, monthEnd } = getMonthDateRange(dayjs("2024-06-15"));

    expect(monthStart.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(monthEnd.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  test("getOverlappingCloseDateRanges は月重複する期間のみを返すこと", () => {
    const ranges = getOverlappingCloseDateRanges(dayjs("2024-06-15"), [
      { startDate: "2024-05-20", endDate: "2024-06-05" },
      { startDate: "2024-06-10", endDate: "2024-06-20" },
      { startDate: "2024-07-01", endDate: "2024-07-31" },
      { startDate: "invalid", endDate: "2024-06-10" },
    ]);

    expect(ranges).toHaveLength(2);
    expect(ranges[0].start.format("YYYY-MM-DD")).toBe("2024-05-20");
    expect(ranges[1].start.format("YYYY-MM-DD")).toBe("2024-06-10");
  });

  test("endDate が undefined の場合でも dayjs の既存挙動どおり有効として扱うこと", () => {
    const ranges = getOverlappingCloseDateRanges(dayjs("2024-06-15"), [
      { startDate: "2024-06-01", endDate: undefined },
    ]);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.format("YYYY-MM-DD")).toBe("2024-06-01");
  });
});
