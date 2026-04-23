import { buildSummaryFromAssignments } from "../shiftAssignments";

describe("buildSummaryFromAssignments", () => {
  it("returns zero counts for empty assignments", () => {
    const result = buildSummaryFromAssignments({});
    expect(result).toEqual({ workDays: 0, fixedOffDays: 0, requestedOffDays: 0 });
  });

  it("counts work days correctly", () => {
    const result = buildSummaryFromAssignments({
      "01": "work",
      "02": "work",
      "03": "fixedOff",
    });
    expect(result.workDays).toBe(2);
  });

  it("counts fixedOff days correctly", () => {
    const result = buildSummaryFromAssignments({
      "01": "fixedOff",
      "02": "fixedOff",
      "03": "work",
    });
    expect(result.fixedOffDays).toBe(2);
  });

  it("counts requestedOff days correctly", () => {
    const result = buildSummaryFromAssignments({
      "01": "requestedOff",
      "02": "requestedOff",
      "03": "requestedOff",
    });
    expect(result.requestedOffDays).toBe(3);
  });

  it("ignores auto and empty states in all counts", () => {
    const result = buildSummaryFromAssignments({
      "01": "auto",
      "02": "empty",
    });
    expect(result.workDays).toBe(0);
    expect(result.fixedOffDays).toBe(0);
    expect(result.requestedOffDays).toBe(0);
  });

  it("handles mixed states correctly", () => {
    const result = buildSummaryFromAssignments({
      "01": "work",
      "02": "fixedOff",
      "03": "requestedOff",
      "04": "auto",
      "05": "empty",
      "06": "work",
    });
    expect(result.workDays).toBe(2);
    expect(result.fixedOffDays).toBe(1);
    expect(result.requestedOffDays).toBe(1);
  });
});
