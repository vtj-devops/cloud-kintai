import { act, renderHook } from "@testing-library/react";

import useShiftSelection from "../useShiftSelection";

// ---- モック定義 ----

const mockGetShiftKeyState = jest.fn<boolean, [Event]>(() => false);

jest.mock("../../lib/selectionHighlight", () => ({
  getShiftKeyState: (...args: unknown[]) => mockGetShiftKeyState(...args as [Event]),
  getCellHighlightSx: jest.fn(),
}));

// ---- ヘルパー ----

/** テスト用の HTMLInputElement change イベントを生成する */
const makeChangeEvent = (checked: boolean) =>
  ({
    target: { checked },
    stopPropagation: jest.fn(),
    nativeEvent: new Event("change"),
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

// ---- テスト ----

describe("useShiftSelection", () => {
  // params はコールバック外で定義して不要な再レンダーを防ぐ
  const displayedStaffOrder = [
    { id: "staff-1" },
    { id: "staff-2" },
    { id: "staff-3" },
  ];
  const dayKeyList = ["2024-01-01", "2024-01-02", "2024-01-03"];
  const staffIdToIndex = new Map([
    ["staff-1", 0],
    ["staff-2", 1],
    ["staff-3", 2],
  ]);
  const baseArgs = { displayedStaffOrder, dayKeyList, staffIdToIndex };

  beforeEach(() => {
    mockGetShiftKeyState.mockReturnValue(false);
  });

  it("初期状態は selectedStaffIds と selectedDayKeys が空", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    expect(result.current.selectedStaffIds.size).toBe(0);
    expect(result.current.selectedDayKeys.size).toBe(0);
  });

  it("hasBulkSelection は初期状態で false", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    expect(result.current.hasBulkSelection).toBe(false);
  });

  it("handleStaffCheckboxChange でスタッフが選択される", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
    });
    expect(result.current.selectedStaffIds.has("staff-1")).toBe(true);
  });

  it("handleStaffCheckboxChange でスタッフの選択が解除される", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
    });
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(false), "staff-1");
    });
    expect(result.current.selectedStaffIds.has("staff-1")).toBe(false);
  });

  it("handleDayCheckboxChange で日付が選択される", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleDayCheckboxChange(makeChangeEvent(true), "2024-01-01");
    });
    expect(result.current.selectedDayKeys.has("2024-01-01")).toBe(true);
  });

  it("スタッフと日付が両方選択されると hasBulkSelection が true になる", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
      result.current.handleDayCheckboxChange(makeChangeEvent(true), "2024-01-01");
    });
    expect(result.current.hasBulkSelection).toBe(true);
  });

  it("selectedCellCount はスタッフ数 × 日付数", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-2");
      result.current.handleDayCheckboxChange(makeChangeEvent(true), "2024-01-01");
      result.current.handleDayCheckboxChange(makeChangeEvent(true), "2024-01-02");
      result.current.handleDayCheckboxChange(makeChangeEvent(true), "2024-01-03");
    });
    expect(result.current.selectedCellCount).toBe(6); // 2 staffs × 3 days
  });

  it("staffIdToIndex から削除された staffId は selectedStaffIds から除外される", () => {
    const { result, rerender } = renderHook(
      (args) => useShiftSelection(args),
      { initialProps: baseArgs }
    );
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
    });
    expect(result.current.selectedStaffIds.has("staff-1")).toBe(true);

    // staff-1 を staffIdToIndex から取り除いた状態で再レンダー
    const newStaffIdToIndex = new Map([
      ["staff-2", 0],
      ["staff-3", 1],
    ]);
    act(() => {
      rerender({ ...baseArgs, staffIdToIndex: newStaffIdToIndex });
    });
    expect(result.current.selectedStaffIds.has("staff-1")).toBe(false);
  });

  it("Shift キーなしの場合は単一スタッフのみ選択される（範囲選択にならない）", () => {
    mockGetShiftKeyState.mockReturnValue(false);
    const { result } = renderHook(() => useShiftSelection(baseArgs));
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
    });
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-3");
    });
    expect(result.current.selectedStaffIds.has("staff-1")).toBe(true);
    expect(result.current.selectedStaffIds.has("staff-2")).toBe(false); // 間の staff-2 は非選択
    expect(result.current.selectedStaffIds.has("staff-3")).toBe(true);
  });

  it("Shift キーありの 2 回目クリックで staff-1〜staff-3 が範囲選択される", () => {
    const { result } = renderHook(() => useShiftSelection(baseArgs));

    // 1 回目: Shift なし → staff-1 を選択
    mockGetShiftKeyState.mockReturnValue(false);
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-1");
    });

    // 2 回目: Shift あり → staff-3 まで範囲選択
    mockGetShiftKeyState.mockReturnValue(true);
    act(() => {
      result.current.handleStaffCheckboxChange(makeChangeEvent(true), "staff-3");
    });

    expect(result.current.selectedStaffIds.has("staff-1")).toBe(true);
    expect(result.current.selectedStaffIds.has("staff-2")).toBe(true); // 間の staff-2 も選択
    expect(result.current.selectedStaffIds.has("staff-3")).toBe(true);
  });
});
