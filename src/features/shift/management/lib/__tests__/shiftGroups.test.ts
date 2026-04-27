import { getGroupCoveragePresentation } from "../shiftGroups";

describe("getGroupCoveragePresentation", () => {
  describe("fixed constraint", () => {
    it("returns no violation when actual equals fixed", () => {
      const result = getGroupCoveragePresentation(3, { min: null, max: null, fixed: 3 });
      expect(result.violationTone).toBeNull();
      expect(result.violationReason).toBeNull();
      expect(result.primaryColor).toBe("text.primary");
    });

    it("returns error when actual is below fixed", () => {
      const result = getGroupCoveragePresentation(2, { min: null, max: null, fixed: 3 });
      expect(result.violationTone).toBe("error");
      expect(result.primaryColor).toBe("error.main");
      expect(result.violationReason).toContain("3名");
    });

    it("returns warning when actual exceeds fixed", () => {
      const result = getGroupCoveragePresentation(4, { min: null, max: null, fixed: 3 });
      expect(result.violationTone).toBe("warning");
      expect(result.primaryColor).toBe("warning.main");
      expect(result.violationReason).toContain("3名");
    });
  });

  describe("min/max constraint", () => {
    it("returns no violation when actual is within range", () => {
      const result = getGroupCoveragePresentation(3, { min: 2, max: 5, fixed: null });
      expect(result.violationTone).toBeNull();
      expect(result.violationReason).toBeNull();
    });

    it("returns error when actual is below min", () => {
      const result = getGroupCoveragePresentation(1, { min: 2, max: 5, fixed: null });
      expect(result.violationTone).toBe("error");
      expect(result.violationReason).toContain("2名以上");
    });

    it("returns warning when actual exceeds max", () => {
      const result = getGroupCoveragePresentation(6, { min: 2, max: 5, fixed: null });
      expect(result.violationTone).toBe("warning");
      expect(result.violationReason).toContain("5名以下");
    });

    it("returns no violation when actual equals min", () => {
      const result = getGroupCoveragePresentation(2, { min: 2, max: 5, fixed: null });
      expect(result.violationTone).toBeNull();
    });

    it("returns no violation when actual equals max", () => {
      const result = getGroupCoveragePresentation(5, { min: 2, max: 5, fixed: null });
      expect(result.violationTone).toBeNull();
    });
  });

  describe("no constraints", () => {
    it("returns no violation when all constraints are null", () => {
      const result = getGroupCoveragePresentation(5, { min: null, max: null, fixed: null });
      expect(result.violationTone).toBeNull();
      expect(result.violationReason).toBeNull();
      expect(result.primaryColor).toBe("text.primary");
    });
  });

  describe("primary display", () => {
    it("shows actual count as string", () => {
      const result = getGroupCoveragePresentation(7, { min: null, max: null, fixed: null });
      expect(result.primary).toBe("7");
    });
  });
});
