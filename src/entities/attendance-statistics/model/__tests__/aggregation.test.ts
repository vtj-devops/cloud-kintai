import {
  aggregateAttendanceStatistics,
  buildMonthlyTerms,
} from "../aggregation";

const ISO = (dateStr: string, timeStr: string) =>
  `${dateStr}T${timeStr}:00.000Z`;

const makeAttendance = (
  overrides: Partial<{
    workDate: string;
    startTime: string;
    endTime: string;
    paidHolidayFlag: boolean;
    specialHolidayFlag: boolean;
    absentFlag: boolean;
    rests: Array<{ startTime: string; endTime: string }>;
  }> = {},
) => ({
  id: "att1",
  workDate: "2024-03-05",
  startTime: null,
  endTime: null,
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  absentFlag: false,
  rests: [],
  ...overrides,
});

const makeCloseDate = (
  overrides: Partial<{
    closeDate: string;
    startDate: string;
    endDate: string;
    updatedAt: string;
  }> = {},
) => ({
  id: "cd1",
  closeDate: "2024-03-31",
  startDate: "2024-03-01",
  endDate: "2024-03-31",
  updatedAt: "2024-03-31T00:00:00Z",
  ...overrides,
});

describe("buildMonthlyTerms", () => {
  it("12ヶ月分のタームを返す", () => {
    const result = buildMonthlyTerms(2024, []);
    expect(result).toHaveLength(12);
  });

  it("closeDate なしの場合は月初〜月末の fallback ターム", () => {
    const result = buildMonthlyTerms(2024, []);
    expect(result[0].source).toBe("fallback");
    expect(result[0].start.format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(result[0].end.format("YYYY-MM-DD")).toBe("2024-01-31");
  });

  it("有効な closeDate がある場合は closeDate のタームを使う", () => {
    const cd = makeCloseDate({
      closeDate: "2024-03-31",
      startDate: "2024-03-01",
      endDate: "2024-03-31",
    });
    const result = buildMonthlyTerms(2024, [cd]);
    expect(result[2].source).toBe("closeDate");
    expect(result[2].start.format("YYYY-MM-DD")).toBe("2024-03-01");
    expect(result[2].end.format("YYYY-MM-DD")).toBe("2024-03-31");
  });

  it("他の年の closeDate は無視する", () => {
    const cd = makeCloseDate({ closeDate: "2023-03-31", startDate: "2023-03-01", endDate: "2023-03-31" });
    const result = buildMonthlyTerms(2024, [cd]);
    expect(result[2].source).toBe("fallback");
  });

  it("同じ月に複数の closeDate がある場合は最新のものを使う", () => {
    const old = makeCloseDate({
      closeDate: "2024-03-31",
      startDate: "2024-03-01",
      endDate: "2024-03-25",
      updatedAt: "2024-01-01T00:00:00Z",
    });
    const latest = makeCloseDate({
      id: "cd2",
      closeDate: "2024-03-31",
      startDate: "2024-03-01",
      endDate: "2024-03-31",
      updatedAt: "2024-02-01T00:00:00Z",
    });
    const result = buildMonthlyTerms(2024, [old, latest]);
    expect(result[2].end.format("YYYY-MM-DD")).toBe("2024-03-31");
  });
});

describe("aggregateAttendanceStatistics", () => {
  it("勤怠がない場合は全ゼロのサマリを返す", () => {
    const result = aggregateAttendanceStatistics({ attendances: [], closeDates: [], year: 2024 });
    expect(result.totalWorkHours).toBe(0);
    expect(result.totalWorkDays).toBe(0);
    expect(result.totalPaidDays).toBe(0);
    expect(result.monthlySummaries).toHaveLength(12);
  });

  it("勤務時間を正しく集計する（8時間）", () => {
    const attendance = makeAttendance({
      workDate: "2024-03-05",
      startTime: ISO("2024-03-05", "09:00"),
      endTime: ISO("2024-03-05", "17:00"),
    });
    const result = aggregateAttendanceStatistics({ attendances: [attendance], closeDates: [], year: 2024 });
    expect(result.totalWorkHours).toBeGreaterThan(0);
    expect(result.totalWorkDays).toBe(1);
  });

  it("休憩時間を差し引いて勤務時間を計算する", () => {
    const attendance = makeAttendance({
      workDate: "2024-03-05",
      startTime: ISO("2024-03-05", "09:00"),
      endTime: ISO("2024-03-05", "18:00"),
      rests: [{ startTime: ISO("2024-03-05", "12:00"), endTime: ISO("2024-03-05", "13:00") }],
    });
    const result = aggregateAttendanceStatistics({ attendances: [attendance], closeDates: [], year: 2024 });
    expect(result.totalWorkHours).toBe(8);
  });

  it("有給休暇フラグを正しくカウントする", () => {
    const attendance = makeAttendance({ workDate: "2024-03-05", paidHolidayFlag: true });
    const result = aggregateAttendanceStatistics({ attendances: [attendance], closeDates: [], year: 2024 });
    expect(result.totalPaidDays).toBe(1);
  });

  it("特別休暇フラグを正しくカウントする", () => {
    const attendance = makeAttendance({ workDate: "2024-03-05", specialHolidayFlag: true });
    const result = aggregateAttendanceStatistics({ attendances: [attendance], closeDates: [], year: 2024 });
    expect(result.totalSpecialHolidayDays).toBe(1);
  });

  it("欠勤フラグを正しくカウントする", () => {
    const attendance = makeAttendance({ workDate: "2024-03-05", absentFlag: true });
    const result = aggregateAttendanceStatistics({ attendances: [attendance], closeDates: [], year: 2024 });
    expect(result.totalAbsentDays).toBe(1);
  });

  it("hasFallbackTerms: fallback が存在する場合は true", () => {
    const result = aggregateAttendanceStatistics({ attendances: [], closeDates: [], year: 2024 });
    expect(result.hasFallbackTerms).toBe(true);
  });

  it("hasFallbackTerms: 全月に closeDate がある場合は false", () => {
    const closeDates = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      const lastDay = new Date(2024, i + 1, 0).getDate();
      return makeCloseDate({
        id: `cd${i}`,
        closeDate: `2024-${month}-${lastDay}`,
        startDate: `2024-${month}-01`,
        endDate: `2024-${month}-${lastDay}`,
      });
    });
    const result = aggregateAttendanceStatistics({ attendances: [], closeDates, year: 2024 });
    expect(result.hasFallbackTerms).toBe(false);
  });

  it("rangeStart は最も早い月の開始日", () => {
    const result = aggregateAttendanceStatistics({ attendances: [], closeDates: [], year: 2024 });
    expect(result.rangeStart).toBe("2024-01-01");
  });

  it("rangeEnd は最も遅い月の終了日", () => {
    const result = aggregateAttendanceStatistics({ attendances: [], closeDates: [], year: 2024 });
    expect(result.rangeEnd).toBe("2024-12-31");
  });

  it("複数月にわたる勤怠を正しく月別集計する", () => {
    const att1 = makeAttendance({ workDate: "2024-01-10", startTime: ISO("2024-01-10", "09:00"), endTime: ISO("2024-01-10", "17:00") });
    const att2 = makeAttendance({ id: "att2", workDate: "2024-03-05", startTime: ISO("2024-03-05", "09:00"), endTime: ISO("2024-03-05", "17:00") });
    const result = aggregateAttendanceStatistics({ attendances: [att1, att2], closeDates: [], year: 2024 });
    expect(result.totalWorkDays).toBe(2);
    expect(result.monthlySummaries[0].workDays).toBe(1); // 1月
    expect(result.monthlySummaries[2].workDays).toBe(1); // 3月
  });
});
