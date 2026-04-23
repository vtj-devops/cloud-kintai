import type { ShiftPlanMonthSetting } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  areRowsEqual,
  buildRowsFromPlans,
  convertRowsToPlanInput,
  createDefaultRows,
  getOrInitYearRows,
  MAX_DAYS_IN_MONTH,
  sanitizeCapacityValue,
  type ShiftPlanRow,
} from "../shiftPlanUtils";

// ----------------------------------------------------------------
// sanitizeCapacityValue
// ----------------------------------------------------------------
describe("sanitizeCapacityValue", () => {
  it("空文字を渡すと空文字を返す", () => {
    expect(sanitizeCapacityValue("")).toBe("");
    expect(sanitizeCapacityValue("   ")).toBe("");
  });

  it("正の整数を渡すとそのまま返す", () => {
    expect(sanitizeCapacityValue("5")).toBe("5");
    expect(sanitizeCapacityValue("100")).toBe("100");
  });

  it("小数を渡すと切り捨てた整数を返す", () => {
    expect(sanitizeCapacityValue("3.7")).toBe("3");
    expect(sanitizeCapacityValue("9.9")).toBe("9");
  });

  it("負の数を渡すと 0 を返す", () => {
    expect(sanitizeCapacityValue("-1")).toBe("0");
    expect(sanitizeCapacityValue("-100")).toBe("0");
  });

  it("数字でない文字を渡すと空文字を返す", () => {
    expect(sanitizeCapacityValue("abc")).toBe("");
    expect(sanitizeCapacityValue("NaN")).toBe("");
  });

  it("0 を渡すと '0' を返す", () => {
    expect(sanitizeCapacityValue("0")).toBe("0");
  });
});

// ----------------------------------------------------------------
// createDefaultRows
// ----------------------------------------------------------------
describe("createDefaultRows", () => {
  it("12 ヶ月分の行を返す", () => {
    const rows = createDefaultRows(2024);
    expect(rows).toHaveLength(12);
  });

  it("各行の month は 1〜12", () => {
    const rows = createDefaultRows(2024);
    rows.forEach((row, i) => expect(row.month).toBe(i + 1));
  });

  it("editStart は当月の月初、editEnd は当月の月末 (YYYY-MM-DD)", () => {
    const rows = createDefaultRows(2024);
    const jan = rows[0];
    expect(jan.editStart).toBe("2024-01-01");
    expect(jan.editEnd).toBe("2024-01-31");
    const feb = rows[1];
    expect(feb.editStart).toBe("2024-02-01");
    expect(feb.editEnd).toBe("2024-02-29"); // 2024年はうるう年
  });

  it("全行 enabled = true", () => {
    const rows = createDefaultRows(2024);
    expect(rows.every((row) => row.enabled)).toBe(true);
  });

  it("dailyCapacity は MAX_DAYS_IN_MONTH 個の空文字配列", () => {
    const rows = createDefaultRows(2024);
    rows.forEach((row) => {
      expect(row.dailyCapacity).toHaveLength(MAX_DAYS_IN_MONTH);
      expect(row.dailyCapacity.every((v) => v === "")).toBe(true);
    });
  });
});

// ----------------------------------------------------------------
// buildRowsFromPlans
// ----------------------------------------------------------------
describe("buildRowsFromPlans", () => {
  const makePlan = (
    month: number,
    overrides: Partial<ShiftPlanMonthSetting> = {}
  ): ShiftPlanMonthSetting => ({
    __typename: "ShiftPlanMonthSetting",
    id: `plan-${month}`,
    month,
    editStart: `2024-0${month}-05`,
    editEnd: `2024-0${month}-25`,
    enabled: true,
    dailyCapacities: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  });

  it("plans が null/undefined の場合、デフォルト行を返す", () => {
    expect(buildRowsFromPlans(2024, null)).toHaveLength(12);
    expect(buildRowsFromPlans(2024, undefined)).toHaveLength(12);
    expect(buildRowsFromPlans(2024, [])).toHaveLength(12);
  });

  it("plans に一致する月があれば editStart/editEnd が上書きされる", () => {
    const rows = buildRowsFromPlans(2024, [makePlan(3)]);
    const march = rows.find((r) => r.month === 3)!;
    expect(march.editStart).toBe("2024-03-05");
    expect(march.editEnd).toBe("2024-03-25");
  });

  it("plans に一致しない月はデフォルト値を使う", () => {
    const rows = buildRowsFromPlans(2024, [makePlan(3)]);
    const jan = rows.find((r) => r.month === 1)!;
    expect(jan.editStart).toBe("2024-01-01");
  });

  it("dailyCapacities がある場合、文字列に変換される", () => {
    const rows = buildRowsFromPlans(2024, [
      makePlan(1, { dailyCapacities: [3, null, 5, 0] }),
    ]);
    const jan = rows.find((r) => r.month === 1)!;
    expect(jan.dailyCapacity[0]).toBe("3");
    expect(jan.dailyCapacity[1]).toBe("");
    expect(jan.dailyCapacity[2]).toBe("5");
    expect(jan.dailyCapacity[3]).toBe("0");
  });

  it("plan に month が number でない場合はスキップされる", () => {
    const invalidPlan = { ...makePlan(1), month: null as unknown as number };
    const rows = buildRowsFromPlans(2024, [invalidPlan]);
    const jan = rows.find((r) => r.month === 1)!;
    // null plan is ignored, so default row is used
    expect(jan.editStart).toBe("2024-01-01");
  });
});

// ----------------------------------------------------------------
// convertRowsToPlanInput
// ----------------------------------------------------------------
describe("convertRowsToPlanInput", () => {
  it("ShiftPlanRow を ShiftPlanMonthSettingInput に変換する", () => {
    const now = dayjs("2024-01");
    const row: ShiftPlanRow = {
      month: 1,
      editStart: "2024-01-01",
      editEnd: "2024-01-31",
      enabled: true,
      dailyCapacity: ["3", "", "5"],
    };
    const [result] = convertRowsToPlanInput([row]);
    expect(result.month).toBe(1);
    expect(result.editStart).toBe("2024-01-01");
    expect(result.editEnd).toBe("2024-01-31");
    expect(result.enabled).toBe(true);
    expect(result.dailyCapacities![0]).toBe(3);
    expect(result.dailyCapacities![1]).toBeNull();
    expect(result.dailyCapacities![2]).toBe(5);
    void now;
  });

  it("editStart/editEnd が空文字の場合、null になる", () => {
    const row: ShiftPlanRow = {
      month: 2,
      editStart: "",
      editEnd: "",
      enabled: false,
      dailyCapacity: [],
    };
    const [result] = convertRowsToPlanInput([row]);
    expect(result.editStart).toBeNull();
    expect(result.editEnd).toBeNull();
  });
});

// ----------------------------------------------------------------
// getOrInitYearRows
// ----------------------------------------------------------------
describe("getOrInitYearRows", () => {
  it("yearRows に年がある場合、それを返す", () => {
    const rows = createDefaultRows(2024);
    const result = getOrInitYearRows(2024, { 2024: rows });
    expect(result).toBe(rows);
  });

  it("yearRows に年がない場合、デフォルト行を返す", () => {
    const result = getOrInitYearRows(2025, {});
    expect(result).toHaveLength(12);
    expect(result[0].editStart).toBe("2025-01-01");
  });
});

// ----------------------------------------------------------------
// areRowsEqual
// ----------------------------------------------------------------
describe("areRowsEqual", () => {
  const baseRow = (month: number): ShiftPlanRow => ({
    month,
    editStart: `2024-0${month}-01`,
    editEnd: `2024-0${month}-28`,
    enabled: true,
    dailyCapacity: Array.from({ length: MAX_DAYS_IN_MONTH }, () => ""),
  });

  it("同じ内容なら true を返す", () => {
    const rows = [1, 2, 3].map(baseRow);
    expect(areRowsEqual(rows, rows)).toBe(true);
  });

  it("長さが違う場合 false を返す", () => {
    expect(areRowsEqual([baseRow(1)], [baseRow(1), baseRow(2)])).toBe(false);
  });

  it("month が異なる場合 false を返す", () => {
    expect(areRowsEqual([baseRow(1)], [{ ...baseRow(1), month: 2 }])).toBe(false);
  });

  it("editStart が異なる場合 false を返す", () => {
    expect(
      areRowsEqual([baseRow(1)], [{ ...baseRow(1), editStart: "2024-01-05" }])
    ).toBe(false);
  });

  it("editEnd が異なる場合 false を返す", () => {
    expect(
      areRowsEqual([baseRow(1)], [{ ...baseRow(1), editEnd: "2024-01-20" }])
    ).toBe(false);
  });

  it("enabled が異なる場合 false を返す", () => {
    expect(
      areRowsEqual([baseRow(1)], [{ ...baseRow(1), enabled: false }])
    ).toBe(false);
  });

  it("dailyCapacity が異なる場合 false を返す", () => {
    const modified = { ...baseRow(1) };
    modified.dailyCapacity = [...modified.dailyCapacity];
    modified.dailyCapacity[0] = "5";
    expect(areRowsEqual([baseRow(1)], [modified])).toBe(false);
  });

  it("dailyCapacity の長さが異なる場合 false を返す", () => {
    const modified = { ...baseRow(1), dailyCapacity: ["1", "2"] };
    expect(areRowsEqual([baseRow(1)], [modified])).toBe(false);
  });
});
