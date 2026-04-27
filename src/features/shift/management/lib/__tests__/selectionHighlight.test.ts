import {
  getCellHighlightSx,
  getShiftKeyState,
} from "../selectionHighlight";

describe("getCellHighlightSx", () => {
  it("行も列も選択されていない場合、null を返す", () => {
    expect(getCellHighlightSx(false, false)).toBeNull();
  });

  it("行のみ選択の場合、スタイルオブジェクトを返す", () => {
    const sx = getCellHighlightSx(true, false);
    expect(sx).not.toBeNull();
    expect(sx).toHaveProperty("backgroundColor");
    expect(sx).toHaveProperty("boxShadow");
    expect(sx).toHaveProperty("borderRadius");
    expect(sx).toHaveProperty("transition");
  });

  it("列のみ選択の場合、スタイルオブジェクトを返す", () => {
    const sx = getCellHighlightSx(false, true);
    expect(sx).not.toBeNull();
    expect(sx).toHaveProperty("backgroundColor");
    expect(sx).toHaveProperty("boxShadow");
  });

  it("行と列の両方が選択の場合、スタイルオブジェクトを返す", () => {
    const sx = getCellHighlightSx(true, true);
    expect(sx).not.toBeNull();
    expect(sx).toHaveProperty("backgroundColor");
    expect(sx).toHaveProperty("boxShadow");
  });

  it("行のみ選択時と行・列両方選択時は、boxShadow が異なる（ドロップシャドウ追加）", () => {
    const rowOnly = getCellHighlightSx(true, false);
    const both = getCellHighlightSx(true, true);
    expect(rowOnly?.boxShadow).not.toBe(both?.boxShadow);
  });

  it("行のみ選択時と両方選択時は、backgroundColor が異なる（背景透明度が異なる）", () => {
    const rowOnly = getCellHighlightSx(true, false);
    const both = getCellHighlightSx(true, true);
    expect(rowOnly?.backgroundColor).not.toBe(both?.backgroundColor);
  });
});

describe("getShiftKeyState", () => {
  it("shiftKey が true の MouseEvent の場合、true を返す", () => {
    const event = new MouseEvent("click", { shiftKey: true });
    expect(getShiftKeyState(event)).toBe(true);
  });

  it("shiftKey が false の MouseEvent の場合、false を返す", () => {
    const event = new MouseEvent("click", { shiftKey: false });
    expect(getShiftKeyState(event)).toBe(false);
  });

  it("shiftKey プロパティがない Event の場合、false を返す", () => {
    const event = new Event("custom");
    expect(getShiftKeyState(event)).toBe(false);
  });
});
