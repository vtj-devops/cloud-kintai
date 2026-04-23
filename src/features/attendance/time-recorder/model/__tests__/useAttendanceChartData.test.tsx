import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { DateRange } from "@entities/attendance/lib/aggregationDateRange";
import { createMockAppConfig, createMockAttendance } from "@shared/test-utils";
import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";

import { useAttendanceChartData } from "../useAttendanceChartData";

// 3 日間の固定 DateRange
const FIXED_RANGE: DateRange = {
  start: dayjs("2024-06-01"),
  end: dayjs("2024-06-03"),
};

function createWrapper(standardWorkHours = 8) {
  const appConfig = createMockAppConfig({
    derived: { standardWorkHours },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AppConfigContext.Provider value={appConfig}>
        {children}
      </AppConfigContext.Provider>
    );
  };
}

describe("useAttendanceChartData", () => {
  it("空の勤怠データを渡すと chartSummary は日付ごとに 0 データを返す", () => {
    const { result } = renderHook(
      () => useAttendanceChartData([], FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    // 3日分 (6/1〜6/3)
    expect(result.current.chartSummary).toHaveLength(3);
    result.current.chartSummary.forEach((entry) => {
      expect(entry.workHours).toBe(0);
      expect(entry.restHours).toBe(0);
      expect(entry.overtimeHours).toBe(0);
    });
  });

  it("stackedBarData は 勤務時間・残業時間・休憩時間 の 3 datasets を持つ", () => {
    const { result } = renderHook(
      () => useAttendanceChartData([], FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    const { datasets } = result.current.stackedBarData;
    expect(datasets).toHaveLength(3);
    expect(datasets[0].label).toBe("勤務時間");
    expect(datasets[1].label).toBe("残業時間");
    expect(datasets[2].label).toBe("休憩時間");
  });

  it("labels は日付範囲の各日付 (M/D 形式) に対応する", () => {
    const { result } = renderHook(
      () => useAttendanceChartData([], FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    expect(result.current.stackedBarData.labels).toEqual(["6/1", "6/2", "6/3"]);
  });

  it("勤怠データがある日の workHours が stackedBarData に反映される", () => {
    const attendances = [
      createMockAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z",
      }),
    ];

    const { result } = renderHook(
      () => useAttendanceChartData(attendances, FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    const june1Index = result.current.chartSummary.findIndex(
      (e) => e.label === "6/1",
    );
    expect(result.current.chartSummary[june1Index].workHours).toBeCloseTo(8, 0);
    // stackedBarData の 勤務時間 dataset にも反映される
    const workDataset = result.current.stackedBarData.datasets[0];
    const workData = workDataset.data as number[];
    expect(workData[june1Index]).toBeCloseTo(8, 0);
  });

  it("標準労働時間を超えた勤務は overtimeHours に反映される（残業時間 dataset は負値）", () => {
    const attendances = [
      createMockAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T19:00:00Z", // 10h → 8h 標準 → 2h 残業
      }),
    ];

    const { result } = renderHook(
      () => useAttendanceChartData(attendances, FIXED_RANGE),
      { wrapper: createWrapper(8) },
    );

    const june1 = result.current.chartSummary.find((e) => e.label === "6/1");
    expect(june1?.overtimeHours).toBeCloseTo(2, 0);

    const june1Index = result.current.chartSummary.findIndex(
      (e) => e.label === "6/1",
    );
    // 残業時間 dataset の値は負値
    const overtimeDataset = result.current.stackedBarData.datasets[1];
    const overtimeData = overtimeDataset.data as number[];
    expect(overtimeData[june1Index]).toBeLessThan(0);
  });

  it("休憩ありの勤怠は restHours が正しく計上される", () => {
    const attendances = [
      createMockAttendance({
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

    const { result } = renderHook(
      () => useAttendanceChartData(attendances, FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    const june2 = result.current.chartSummary.find((e) => e.label === "6/2");
    expect(june2?.restHours).toBeCloseTo(1, 0);
  });

  it("stackedBarOptions には responsive・stacked 設定が含まれる", () => {
    const { result } = renderHook(
      () => useAttendanceChartData([], FIXED_RANGE),
      { wrapper: createWrapper() },
    );

    const options = result.current.stackedBarOptions;
    expect(options.responsive).toBe(true);
    expect(options.maintainAspectRatio).toBe(false);
    expect(options.scales?.x?.stacked).toBe(true);
    expect(options.scales?.y?.stacked).toBe(true);
  });

  it("残業がある場合 y 軸 suggestedMin が負値になる", () => {
    const attendances = [
      createMockAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T20:00:00Z", // 11h → 3h 残業
      }),
    ];

    const { result } = renderHook(
      () => useAttendanceChartData(attendances, FIXED_RANGE),
      { wrapper: createWrapper(8) },
    );

    const suggestedMin = result.current.stackedBarOptions.scales?.y?.suggestedMin;
    expect(Number(suggestedMin)).toBeLessThan(0);
  });

  it("getStandardWorkHours の値がチャート集計に使用される（標準時間 0 → 全時間が残業）", () => {
    const attendances = [
      createMockAttendance({
        workDate: "2024-06-01",
        startTime: "2024-06-01T09:00:00Z",
        endTime: "2024-06-01T17:00:00Z", // 8h
      }),
    ];

    const { result } = renderHook(
      () => useAttendanceChartData(attendances, FIXED_RANGE),
      { wrapper: createWrapper(0) }, // standardWorkHours=0 → 8h 全部が残業
    );

    const june1 = result.current.chartSummary.find((e) => e.label === "6/1");
    expect(june1?.overtimeHours).toBeCloseTo(8, 0);
  });
});
