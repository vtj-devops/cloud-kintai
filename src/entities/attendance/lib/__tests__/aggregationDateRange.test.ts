import dayjs from "dayjs";

import {
  formatDateRangeLabel,
  getAttendanceQueryDateRange,
  getEffectiveDateRange,
  getEffectivePastDateRangeEnd,
} from "../aggregationDateRange";

describe("getEffectiveDateRange", () => {
  const currentMonth = dayjs("2024-06-15");

  test("closeDates が空の場合、月の開始〜終了を返し hasValidPeriod が false であること", () => {
    const result = getEffectiveDateRange(currentMonth, []);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
    expect(result.hasValidPeriod).toBe(false);
  });

  test("無効な日付の closeDates のみの場合、月のデフォルト範囲を返すこと", () => {
    const result = getEffectiveDateRange(currentMonth, [
      { startDate: "invalid", endDate: "invalid" },
    ]);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.hasValidPeriod).toBe(false);
  });

  test("当月と重複しない closeDates の場合、月のデフォルト範囲を返すこと", () => {
    // 前月の期間
    const result = getEffectiveDateRange(currentMonth, [
      { startDate: "2024-04-01", endDate: "2024-04-30" },
    ]);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.hasValidPeriod).toBe(false);
  });

  test("当月と重複する closeDates が 1 件ある場合、その期間を返すこと", () => {
    // 固定された今日（2024-06-15）が含まれる期間
    const result = getEffectiveDateRange(dayjs("2024-06-15"), [
      {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
        closeDate: "2024-06-25",
        updatedAt: "2024-06-20T00:00:00.000Z",
      },
    ]);

    expect(result.hasValidPeriod).toBe(true);
    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  test("複数の closeDates がある場合、最新の updatedAt を持つ期間を返すこと", () => {
    // どちらも今日を含まない過去の期間を想定するため、遠い過去の月で確認
    const pastMonth = dayjs("2023-03-15");
    const result = getEffectiveDateRange(pastMonth, [
      {
        startDate: "2023-03-01",
        endDate: "2023-03-15",
        closeDate: "2023-03-15",
        updatedAt: "2023-03-10T00:00:00.000Z",
      },
      {
        startDate: "2023-03-16",
        endDate: "2023-03-31",
        closeDate: "2023-03-31",
        updatedAt: "2023-03-20T00:00:00.000Z", // こちらが新しい
      },
    ]);

    expect(result.hasValidPeriod).toBe(true);
    expect(result.start.format("YYYY-MM-DD")).toBe("2023-03-16");
    expect(result.end.format("YYYY-MM-DD")).toBe("2023-03-31");
  });
});

describe("getAttendanceQueryDateRange", () => {
  test("effectiveDateRange が月内に収まる場合、月の開始〜終了を返すこと", () => {
    const currentMonth = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-06-05"),
      end: dayjs("2024-06-25"),
    };

    const result = getAttendanceQueryDateRange(currentMonth, effectiveDateRange);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  test("effectiveDateRange の開始が月の開始より前の場合、effectiveDateRange の開始を返すこと", () => {
    const currentMonth = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-05-25"), // 前月にまたがる
      end: dayjs("2024-06-25"),
    };

    const result = getAttendanceQueryDateRange(currentMonth, effectiveDateRange);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-05-25");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-06-30");
  });

  test("effectiveDateRange の終了が月の終了より後の場合、effectiveDateRange の終了を返すこと", () => {
    const currentMonth = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-06-05"),
      end: dayjs("2024-07-05"), // 翌月にまたがる
    };

    const result = getAttendanceQueryDateRange(currentMonth, effectiveDateRange);

    expect(result.start.format("YYYY-MM-DD")).toBe("2024-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2024-07-05");
  });
});

describe("getEffectivePastDateRangeEnd", () => {
  test("effectiveDateRange の終了が今日より後の場合、今日の開始時刻を返すこと", () => {
    const today = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-06-01"),
      end: dayjs("2024-06-30"), // 今日より後
    };

    const result = getEffectivePastDateRangeEnd(effectiveDateRange, today);

    expect(result.format("YYYY-MM-DD")).toBe("2024-06-15");
    expect(result.hour()).toBe(0);
    expect(result.minute()).toBe(0);
  });

  test("effectiveDateRange の終了が今日より前の場合、その終了日の開始時刻を返すこと", () => {
    const today = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-06-01"),
      end: dayjs("2024-06-10"), // 今日より前
    };

    const result = getEffectivePastDateRangeEnd(effectiveDateRange, today);

    expect(result.format("YYYY-MM-DD")).toBe("2024-06-10");
    expect(result.hour()).toBe(0);
  });

  test("effectiveDateRange の終了が今日と同じ場合、その日の開始時刻を返すこと", () => {
    const today = dayjs("2024-06-15");
    const effectiveDateRange = {
      start: dayjs("2024-06-01"),
      end: dayjs("2024-06-15"), // 今日と同じ
    };

    const result = getEffectivePastDateRangeEnd(effectiveDateRange, today);

    expect(result.format("YYYY-MM-DD")).toBe("2024-06-15");
  });
});

describe("formatDateRangeLabel", () => {
  test("DateRange を 'M/D〜M/D' 形式にフォーマットすること", () => {
    const range = {
      start: dayjs("2024-06-01"),
      end: dayjs("2024-06-30"),
    };

    expect(formatDateRangeLabel(range)).toBe("6/1〜6/30");
  });

  test("月をまたぐ範囲でも正しくフォーマットされること", () => {
    const range = {
      start: dayjs("2024-05-25"),
      end: dayjs("2024-06-05"),
    };

    expect(formatDateRangeLabel(range)).toBe("5/25〜6/5");
  });

  test("start と end が同日の場合、同じ日付が両端に現れること", () => {
    const range = {
      start: dayjs("2024-03-20"),
      end: dayjs("2024-03-20"),
    };

    expect(formatDateRangeLabel(range)).toBe("3/20〜3/20");
  });

  test("1 桁の月・日はゼロ埋めされないこと（M/D 形式）", () => {
    const range = {
      start: dayjs("2024-01-05"),
      end: dayjs("2024-09-09"),
    };

    expect(formatDateRangeLabel(range)).toBe("1/5〜9/9");
  });
});

describe("getEffectiveDateRange — 追加境界値", () => {
  test("startDate が null の closeDates はフィルタされ hasValidPeriod が false であること", () => {
    const currentMonth = dayjs("2024-06-15");
    const result = getEffectiveDateRange(currentMonth, [
      { startDate: null, endDate: "2024-06-30" },
    ]);

    expect(result.hasValidPeriod).toBe(false);
  });

  test("endDate が undefined の場合、dayjs(undefined) が今日として解釈されるため有効期間として扱われること", () => {
    // dayjs(undefined) は today を返す = isValid() が true になる
    // その結果、startDate が有効であれば対象月と重複するとみなされ hasValidPeriod: true になる
    const currentMonth = dayjs("2024-06-15");
    const result = getEffectiveDateRange(currentMonth, [
      { startDate: "2024-06-01", endDate: undefined },
    ]);

    // endDate が undefined → dayjs(undefined) = 今日 → 今日は June 2024 より後のため
    // end.isBefore(monthStart) = false になり、フィルタを通過する
    expect(result.hasValidPeriod).toBe(true);
  });

  test("updatedAt が null の場合、closeDate をフォールバックに使って最新を判定すること", () => {
    // 今日を含まない過去の月で確認
    const pastMonth = dayjs("2021-03-15");
    const result = getEffectiveDateRange(pastMonth, [
      {
        startDate: "2021-03-01",
        endDate: "2021-03-15",
        closeDate: "2021-03-10",
        updatedAt: null,
      },
      {
        startDate: "2021-03-16",
        endDate: "2021-03-31",
        closeDate: "2021-03-25", // closeDate が新しい
        updatedAt: null,
      },
    ]);

    expect(result.start.format("YYYY-MM-DD")).toBe("2021-03-16");
    expect(result.end.format("YYYY-MM-DD")).toBe("2021-03-31");
    expect(result.hasValidPeriod).toBe(true);
  });

  test("有効な closeDates が 1 件のみの場合、その期間を返すこと", () => {
    const pastMonth = dayjs("2021-06-15");
    const result = getEffectiveDateRange(pastMonth, [
      {
        startDate: "2021-06-01",
        endDate: "2021-06-30",
        closeDate: "2021-06-25",
      },
    ]);

    expect(result.start.format("YYYY-MM-DD")).toBe("2021-06-01");
    expect(result.end.format("YYYY-MM-DD")).toBe("2021-06-30");
    expect(result.hasValidPeriod).toBe(true);
  });
});
