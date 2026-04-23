import {
  createConsecutiveWorkDaysRule,
  createMaxWorkersRule,
  createMinWorkersRule,
  getDefaultRules,
  type RuleContext,
} from "../shiftRules";

const buildContext = (
  date: string,
  staffStates: Record<string, string>,
  staffIds?: string[],
  allDates?: string[]
): RuleContext => {
  const shiftDataMap = new Map<string, Map<string, { state: "work" | "fixedOff" | "requestedOff" | "auto" | "empty" }>>();
  const ids = staffIds ?? Object.keys(staffStates);
  for (const staffId of ids) {
    const staffMap = new Map<string, { state: "work" | "fixedOff" | "requestedOff" | "auto" | "empty" }>();
    if (staffStates[staffId]) {
      staffMap.set(date, { state: staffStates[staffId] as "work" | "fixedOff" | "requestedOff" | "auto" | "empty" });
    }
    shiftDataMap.set(staffId, staffMap);
  }
  return {
    date,
    shiftDataMap,
    staffIds: ids,
    dateKeys: allDates ?? [date],
  };
};

describe("createMinWorkersRule", () => {
  const rule = createMinWorkersRule(2);

  it("returns null when work count meets minimum", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "work" });
    expect(rule.check(ctx)).toBeNull();
  });

  it("returns null when work count exceeds minimum", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "work", "s3": "work" });
    expect(rule.check(ctx)).toBeNull();
  });

  it("returns violation when work count is below minimum", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "fixedOff" });
    const violation = rule.check(ctx);
    expect(violation).not.toBeNull();
    expect(violation!.ruleId).toBe("min-workers");
    expect(violation!.severity).toBe("error");
  });

  it("suggests available staff as actions", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "empty", "s3": "auto" });
    const violation = rule.check(ctx);
    expect(violation!.suggestedActions).toHaveLength(1);
  });
});

describe("createMaxWorkersRule", () => {
  const rule = createMaxWorkersRule(2);

  it("returns null when work count is at max", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "work" });
    expect(rule.check(ctx)).toBeNull();
  });

  it("returns violation when work count exceeds max", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "work", "s3": "work" });
    const violation = rule.check(ctx);
    expect(violation).not.toBeNull();
    expect(violation!.ruleId).toBe("max-workers");
    expect(violation!.severity).toBe("warning");
  });

  it("provides suggestedActions to reduce workers", () => {
    const ctx = buildContext("01", { "s1": "work", "s2": "work", "s3": "work" });
    const violation = rule.check(ctx);
    expect(violation!.suggestedActions!.length).toBeGreaterThan(0);
  });
});

describe("createConsecutiveWorkDaysRule", () => {
  const rule = createConsecutiveWorkDaysRule(3);

  const buildConsecutiveContext = (
    staffId: string,
    states: Record<string, string>
  ): RuleContext => {
    const dateKeys = Object.keys(states).toSorted();
    const shiftDataMap = new Map<string, Map<string, { state: "work" | "fixedOff" | "requestedOff" | "auto" | "empty" }>>();
    const staffMap = new Map<string, { state: "work" | "fixedOff" | "requestedOff" | "auto" | "empty" }>();
    for (const [date, state] of Object.entries(states)) {
      staffMap.set(date, { state: state as "work" | "fixedOff" | "requestedOff" | "auto" | "empty" });
    }
    shiftDataMap.set(staffId, staffMap);
    return { date: dateKeys[0], staffId, shiftDataMap, staffIds: [staffId], dateKeys };
  };

  it("returns null when no staffId is given", () => {
    const ctx = buildContext("01", {});
    const ctxNoStaff: RuleContext = { ...ctx, staffId: undefined };
    expect(rule.check(ctxNoStaff)).toBeNull();
  });

  it("returns null when consecutive count does not exceed max", () => {
    const ctx = buildConsecutiveContext("s1", { "01": "work", "02": "work", "03": "fixedOff" });
    expect(rule.check(ctx)).toBeNull();
  });

  it("returns violation when consecutive count exceeds max", () => {
    const ctx = buildConsecutiveContext("s1", {
      "01": "work", "02": "work", "03": "work", "04": "work",
    });
    const violation = rule.check(ctx);
    expect(violation).not.toBeNull();
    expect(violation!.ruleId).toBe("consecutive-work-days");
    expect(violation!.severity).toBe("warning");
  });

  it("resets counter after a non-work day", () => {
    const ctx = buildConsecutiveContext("s1", {
      "01": "work", "02": "work", "03": "fixedOff",
      "04": "work", "05": "work", "06": "work",
    });
    expect(rule.check(ctx)).toBeNull();
  });
});

describe("getDefaultRules", () => {
  it("returns three default rules", () => {
    const rules = getDefaultRules();
    expect(rules).toHaveLength(3);
    const ids = rules.map((r) => r.id);
    expect(ids).toContain("min-workers");
    expect(ids).toContain("max-workers");
    expect(ids).toContain("consecutive-work-days");
  });
});
