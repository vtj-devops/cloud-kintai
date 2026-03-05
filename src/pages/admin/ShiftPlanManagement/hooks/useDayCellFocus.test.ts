import { act, renderHook } from "@testing-library/react";

import { useDayCellFocus } from "./useDayCellFocus";

describe("useDayCellFocus", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("focusCell 呼び出しで対象セルをクリックしてフォーカスする", () => {
    const { result } = renderHook(() => useDayCellFocus());
    const element = document.createElement("button");
    const click = jest.spyOn(element, "click");
    const focus = jest.spyOn(element, "focus");

    act(() => {
      result.current.registerCellRef("cell-1", element);
      result.current.focusCell("cell-1");
      jest.runAllTimers();
    });

    expect(click).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("アンマウント時に保留中タイマーを破棄する", () => {
    const { result, unmount } = renderHook(() => useDayCellFocus());
    const element = document.createElement("button");
    const click = jest.spyOn(element, "click");
    const focus = jest.spyOn(element, "focus");

    act(() => {
      result.current.registerCellRef("cell-1", element);
      result.current.focusCell("cell-1");
      unmount();
      jest.runAllTimers();
    });

    expect(click).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });
});
