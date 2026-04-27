import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import type { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  calcAttendanceChartSummary,
  calcAttendanceSummary,
} from "../attendanceSummaryCalculators";

function makeAttendance(
  overrides: Partial<
    Pick<Attendance, "workDate" | "startTime" | "endTime" | "rests">
  > & { id?: string },
): Attendance {
  return {
    __typename: "Attendance",
    id: overrides.id ?? "a1",
    staffId: "s1",
    workDate: overrides.workDate ?? "2024-06-01",
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    rests: overrides.rests ?? null,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  };
}

const dateRange: DateRange = {
  start: dayjs("2024-06-01"),
  end: dayjs("2024-06-03"),
};

describe("calcAttendanceSummary", () => {
  it("空配列のとき totalHours=0, workDays=0 を返す", () => {
    expect(calcAttendanceSummary([])).toEqual({ totalHours: 0, workDays: 0 });
  });

  it("startTime/endTime がない勤怠は集計から除外する", () => {
    const attendances = [makeAttendance({ workDate: "2024-06-01" })];
    expect(calcAttendanceSummary(attendances)).toEqual({
      totalHours: 0,
      workDays: 1,
    });
  });

  it("休憩なしで 8 時間勤務の場合 totalHours=8 を返す", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
      }),
    ];
    const result = calcAttendanceSummary(attendances);
    expect(result.totalHours).toBeCloseTo(8);
    expect(result.workDays).toBe(1);
  });

  it("1 時間休憩ありで 9 時間勤務の場合 totalHours=8 を返す", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T18:00:00Z",
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-06-01T12:00:00Z",
            endTime: "2024-06-01T13:00:00Z",
          },
        ],
      }),
    ];
    const result = calcAttendanceSummary(attendances);
    expect(result.totalHours).toBeCloseTo(8);
  });

  it("複数の勤怠レコードを合算する", () => {
    const attendances = [
      makeAttendance({
        id: "a1",
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
      }),
      makeAttendance({
        id: "a2",
        workDate: "2024-06-02",
        startTime: "2024-06-02T09:00:00Z",
        endTime: "2024-06-02T17:00:00Z",
      }),
    ];
    const result = calcAttendanceSummary(attendances);
    expect(result.totalHours).toBeCloseTo(16);
    expect(result.workDays).toBe(2);
  });

  it("rest に startTime/endTime が null の場合は 0 として扱う", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
        rests: [{ __typename: "Rest", startTime: null, endTime: null }],
      }),
    ];
    const result = calcAttendanceSummary(attendances);
    expect(result.totalHours).toBeCloseTo(8);
  });
});

describe("calcAttendanceChartSummary", () => {
  it("空配列のとき期間分の 0 データを返す", () => {
    const result = calcAttendanceChartSummary([], dateRange, 8);
    expect(result).toHaveLength(3);
    result.forEach((entry) => {
      expect(entry.workHours).toBe(0);
      expect(entry.restHours).toBe(0);
      expect(entry.overtimeHours).toBe(0);
    });
  });

  it("勤怠データがある日に正しい勤務時間が反映される", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
      }),
    ];
    const result = calcAttendanceChartSummary(attendances, dateRange, 8);
    const june1 = result.find((e) => e.label === "6/1");
    expect(june1?.workHours).toBeCloseTo(8);
    expect(june1?.restHours).toBe(0);
    expect(june1?.overtimeHours).toBe(0);
  });

  it("標準労働時間を超えた分は overtimeHours に計上される", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T19:00:00Z",
      }),
    ];
    const result = calcAttendanceChartSummary(attendances, dateRange, 8);
    const june1 = result.find((e) => e.label === "6/1");
    expect(june1?.overtimeHours).toBeCloseTo(2);
    expect(june1?.workHours).toBeCloseTo(8);
  });

  it("休憩ありの場合 restHours が正しく計上される", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-02",
        startTime: "2024-06-02T09:00:00Z",
        endTime: "2024-06-02T18:00:00Z",
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-06-02T12:00:00Z",
            endTime: "2024-06-02T13:00:00Z",
          },
        ],
      }),
    ];
    const result = calcAttendanceChartSummary(attendances, dateRange, 8);
    const june2 = result.find((e) => e.label === "6/2");
    expect(june2?.restHours).toBeCloseTo(1);
    expect(june2?.workHours).toBeCloseTo(8);
    expect(june2?.overtimeHours).toBe(0);
  });

  it("startTime/endTime がない勤怠はチャートに含まれない", () => {
    const attendances = [makeAttendance({ workDate: "2024-06-01" })];
    const result = calcAttendanceChartSummary(attendances, dateRange, 8);
    const june1 = result.find((e) => e.label === "6/1");
    expect(june1?.workHours).toBe(0);
  });

  it("label と workDateValue が正しく設定される", () => {
    const result = calcAttendanceChartSummary([], dateRange, 8);
    expect(result[0].label).toBe("6/1");
    expect(result[0].workDateValue).toBe(dayjs("2024-06-01").startOf("day").valueOf());
  });

  it("standardWorkHours が負の値でも 0 として扱われる", () => {
    const attendances = [
      makeAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
      }),
    ];
    const result = calcAttendanceChartSummary(attendances, dateRange, -5);
    const june1 = result.find((e) => e.label === "6/1");
    expect(june1?.overtimeHours).toBeCloseTo(8);
    expect(june1?.workHours).toBe(0);
  });
});
