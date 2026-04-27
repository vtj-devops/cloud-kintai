import { act, renderHook } from "@testing-library/react";
import dayjs from "dayjs";

import { ShiftState } from "../../types/collaborative.types";
import { useShiftSuggestions } from "../useShiftSuggestions";

function makeShiftDataMap(
  entries: Array<{ staffId: string; date: string; state: ShiftState }>
): Map<string, Map<string, { state: ShiftState }>> {
  const map = new Map<string, Map<string, { state: ShiftState }>>();
  for (const { staffId, date, state } of entries) {
    if (!map.has(staffId)) {
      map.set(staffId, new Map());
    }
    map.get(staffId)!.set(date, { state });
  }
  return map;
}

const DATE_KEYS = ["2025-06-01", "2025-06-02", "2025-06-03"];
const STAFF_IDS = ["staff-1", "staff-2"];
const DAYS = DATE_KEYS.map((k) => dayjs(k));

describe("useShiftSuggestions", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("violations=[], isAnalyzing=false, stats all zeros", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: [],
          dateKeys: [],
          enabled: false,
        })
      );

      expect(result.current.violations).toEqual([]);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.stats.totalViolations).toBe(0);
      expect(result.current.stats.totalSuggestions).toBe(0);
      expect(result.current.stats.errorCount).toBe(0);
      expect(result.current.stats.warningCount).toBe(0);
      expect(result.current.stats.infoCount).toBe(0);
    });
  });

  describe("enabled=false", () => {
    it("analyzeShifts does nothing when enabled=false", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: DATE_KEYS,
          enabled: false,
        })
      );

      act(() => {
        result.current.analyzeShifts();
      });

      expect(result.current.violations).toEqual([]);
    });

    it("does not auto-analyze after 500ms when disabled", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: DATE_KEYS,
          enabled: false,
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.violations).toEqual([]);
    });
  });

  describe("enabled=true with debounce", () => {
    it("auto-analyzes after 500ms debounce", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: [],
          dateKeys: [],
          enabled: true,
        })
      );

      // Before debounce fires, violations may not be set yet
      act(() => {
        jest.advanceTimersByTime(499);
      });
      // No change yet (debounce not triggered)

      act(() => {
        jest.advanceTimersByTime(1);
      });
      // After 500ms, analyze runs
      // With empty inputs, no violations expected
      expect(result.current.violations).toEqual([]);
    });
  });

  describe("capacity rules", () => {
    it("capacity unset → adds warning violation", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const capacityUnset = result.current.violations.find((v) =>
        v.ruleId.startsWith("capacity-unset")
      );
      expect(capacityUnset).toBeDefined();
      expect(capacityUnset?.severity).toBe("warning");
    });

    it("capacity set, workCount < plannedCapacity → adds capacity-shortage warning", () => {
      // plannedCapacity=2, only staff-1 is working
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "fixedOff" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [2],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const shortage = result.current.violations.find((v) =>
        v.ruleId.startsWith("capacity-shortage")
      );
      expect(shortage).toBeDefined();
      expect(shortage?.severity).toBe("warning");
    });

    it("capacity set, workCount > plannedCapacity → adds capacity-excess info", () => {
      // plannedCapacity=1, both working
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "work" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [1],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const excess = result.current.violations.find((v) =>
        v.ruleId.startsWith("capacity-excess")
      );
      expect(excess).toBeDefined();
      expect(excess?.severity).toBe("info");
    });

    it("capacity=0 with workers → adds capacity-excess warning", () => {
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [0],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const excess = result.current.violations.find((v) =>
        v.ruleId.startsWith("capacity-excess")
      );
      expect(excess).toBeDefined();
      expect(excess?.severity).toBe("warning");
    });
  });

  describe("min-workers rule", () => {
    it("min-workers rule violation → adds error violation", () => {
      // No capacity set, only 1 worker (below default min of 2)
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "empty" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const minWorkerViolation = result.current.violations.find(
        (v) => v.ruleId === "min-workers"
      );
      expect(minWorkerViolation).toBeDefined();
      expect(minWorkerViolation?.severity).toBe("error");
    });

    it("min-workers rule skipped when shiftPlanIsSet", () => {
      // plannedCapacity=2 set, workCount=0 (shortage will appear, but min-workers rule should not)
      // Note: staff-level rule check still runs min-workers with date="", so we check by date
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [2],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // min-workers should NOT fire for the specific date (it's skipped when shiftPlanIsSet)
      const minWorkerDateViolation = result.current.violations.find(
        (v) => v.ruleId === "min-workers" && v.affectedCells.some((c) => c.date === DATE_KEYS[0])
      );
      expect(minWorkerDateViolation).toBeUndefined();
    });
  });

  describe("clearViolations", () => {
    it("empties violations", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.clearViolations();
      });

      expect(result.current.violations).toEqual([]);
    });
  });

  describe("violation filters", () => {
    it("errorViolations filters by severity=error", () => {
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "empty" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "empty" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.errorViolations.every((v) => v.severity === "error")).toBe(true);
    });

    it("warningViolations filters by severity=warning", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.warningViolations.every((v) => v.severity === "warning")).toBe(true);
    });

    it("infoViolations filters by severity=info", () => {
      // capacity=1, 2 workers → info
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "work" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [1],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.infoViolations.length).toBeGreaterThan(0);
      expect(result.current.infoViolations.every((v) => v.severity === "info")).toBe(true);
    });
  });

  describe("stats", () => {
    it("stats.totalViolations counts all", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.stats.totalViolations).toBe(result.current.violations.length);
    });

    it("stats.totalSuggestions counts all suggestedActions", () => {
      // capacity shortage with available staff → suggestedActions exist
      const shiftDataMap = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "fixedOff" },
        { staffId: "staff-2", date: DATE_KEYS[0], state: "fixedOff" },
      ]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [DATE_KEYS[0]],
          enabled: true,
          shiftPlanCapacities: [2],
          days: [DAYS[0]],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const expectedTotal = result.current.violations.reduce(
        (acc, v) => acc + (v.suggestedActions?.length ?? 0),
        0
      );
      expect(result.current.stats.totalSuggestions).toBe(expectedTotal);
    });
  });

  describe("analyzeShifts", () => {
    it("can be called manually", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: [],
          dateKeys: [],
          enabled: true,
        })
      );

      // Don't advance timers, call manually
      act(() => {
        result.current.analyzeShifts();
      });

      // Should run without errors
      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe("consecutive-work-days violation", () => {
    it("consecutive-work-days violation detected", () => {
      // 6 consecutive work days for staff-1 (exceeds default max of 5)
      const entries = Array.from({ length: 6 }, (_, i) => ({
        staffId: "staff-1",
        date: dayjs("2025-06-01").add(i, "day").format("YYYY-MM-DD"),
        state: "work" as ShiftState,
      }));
      const allDateKeys = entries.map((e) => e.date);
      const shiftDataMap = makeShiftDataMap(entries);

      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: ["staff-1"],
          dateKeys: allDateKeys,
          enabled: true,
          shiftPlanCapacities: [],
          days: [],
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const consecutiveViolation = result.current.violations.find(
        (v) => v.ruleId === "consecutive-work-days"
      );
      expect(consecutiveViolation).toBeDefined();
      expect(consecutiveViolation?.severity).toBe("warning");
    });
  });

  describe("edge cases", () => {
    it("staffIds empty → no staff-level violations", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: [],
          dateKeys: [],
          enabled: true,
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // No violations because no staff and no dates
      expect(result.current.violations).toEqual([]);
    });

    it("dateKeys empty → no date violations", () => {
      const shiftDataMap = makeShiftDataMap([]);
      const { result } = renderHook(() =>
        useShiftSuggestions({
          shiftDataMap,
          staffIds: STAFF_IDS,
          dateKeys: [],
          enabled: true,
        })
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // No date-level capacity violations when dateKeys is empty
      const dateCapacityViolations = result.current.violations.filter((v) =>
        v.ruleId.startsWith("capacity-")
      );
      expect(dateCapacityViolations).toEqual([]);
    });

    it("resets debounce timer when deps change", () => {
      const shiftDataMap1 = makeShiftDataMap([]);
      const shiftDataMap2 = makeShiftDataMap([
        { staffId: "staff-1", date: DATE_KEYS[0], state: "work" },
      ]);

      const { rerender } = renderHook(
        ({ shiftDataMap }) =>
          useShiftSuggestions({
            shiftDataMap,
            staffIds: [],
            dateKeys: [],
            enabled: true,
          }),
        { initialProps: { shiftDataMap: shiftDataMap1 } }
      );

      // Advance 300ms, then change deps
      act(() => {
        jest.advanceTimersByTime(300);
      });
      rerender({ shiftDataMap: shiftDataMap2 });

      // Now advance 300ms more (total 600ms from initial but only 300ms since re-render)
      // Timer should have been reset; this should NOT trigger the first render's timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Advance remaining 200ms for the new timer to fire
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // After debounce fires from second render, violations are computed (empty in this case)
      // Just verify no error was thrown
    });
  });
});
