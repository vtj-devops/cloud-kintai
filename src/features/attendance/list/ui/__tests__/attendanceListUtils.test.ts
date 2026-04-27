import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import type { DateRange } from "../attendanceListUtils";
import {
  getCurrentMonthFromQuery,
  shouldRefetchForAttendanceEvent,
} from "../attendanceListUtils";

// attendanceListUtils uses isBetween internally via the import chain
dayjs.extend(isBetween);

// ----------------------------------------------------------------
// getCurrentMonthFromQuery
// ----------------------------------------------------------------
describe("getCurrentMonthFromQuery", () => {
  it("null のとき今月の月初を返す", () => {
    const result = getCurrentMonthFromQuery(null);
    expect(result.isSame(dayjs().startOf("month"), "day")).toBe(true);
  });

  it("無効な日付文字列のとき今月の月初を返す", () => {
    const result = getCurrentMonthFromQuery("invalid");
    expect(result.isSame(dayjs().startOf("month"), "day")).toBe(true);
  });

  it("有効な YYYY-MM 文字列のとき対応する月初を返す", () => {
    const result = getCurrentMonthFromQuery("2024-03");
    expect(result.format("YYYY-MM-DD")).toBe("2024-03-01");
  });
});

// ----------------------------------------------------------------
// shouldRefetchForAttendanceEvent
// ----------------------------------------------------------------
describe("shouldRefetchForAttendanceEvent", () => {
  const queryRange: DateRange = {
    start: dayjs("2024-03-01"),
    end: dayjs("2024-03-31"),
  };

  it("eventStaffId が null のとき false を返す", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, null, "2024-03-15")
    ).toBe(false);
  });

  it("workDate が null のとき false を返す", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-1", null)
    ).toBe(false);
  });

  it("staffId が一致しないとき false を返す", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-2", "2024-03-15")
    ).toBe(false);
  });

  it("staffId が一致し workDate がクエリ範囲内のとき true を返す", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-1", "2024-03-15")
    ).toBe(true);
  });

  it("workDate がクエリ範囲の開始日と同じとき true を返す（境界値）", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-1", "2024-03-01")
    ).toBe(true);
  });

  it("workDate がクエリ範囲の終了日と同じとき true を返す（境界値）", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-1", "2024-03-31")
    ).toBe(true);
  });

  it("workDate がクエリ範囲外のとき false を返す", () => {
    expect(
      shouldRefetchForAttendanceEvent("staff-1", queryRange, "staff-1", "2024-04-01")
    ).toBe(false);
  });
});
