import { act, renderHook } from "@testing-library/react";
import dayjs from "dayjs";

import { useShiftPlanRows } from "../useShiftPlanRows";

describe("useShiftPlanRows", () => {
  const currentYear = dayjs().year();

  it("returns initial state with current year and 12 rows", () => {
    const { result } = renderHook(() => useShiftPlanRows());
    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.currentRows).toHaveLength(12);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isPending).toBe(false);
  });

  it("currentRows has month 1–12 all enabled by default", () => {
    const { result } = renderHook(() => useShiftPlanRows());
    result.current.currentRows.forEach((row, i) => {
      expect(row.month).toBe(i + 1);
      expect(row.enabled).toBe(true);
    });
  });

  describe("handleYearChange", () => {
    it("navigates to next year", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleYearChange(1);
      });
      expect(result.current.selectedYear).toBe(currentYear + 1);
      expect(result.current.currentRows).toHaveLength(12);
    });

    it("navigates to previous year", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleYearChange(-1);
      });
      expect(result.current.selectedYear).toBe(currentYear - 1);
      expect(result.current.currentRows).toHaveLength(12);
    });

    it("initialises rows for the new year in yearlyPlans and savedYearlyPlans", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      const nextYear = currentYear + 2;
      act(() => {
        result.current.handleYearChange(2);
      });
      expect(result.current.yearlyPlans[nextYear]).toBeDefined();
      expect(result.current.savedYearlyPlans[nextYear]).toBeDefined();
    });
  });

  describe("handleFieldChange", () => {
    it("updates editStart for the specified month only", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleFieldChange(3, "editStart", "2024-03-10");
      });
      const march = result.current.currentRows.find((r) => r.month === 3);
      const jan = result.current.currentRows.find((r) => r.month === 1);
      expect(march?.editStart).toBe("2024-03-10");
      expect(jan?.editStart).not.toBe("2024-03-10");
    });

    it("updates editEnd for the specified month", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleFieldChange(5, "editEnd", "2024-05-25");
      });
      const may = result.current.currentRows.find((r) => r.month === 5);
      expect(may?.editEnd).toBe("2024-05-25");
    });
  });

  describe("handleToggleEnabled", () => {
    it("toggles enabled from true to false", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleToggleEnabled(1);
      });
      const jan = result.current.currentRows.find((r) => r.month === 1);
      expect(jan?.enabled).toBe(false);
    });

    it("toggles enabled from false back to true", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleToggleEnabled(1);
      });
      act(() => {
        result.current.handleToggleEnabled(1);
      });
      const jan = result.current.currentRows.find((r) => r.month === 1);
      expect(jan?.enabled).toBe(true);
    });

    it("only toggles the specified month", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleToggleEnabled(2);
      });
      const jan = result.current.currentRows.find((r) => r.month === 1);
      const feb = result.current.currentRows.find((r) => r.month === 2);
      expect(jan?.enabled).toBe(true);
      expect(feb?.enabled).toBe(false);
    });
  });

  describe("handleDailyCapacityChange", () => {
    it("updates the specified day index for the given month", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleDailyCapacityChange(2, 0, "5");
      });
      const feb = result.current.currentRows.find((r) => r.month === 2);
      expect(feb?.dailyCapacity[0]).toBe("5");
    });

    it("sanitizes invalid values to empty string", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleDailyCapacityChange(2, 0, "abc");
      });
      const feb = result.current.currentRows.find((r) => r.month === 2);
      expect(feb?.dailyCapacity[0]).toBe("");
    });

    it("clamps negative values to 0", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleDailyCapacityChange(2, 0, "-3");
      });
      const feb = result.current.currentRows.find((r) => r.month === 2);
      expect(feb?.dailyCapacity[0]).toBe("0");
    });

    it("only modifies the target month", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleDailyCapacityChange(3, 4, "7");
      });
      const jan = result.current.currentRows.find((r) => r.month === 1);
      const mar = result.current.currentRows.find((r) => r.month === 3);
      expect(jan?.dailyCapacity[4]).toBe("");
      expect(mar?.dailyCapacity[4]).toBe("7");
    });
  });

  describe("isDirty", () => {
    it("becomes true after a field change", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      expect(result.current.isDirty).toBe(false);
      act(() => {
        result.current.handleFieldChange(1, "editStart", "2024-01-05");
      });
      expect(result.current.isDirty).toBe(true);
    });

    it("becomes false when savedYearlyPlans is synced with yearlyPlans", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.handleFieldChange(1, "editStart", "2024-01-05");
      });
      expect(result.current.isDirty).toBe(true);
      act(() => {
        result.current.setSavedYearlyPlans(result.current.yearlyPlans);
      });
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("updateYearRows", () => {
    it("applies the updater function to rows for the specified year", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.updateYearRows(currentYear, (rows) =>
          rows.map((r) => (r.month === 6 ? { ...r, enabled: false } : r)),
        );
      });
      const june = result.current.currentRows.find((r) => r.month === 6);
      expect(june?.enabled).toBe(false);
    });
  });

  describe("setYearlyPlans / setSavedYearlyPlans", () => {
    it("exposes setYearlyPlans to override plans externally", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.setYearlyPlans((prev) => ({
          ...prev,
          [currentYear]: prev[currentYear].map((r) =>
            r.month === 1 ? { ...r, editStart: "2025-01-15" } : r,
          ),
        }));
      });
      const jan = result.current.currentRows.find((r) => r.month === 1);
      expect(jan?.editStart).toBe("2025-01-15");
    });

    it("exposes setSavedYearlyPlans to override saved plans externally", () => {
      const { result } = renderHook(() => useShiftPlanRows());
      act(() => {
        result.current.setSavedYearlyPlans((prev) => ({
          ...prev,
          [currentYear]: prev[currentYear].map((r) =>
            r.month === 1 ? { ...r, editStart: "2025-01-15" } : r,
          ),
        }));
      });
      expect(result.current.savedYearlyPlans[currentYear][0].editStart).toBe(
        "2025-01-15",
      );
    });
  });
});
