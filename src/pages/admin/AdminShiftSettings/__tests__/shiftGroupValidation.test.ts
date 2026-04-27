import {
  getGroupValidation,
  getHelperTexts,
  getNumberFieldState,
  parseOptionalInteger,
  type ShiftGroupFormValue,
} from "../shiftGroupValidation";

const makeGroup = (overrides: Partial<ShiftGroupFormValue> = {}): ShiftGroupFormValue => ({
  id: "sg-1",
  label: "グループA",
  description: "",
  min: "",
  max: "",
  fixed: "",
  ...overrides,
});

describe("parseOptionalInteger", () => {
  it("空文字は null を返す", () => {
    expect(parseOptionalInteger("")).toBeNull();
    expect(parseOptionalInteger("  ")).toBeNull();
  });

  it("整数文字列を数値に変換する", () => {
    expect(parseOptionalInteger("5")).toBe(5);
    expect(parseOptionalInteger(" 10 ")).toBe(10);
  });

  it("非数値は null を返す", () => {
    expect(parseOptionalInteger("abc")).toBeNull();
  });
});

describe("getGroupValidation", () => {
  it("正常な入力でエラーがない", () => {
    const result = getGroupValidation(makeGroup({ min: "1", max: "5" }));
    expect(result.hasError).toBe(false);
    expect(result.minValue).toBe(1);
    expect(result.maxValue).toBe(5);
  });

  it("ラベル空白でエラーになる", () => {
    const result = getGroupValidation(makeGroup({ label: "" }));
    expect(result.labelError).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("ラベルがスペースだけでエラーになる", () => {
    const result = getGroupValidation(makeGroup({ label: "  " }));
    expect(result.labelError).toBe(true);
  });

  it("min が max を超えるとエラー", () => {
    const result = getGroupValidation(makeGroup({ min: "10", max: "5" }));
    expect(result.rangeError).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("fixed が min より小さいとエラー", () => {
    const result = getGroupValidation(makeGroup({ min: "5", fixed: "3" }));
    expect(result.fixedBelowMin).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("fixed が max より大きいとエラー", () => {
    const result = getGroupValidation(makeGroup({ max: "5", fixed: "10" }));
    expect(result.fixedAboveMax).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("fixed と min/max の同時指定は競合エラー", () => {
    const result = getGroupValidation(makeGroup({ min: "3", fixed: "3" }));
    expect(result.fixedWithRangeConflict).toBe(true);
    expect(result.hasError).toBe(true);
  });

  it("無効な min 文字列はエラー", () => {
    const result = getGroupValidation(makeGroup({ min: "abc" }));
    expect(result.minInputError).toBe(true);
    expect(result.minValue).toBeNull();
  });

  it("無効な fixed 文字列はエラー", () => {
    const result = getGroupValidation(makeGroup({ fixed: "xyz" }));
    expect(result.fixedInputError).toBe(true);
  });

  it("全て空文字でエラーなし（任意項目）", () => {
    const result = getGroupValidation(makeGroup());
    expect(result.hasError).toBe(false);
  });
});

describe("getNumberFieldState", () => {
  it("min の入力エラー時にエラー状態を返す", () => {
    const validation = getGroupValidation(makeGroup({ min: "abc" }));
    const state = getNumberFieldState(validation, "min");
    expect(state.error).toBe(true);
  });

  it("max の範囲エラー時にエラー状態を返す", () => {
    const validation = getGroupValidation(makeGroup({ min: "10", max: "5" }));
    const state = getNumberFieldState(validation, "max");
    expect(state.error).toBe(true);
  });

  it("fixed の fixedBelowMin エラー時にエラー状態を返す", () => {
    const validation = getGroupValidation(makeGroup({ min: "5", fixed: "2" }));
    const state = getNumberFieldState(validation, "fixed");
    expect(state.error).toBe(true);
  });

  it("エラーなしのとき error は false", () => {
    const validation = getGroupValidation(makeGroup());
    expect(getNumberFieldState(validation, "min").error).toBe(false);
    expect(getNumberFieldState(validation, "max").error).toBe(false);
    expect(getNumberFieldState(validation, "fixed").error).toBe(false);
  });
});

describe("getHelperTexts", () => {
  it("エラーなしのときヘルパーテキストが返る", () => {
    const validation = getGroupValidation(makeGroup());
    const texts = getHelperTexts(validation);
    expect(typeof texts.minHelperText).toBe("string");
    expect(typeof texts.maxHelperText).toBe("string");
    expect(typeof texts.fixedHelperText).toBe("string");
  });

  it("入力エラーのとき非空のヘルパーテキストを返す", () => {
    const validation = getGroupValidation(makeGroup({ min: "abc" }));
    const texts = getHelperTexts(validation);
    expect(texts.minHelperText.length).toBeGreaterThan(0);
  });
});
