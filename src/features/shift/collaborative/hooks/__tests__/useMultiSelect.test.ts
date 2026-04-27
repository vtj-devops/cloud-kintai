import { act, renderHook } from "@testing-library/react";

import { useMultiSelect } from "../useMultiSelect";

const staffIds = ["staff-1", "staff-2", "staff-3"];
const dates = ["2024-03-01", "2024-03-02", "2024-03-03"];

describe("useMultiSelect", () => {
  it("initializes with no selection", () => {
    const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));
    expect(result.current.selectedCells).toEqual([]);
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.isDragging).toBe(false);
  });

  describe("selectCell", () => {
    it("selects a single cell", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectCell("staff-1", "2024-03-01");
      });

      expect(result.current.selectionCount).toBe(1);
      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(true);
    });

    it("replaces existing selection", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectCell("staff-1", "2024-03-01");
        result.current.selectCell("staff-2", "2024-03-02");
      });

      expect(result.current.selectionCount).toBe(1);
      expect(result.current.isCellSelected("staff-2", "2024-03-02")).toBe(true);
      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(false);
    });
  });

  describe("toggleCell", () => {
    it("adds cell to selection", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.toggleCell("staff-1", "2024-03-01");
      });

      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(true);
    });

    it("removes cell from selection when already selected", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.toggleCell("staff-1", "2024-03-01");
        result.current.toggleCell("staff-1", "2024-03-01");
      });

      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(false);
    });

    it("adds multiple cells independently", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.toggleCell("staff-1", "2024-03-01");
        result.current.toggleCell("staff-2", "2024-03-02");
      });

      expect(result.current.selectionCount).toBe(2);
    });
  });

  describe("selectRange", () => {
    it("selects just the target cell when no lastClickedCell", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectRange("staff-1", "2024-03-01");
      });

      expect(result.current.selectionCount).toBe(1);
      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(true);
    });

    it("selects a rectangular range using lastClickedCell as anchor", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      // First select a cell to set lastClickedCell via selectCell
      act(() => {
        result.current.selectCell("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.selectRange("staff-2", "2024-03-02");
      });

      expect(result.current.selectionCount).toBe(4);
      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(true);
      expect(result.current.isCellSelected("staff-1", "2024-03-02")).toBe(true);
      expect(result.current.isCellSelected("staff-2", "2024-03-01")).toBe(true);
      expect(result.current.isCellSelected("staff-2", "2024-03-02")).toBe(true);
    });

    it("handles inverted range (end before start)", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectCell("staff-2", "2024-03-02");
      });

      act(() => {
        result.current.selectRange("staff-1", "2024-03-01");
      });

      expect(result.current.selectionCount).toBe(4);
    });
  });

  describe("drag selection", () => {
    it("starts drag and selects initial cell", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.startDragSelect("staff-1", "2024-03-01");
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.isCellSelected("staff-1", "2024-03-01")).toBe(true);
    });

    it("updateDragSelect does nothing when not dragging", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.updateDragSelect("staff-2", "2024-03-02");
      });

      expect(result.current.selectionCount).toBe(0);
    });

    it("updateDragSelect expands selection during drag", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.startDragSelect("staff-1", "2024-03-01");
      });

      act(() => {
        result.current.updateDragSelect("staff-2", "2024-03-02");
      });

      expect(result.current.selectionCount).toBe(4);
    });

    it("endDragSelect stops dragging", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.startDragSelect("staff-1", "2024-03-01");
        result.current.endDragSelect();
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("selectAll", () => {
    it("selects all cells", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(staffIds.length * dates.length);
    });
  });

  describe("clearSelection", () => {
    it("clears all selections", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(9);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectionCount).toBe(0);
    });
  });

  describe("getSelectedCells", () => {
    it("returns array of cell positions", () => {
      const { result } = renderHook(() => useMultiSelect({ staffIds, dates }));

      act(() => {
        result.current.selectCell("staff-1", "2024-03-01");
      });

      const cells = result.current.selectedCells;
      expect(cells).toHaveLength(1);
      expect(cells[0]).toEqual({ staffId: "staff-1", date: "2024-03-01" });
    });
  });

  describe("parseCellKey", () => {
    it("handles staffId containing :: separator correctly", () => {
      const specialStaffs = ["staff::with::colons"];
      const { result } = renderHook(() =>
        useMultiSelect({ staffIds: specialStaffs, dates })
      );

      act(() => {
        result.current.selectCell("staff::with::colons", "2024-03-01");
      });

      const cells = result.current.selectedCells;
      expect(cells[0]).toEqual({
        staffId: "staff::with::colons",
        date: "2024-03-01",
      });
    });
  });
});
