import { act,renderHook } from "@testing-library/react";

import {
  getDateRangeDisplayValue,
  useFilterPopoverState,
  useWorkflowListFiltersState,
} from "../workflowListFiltersShared";

describe("getDateRangeDisplayValue", () => {
  it("from と to 両方ある場合に範囲文字列を返す", () => {
    expect(getDateRangeDisplayValue("2024-01-01", "2024-01-31", "日付を選択")).toBe(
      "2024-01-01 → 2024-01-31",
    );
  });

  it("from だけある場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue("2024-01-01", undefined, "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("to だけある場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue(undefined, "2024-01-31", "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("両方 undefined の場合は emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue(undefined, undefined, "日付を選択")).toBe(
      "日付を選択",
    );
  });

  it("空文字は falsy として emptyLabel を返す", () => {
    expect(getDateRangeDisplayValue("", "", "日付を選択")).toBe("日付を選択");
  });
});

describe("useWorkflowListFiltersState", () => {
  const makeFilters = (overrides = {}) => ({
    name: "",
    category: null,
    status: [],
    applicationFrom: "",
    applicationTo: "",
    createdFrom: "",
    createdTo: "",
    ...overrides,
  });

  it("handleDateChange で指定キーに値をセットする", () => {
    const setFilter = jest.fn();
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters: makeFilters(), setFilter }),
    );
    act(() => {
      result.current.handleDateChange("applicationFrom", "2024-03-01");
    });
    expect(setFilter).toHaveBeenCalledWith("applicationFrom", "2024-03-01");
  });

  it("clearDateRange で from/to を空文字にリセットする", () => {
    const setFilter = jest.fn();
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters: makeFilters(), setFilter }),
    );
    act(() => {
      result.current.clearDateRange({ fromKey: "applicationFrom", toKey: "applicationTo" });
    });
    expect(setFilter).toHaveBeenCalledWith("applicationFrom", "");
    expect(setFilter).toHaveBeenCalledWith("applicationTo", "");
  });

  it("handleStatusToggle: 未選択値を追加する", () => {
    const setFilter = jest.fn();
    const filters = makeFilters({ status: ["SUBMITTED"] });
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters, setFilter }),
    );
    act(() => {
      result.current.handleStatusToggle("APPROVED");
    });
    expect(setFilter).toHaveBeenCalledWith("status", ["SUBMITTED", "APPROVED"]);
  });

  it("handleStatusToggle: 既存値を除外する", () => {
    const setFilter = jest.fn();
    const filters = makeFilters({ status: ["SUBMITTED", "APPROVED"] });
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters, setFilter }),
    );
    act(() => {
      result.current.handleStatusToggle("SUBMITTED");
    });
    expect(setFilter).toHaveBeenCalledWith("status", ["APPROVED"]);
  });

  it("handleStatusToggle: STATUS_ALL_VALUE で全クリア", () => {
    const setFilter = jest.fn();
    const filters = makeFilters({ status: ["SUBMITTED"] });
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters, setFilter }),
    );
    act(() => {
      result.current.handleStatusToggle("__ALL__");
    });
    expect(setFilter).toHaveBeenCalledWith("status", []);
  });

  it("category が null の場合は空文字として扱う", () => {
    const setFilter = jest.fn();
    const { result } = renderHook(() =>
      useWorkflowListFiltersState({ filters: makeFilters({ category: null }), setFilter }),
    );
    expect(result.current.categoryFilter).toBe("");
  });
});

describe("useFilterPopoverState", () => {
  it("初期状態では openKey が null", () => {
    const { result } = renderHook(() => useFilterPopoverState({ current: null }));
    expect(result.current.openKey).toBeNull();
  });

  it("togglePopover でキーを開く", () => {
    const { result } = renderHook(() => useFilterPopoverState({ current: null }));
    act(() => {
      result.current.togglePopover("application");
    });
    expect(result.current.openKey).toBe("application");
  });

  it("同じキーで togglePopover を呼ぶと閉じる", () => {
    const { result } = renderHook(() => useFilterPopoverState({ current: null }));
    act(() => {
      result.current.togglePopover("application");
    });
    act(() => {
      result.current.togglePopover("application");
    });
    expect(result.current.openKey).toBeNull();
  });

  it("closePopovers で null に戻る", () => {
    const { result } = renderHook(() => useFilterPopoverState({ current: null }));
    act(() => {
      result.current.togglePopover("status");
    });
    act(() => {
      result.current.closePopovers();
    });
    expect(result.current.openKey).toBeNull();
  });
});
