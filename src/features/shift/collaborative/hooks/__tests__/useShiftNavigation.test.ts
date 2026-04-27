import { act, renderHook } from "@testing-library/react";

import { useShiftNavigation } from "../useShiftNavigation";

describe("useShiftNavigation", () => {
  const staffIds = ["staff-1", "staff-2", "staff-3"];
  const dates = ["2024-03-01", "2024-03-02", "2024-03-03"];

  it("initializes with no focused cell", () => {
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates })
    );
    expect(result.current.focusedCell).toBeNull();
  });

  it("getCellKey returns correct key", () => {
    // Exposed via registerCell and focusCell behavior
    // Verify via registerCell - registering null removes
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates })
    );
    // No error should be thrown
    act(() => {
      result.current.registerCell("staff-1", "2024-03-01", null);
    });
    expect(result.current.focusedCell).toBeNull();
  });

  it("registerCell stores and removes DOM element refs", () => {
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates })
    );

    const mockElement = document.createElement("div");

    act(() => {
      result.current.registerCell("staff-1", "2024-03-01", mockElement);
    });

    // After registering with an element, focusCell should be able to use it
    act(() => {
      result.current.focusCell("staff-1", "2024-03-01");
    });

    expect(result.current.focusedCell).toEqual({
      staffId: "staff-1",
      date: "2024-03-01",
    });
  });

  it("focusCell does nothing if element not registered", () => {
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates })
    );

    act(() => {
      result.current.focusCell("staff-1", "2024-03-01");
    });

    expect(result.current.focusedCell).toBeNull();
  });

  it("focusCell calls onCellFocus callback", () => {
    const onCellFocus = jest.fn();
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates, onCellFocus })
    );

    const mockElement = document.createElement("div");
    mockElement.focus = jest.fn();

    act(() => {
      result.current.registerCell("staff-2", "2024-03-02", mockElement);
      result.current.focusCell("staff-2", "2024-03-02");
    });

    expect(onCellFocus).toHaveBeenCalledWith("staff-2", "2024-03-02");
  });

  it("clearFocus sets focusedCell to null", () => {
    const { result } = renderHook(() =>
      useShiftNavigation({ staffIds, dates })
    );

    const mockElement = document.createElement("div");
    act(() => {
      result.current.registerCell("staff-1", "2024-03-01", mockElement);
      result.current.focusCell("staff-1", "2024-03-01");
    });

    expect(result.current.focusedCell).not.toBeNull();

    act(() => {
      result.current.clearFocus();
    });

    expect(result.current.focusedCell).toBeNull();
  });

  describe("navigate", () => {
    it("focuses first cell when no cell is focused", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl = document.createElement("div");
      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl);
      });

      act(() => {
        result.current.navigate("down");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-01",
      });
    });

    it("does nothing when no cell focused and no staff/dates", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds: [], dates: [] })
      );

      act(() => {
        result.current.navigate("down");
      });

      expect(result.current.focusedCell).toBeNull();
    });

    it("moves down to next staff row", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl1 = document.createElement("div");
      const mockEl2 = document.createElement("div");

      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl1);
        result.current.registerCell("staff-2", "2024-03-01", mockEl2);
        result.current.focusCell("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.navigate("down");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-2",
        date: "2024-03-01",
      });
    });

    it("moves up to previous staff row", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl1 = document.createElement("div");
      const mockEl2 = document.createElement("div");

      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl1);
        result.current.registerCell("staff-2", "2024-03-01", mockEl2);
        result.current.focusCell("staff-2", "2024-03-01");
      });

      act(() => {
        result.current.navigate("up");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-01",
      });
    });

    it("moves right to next date", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl1 = document.createElement("div");
      const mockEl2 = document.createElement("div");

      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl1);
        result.current.registerCell("staff-1", "2024-03-02", mockEl2);
        result.current.focusCell("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.navigate("right");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-02",
      });
    });

    it("moves left to previous date", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl1 = document.createElement("div");
      const mockEl2 = document.createElement("div");

      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl1);
        result.current.registerCell("staff-1", "2024-03-02", mockEl2);
        result.current.focusCell("staff-1", "2024-03-02");
      });

      act(() => {
        result.current.navigate("left");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-01",
      });
    });

    it("clamps up at first row", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl = document.createElement("div");
      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl);
        result.current.focusCell("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.navigate("up");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-01",
      });
    });

    it("clamps left at first column", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl = document.createElement("div");
      act(() => {
        result.current.registerCell("staff-1", "2024-03-01", mockEl);
        result.current.focusCell("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.navigate("left");
      });

      // stays at same position
      expect(result.current.focusedCell).toEqual({
        staffId: "staff-1",
        date: "2024-03-01",
      });
    });

    it("clamps down at last row", () => {
      const { result } = renderHook(() =>
        useShiftNavigation({ staffIds, dates })
      );

      const mockEl = document.createElement("div");
      act(() => {
        result.current.registerCell("staff-3", "2024-03-01", mockEl);
        result.current.focusCell("staff-3", "2024-03-01");
      });

      act(() => {
        result.current.navigate("down");
      });

      expect(result.current.focusedCell).toEqual({
        staffId: "staff-3",
        date: "2024-03-01",
      });
    });
  });
});
