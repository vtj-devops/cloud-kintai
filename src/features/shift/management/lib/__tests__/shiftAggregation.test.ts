import dayjs from "dayjs";

import {
  calculateDailyCounts,
  calculateGroupDailyCounts,
  calculatePlannedDailyCounts,
} from "../shiftAggregation";

const days = [
  dayjs("2024-01-01"),
  dayjs("2024-01-02"),
  dayjs("2024-01-03"),
];

describe("calculateDailyCounts", () => {
  it("counts work entries for each day", () => {
    const displayShifts = new Map([
      ["staff-1", { "2024-01-01": "work", "2024-01-02": "fixedOff", "2024-01-03": "work" }],
      ["staff-2", { "2024-01-01": "work", "2024-01-02": "work",     "2024-01-03": "empty" }],
    ]);

    const result = calculateDailyCounts(days, ["staff-1", "staff-2"], displayShifts as never);

    expect(result.get("2024-01-01")).toBe(2);
    expect(result.get("2024-01-02")).toBe(1);
    expect(result.get("2024-01-03")).toBe(1);
  });

  it("returns 0 for all days when no staff work", () => {
    const displayShifts = new Map([
      ["staff-1", { "2024-01-01": "fixedOff", "2024-01-02": "empty", "2024-01-03": "auto" }],
    ]);

    const result = calculateDailyCounts(days, ["staff-1"], displayShifts as never);

    expect(result.get("2024-01-01")).toBe(0);
    expect(result.get("2024-01-02")).toBe(0);
    expect(result.get("2024-01-03")).toBe(0);
  });

  it("returns 0 for all days when staffIds is empty", () => {
    const displayShifts = new Map<string, Record<string, string>>();
    const result = calculateDailyCounts(days, [], displayShifts as never);

    expect(result.get("2024-01-01")).toBe(0);
  });

  it("handles missing staff entry in displayShifts", () => {
    const displayShifts = new Map<string, Record<string, string>>();
    const result = calculateDailyCounts(days, ["staff-999"], displayShifts as never);

    expect(result.get("2024-01-01")).toBe(0);
  });
});

describe("calculateGroupDailyCounts", () => {
  const displayShifts = new Map([
    ["staff-1", { "2024-01-01": "work", "2024-01-02": "fixedOff", "2024-01-03": "work" }],
    ["staff-2", { "2024-01-01": "work", "2024-01-02": "work",     "2024-01-03": "empty" }],
    ["staff-3", { "2024-01-01": "fixedOff", "2024-01-02": "work", "2024-01-03": "work" }],
  ]);

  it("counts work entries per group per day", () => {
    const groups = [
      { groupName: "A", members: [{ id: "staff-1" }, { id: "staff-2" }] },
      { groupName: "B", members: [{ id: "staff-3" }] },
    ];

    const result = calculateGroupDailyCounts(days, groups, displayShifts as never);

    expect(result.get("A")?.get("2024-01-01")).toBe(2);
    expect(result.get("A")?.get("2024-01-02")).toBe(1);
    expect(result.get("B")?.get("2024-01-01")).toBe(0);
    expect(result.get("B")?.get("2024-01-03")).toBe(1);
  });

  it("returns empty map for empty groups", () => {
    const result = calculateGroupDailyCounts(days, [], displayShifts as never);
    expect(result.size).toBe(0);
  });
});

describe("calculatePlannedDailyCounts", () => {
  const monthStart = dayjs("2024-01-01");

  it("returns null for all days when shiftPlanPlans is null", () => {
    const result = calculatePlannedDailyCounts(days, monthStart, null);

    expect(result.get("2024-01-01")).toBeNull();
    expect(result.get("2024-01-02")).toBeNull();
    expect(result.get("2024-01-03")).toBeNull();
  });

  it("returns null for all days when no matching month plan", () => {
    const plans = [{ month: 3, dailyCapacities: [5, 5, 5] }];
    const result = calculatePlannedDailyCounts(days, monthStart, plans as never);

    expect(result.get("2024-01-01")).toBeNull();
  });

  it("returns planned capacities for matching month", () => {
    const plans = [{ month: 1, dailyCapacities: [3, 5, 4] }];
    const result = calculatePlannedDailyCounts(days, monthStart, plans as never);

    expect(result.get("2024-01-01")).toBe(3);
    expect(result.get("2024-01-02")).toBe(5);
    expect(result.get("2024-01-03")).toBe(4);
  });

  it("returns null for capacity index beyond dailyCapacities length", () => {
    const plans = [{ month: 1, dailyCapacities: [3] }];
    const result = calculatePlannedDailyCounts(days, monthStart, plans as never);

    expect(result.get("2024-01-01")).toBe(3);
    expect(result.get("2024-01-02")).toBeNull();
  });

  it("returns null for NaN capacity values", () => {
    const plans = [{ month: 1, dailyCapacities: [NaN, 5, 4] }];
    const result = calculatePlannedDailyCounts(days, monthStart, plans as never);

    expect(result.get("2024-01-01")).toBeNull();
    expect(result.get("2024-01-02")).toBe(5);
  });

  it("returns null for all days when dailyCapacities is null", () => {
    const plans = [{ month: 1, dailyCapacities: null }];
    const result = calculatePlannedDailyCounts(days, monthStart, plans as never);

    expect(result.get("2024-01-01")).toBeNull();
  });
});
