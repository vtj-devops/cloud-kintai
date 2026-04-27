import { act, renderHook } from "@testing-library/react";
import dayjs, { Dayjs } from "dayjs";
import type { Dispatch, SetStateAction } from "react";

import { SelectedDateMap } from "../statusMapping";
import { useShiftCalendarSelection } from "../useShiftCalendarSelection";

const MONTH_START = dayjs("2025-06-01");

function buildDays(monthStart: Dayjs): Dayjs[] {
  const days: Dayjs[] = [];
  const daysInMonth = monthStart.daysInMonth();
  for (let i = 0; i < daysInMonth; i++) {
    days.push(monthStart.add(i, "day"));
  }
  return days;
}

function buildDayKeyList(days: Dayjs[]): string[] {
  return days.map((d) => d.format("YYYY-MM-DD"));
}

function buildDefaultParams(
  overrides: Partial<{
    isMobile: boolean;
    setSelectedDates: Dispatch<SetStateAction<SelectedDateMap>>;
  }> = {},
) {
  const days = buildDays(MONTH_START);
  const dayKeyList = buildDayKeyList(days);
  const setSelectedDates = jest.fn((value: SetStateAction<SelectedDateMap>) =>
    typeof value === "function" ? value({}) : value,
  ) as unknown as Dispatch<SetStateAction<SelectedDateMap>>;
  return {
    dayKeyList,
    days,
    monthStart: MONTH_START,
    isMobile: false,
    setSelectedDates,
    ...overrides,
  };
}

describe("useShiftCalendarSelection", () => {
  describe("initial state", () => {
    it("has null focusedDateKey, isSelectionMode=false, empty selectedRowKeys, hasRowSelection=false", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));
      expect(result.current.focusedDateKey).toBeNull();
      expect(result.current.isSelectionMode).toBe(false);
      expect(result.current.selectedRowKeys).toEqual([]);
      expect(result.current.hasRowSelection).toBe(false);
    });
  });

  describe("setIsSelectionMode", () => {
    it("setIsSelectionMode(true) clears focusedDateKey and sets anchor to null", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.handleCalendarDayClick(MONTH_START.add(2, "day"));
      });

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.focusedDateKey).toBeNull();
    });

    it("setIsSelectionMode(false) restores normal mode", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      act(() => {
        result.current.setIsSelectionMode(false);
      });

      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe("toggleAllRowsSelection", () => {
    it("selects all when none selected", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });

      expect(result.current.selectedRowKeys).toEqual(params.dayKeyList);
    });

    it("deselects all when all selected", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });

  describe("clearRowSelection", () => {
    it("clears all selected rows", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });
      act(() => {
        result.current.clearRowSelection();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
      expect(result.current.hasRowSelection).toBe(false);
    });
  });

  describe("handleCalendarDayClick", () => {
    it("in normal mode - sets focusedDateKey", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      const targetDay = MONTH_START.add(4, "day");
      act(() => {
        result.current.handleCalendarDayClick(targetDay);
      });

      expect(result.current.focusedDateKey).toBe(
        targetDay.format("YYYY-MM-DD"),
      );
    });

    it("outside current month - does nothing", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      const outsideDay = MONTH_START.subtract(1, "month");
      act(() => {
        result.current.handleCalendarDayClick(outsideDay);
      });

      expect(result.current.focusedDateKey).toBeNull();
    });

    it("in selection mode - toggles day selection (adds)", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      const targetDay = MONTH_START.add(1, "day");
      const key = targetDay.format("YYYY-MM-DD");

      act(() => {
        result.current.handleCalendarDayClick(targetDay);
      });

      expect(result.current.selectedRowKeys).toContain(key);
    });

    it("in selection mode - deselects already selected day", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      const targetDay = MONTH_START.add(1, "day");
      const key = targetDay.format("YYYY-MM-DD");

      act(() => {
        result.current.handleCalendarDayClick(targetDay);
      });
      act(() => {
        result.current.handleCalendarDayClick(targetDay);
      });

      expect(result.current.selectedRowKeys).not.toContain(key);
    });

    it("with shiftKey in selection mode (desktop) - extends range", () => {
      const params = buildDefaultParams({ isMobile: false });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      const firstDay = MONTH_START;
      act(() => {
        result.current.handleCalendarDayClick(firstDay);
      });

      const lastDay = MONTH_START.add(4, "day");
      act(() => {
        result.current.handleCalendarDayClick(lastDay, {
          shiftKey: true,
        } as React.MouseEvent<HTMLDivElement>);
      });

      expect(result.current.selectedRowKeys.length).toBe(5);
    });

    it("with shiftKey on mobile - does NOT extend range (ignores shift)", () => {
      const params = buildDefaultParams({ isMobile: true });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      const firstDay = MONTH_START;
      act(() => {
        result.current.handleCalendarDayClick(firstDay);
      });

      const lastDay = MONTH_START.add(4, "day");
      act(() => {
        result.current.handleCalendarDayClick(lastDay, {
          shiftKey: true,
        } as React.MouseEvent<HTMLDivElement>);
      });

      // On mobile, shift is ignored so only second click's key is toggled individually
      expect(result.current.selectedRowKeys.length).toBe(2);
    });
  });

  describe("handleWeekdayLabelClick", () => {
    it("selects all days of given weekday", () => {
      const params = buildDefaultParams({ isMobile: false });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      // Find the weekday index of the first day of the month
      const weekday = MONTH_START.day();
      const expectedKeys = params.days
        .filter((d) => d.day() === weekday)
        .map((d) => d.format("YYYY-MM-DD"));

      act(() => {
        result.current.handleWeekdayLabelClick(weekday);
      });

      expectedKeys.forEach((key) => {
        expect(result.current.selectedRowKeys).toContain(key);
      });
    });

    it("deselects days if already all selected for that weekday", () => {
      const params = buildDefaultParams({ isMobile: false });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      const weekday = MONTH_START.day();
      const expectedKeys = params.days
        .filter((d) => d.day() === weekday)
        .map((d) => d.format("YYYY-MM-DD"));

      // Select them
      act(() => {
        result.current.handleWeekdayLabelClick(weekday);
      });
      // Deselect them
      act(() => {
        result.current.handleWeekdayLabelClick(weekday);
      });

      expectedKeys.forEach((key) => {
        expect(result.current.selectedRowKeys).not.toContain(key);
      });
    });

    it("on mobile - does nothing", () => {
      const params = buildDefaultParams({ isMobile: true });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      act(() => {
        result.current.handleWeekdayLabelClick(1);
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });

    it("when not in selection mode - does nothing", () => {
      const params = buildDefaultParams({ isMobile: false });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.handleWeekdayLabelClick(1);
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });

  describe("applyStatusToSelection", () => {
    it("applies status to all selected rows", () => {
      let capturedDates: SelectedDateMap = {};
      const setSelectedDates = jest.fn(
        (value: SetStateAction<SelectedDateMap>) => {
          if (typeof value === "function") {
            capturedDates = value(capturedDates);
          }
        },
      ) as unknown as Dispatch<SetStateAction<SelectedDateMap>>;
      const params = buildDefaultParams({ setSelectedDates });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.handleCalendarDayClick(MONTH_START);
        result.current.handleCalendarDayClick(MONTH_START.add(1, "day"));
      });
      act(() => {
        result.current.applyStatusToSelection("work");
      });

      expect(setSelectedDates).toHaveBeenCalled();
      const key1 = MONTH_START.format("YYYY-MM-DD");
      const key2 = MONTH_START.add(1, "day").format("YYYY-MM-DD");
      expect(capturedDates[key1]).toEqual({ status: "work" });
      expect(capturedDates[key2]).toEqual({ status: "work" });
    });

    it("does nothing when no rows selected", () => {
      const setSelectedDates = jest.fn();
      const params = buildDefaultParams({ setSelectedDates });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.applyStatusToSelection("work");
      });

      expect(setSelectedDates).not.toHaveBeenCalled();
    });
  });

  describe("setStatusForDate", () => {
    it("sets status for single date", () => {
      let capturedDates: SelectedDateMap = {};
      const setSelectedDates = jest.fn(
        (value: SetStateAction<SelectedDateMap>) => {
          if (typeof value === "function") {
            capturedDates = value(capturedDates);
          }
        },
      ) as unknown as Dispatch<SetStateAction<SelectedDateMap>>;
      const params = buildDefaultParams({ setSelectedDates });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      const key = MONTH_START.format("YYYY-MM-DD");
      act(() => {
        result.current.setStatusForDate(key, "work");
      });

      expect(capturedDates[key]).toEqual({ status: "work" });
    });
  });

  describe("clearDateSelection", () => {
    it("removes date from selectedDates", () => {
      let capturedDates: SelectedDateMap = { "2025-06-01": { status: "work" } };
      const setSelectedDates = jest.fn(
        (value: SetStateAction<SelectedDateMap>) => {
          if (typeof value === "function") {
            capturedDates = value(capturedDates);
          }
        },
      ) as unknown as Dispatch<SetStateAction<SelectedDateMap>>;
      const params = buildDefaultParams({ setSelectedDates });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.clearDateSelection("2025-06-01");
      });

      expect(capturedDates["2025-06-01"]).toBeUndefined();
    });
  });

  describe("selectedRowKeys", () => {
    it("filters out keys not in dayKeyList", () => {
      const days = buildDays(MONTH_START);
      const dayKeyList = buildDayKeyList(days);
      const setSelectedDates = jest.fn();
      const { result, rerender } = renderHook(
        (props) => useShiftCalendarSelection(props),
        {
          initialProps: {
            dayKeyList,
            days,
            monthStart: MONTH_START,
            isMobile: false,
            setSelectedDates,
          },
        },
      );

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });

      // Rerender with narrower dayKeyList
      const narrowKeys = [dayKeyList[0], dayKeyList[1]];
      const narrowDays = [days[0], days[1]];
      rerender({
        dayKeyList: narrowKeys,
        days: narrowDays,
        monthStart: MONTH_START,
        isMobile: false,
        setSelectedDates,
      });

      expect(result.current.selectedRowKeys.length).toBe(2);
    });
  });

  describe("activeFocusedDateKey", () => {
    it("returns null in selection mode", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.handleCalendarDayClick(MONTH_START);
      });

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      expect(result.current.focusedDateKey).toBeNull();
    });
  });

  describe("canBulkSelectByWeekday", () => {
    it("is true only when desktop AND isSelectionMode", () => {
      const params = buildDefaultParams({ isMobile: false });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      expect(result.current.canBulkSelectByWeekday).toBe(false);

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      expect(result.current.canBulkSelectByWeekday).toBe(true);
    });

    it("is false on mobile even in selection mode", () => {
      const params = buildDefaultParams({ isMobile: true });
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      expect(result.current.canBulkSelectByWeekday).toBe(false);
    });
  });

  describe("isAllRowsSelected", () => {
    it("is true when all days in dayKeyList are selected", () => {
      const params = buildDefaultParams();
      const { result } = renderHook(() => useShiftCalendarSelection(params));

      act(() => {
        result.current.setIsSelectionMode(true);
      });
      act(() => {
        result.current.toggleAllRowsSelection();
      });

      expect(result.current.selectedRowKeys.length).toBe(
        params.dayKeyList.length,
      );
    });
  });
});
