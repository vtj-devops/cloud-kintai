import { getRemarksValue, toStringArray, updateRemarks } from "../remarksItemUtils";

describe("toStringArray", () => {
  it("文字列配列をそのまま返す", () => {
    expect(toStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("非文字列要素を除外する", () => {
    expect(toStringArray(["a", 1, null, "b", undefined])).toEqual(["a", "b"]);
  });

  it("配列でない値は空配列を返す", () => {
    expect(toStringArray("string")).toEqual([]);
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(toStringArray([])).toEqual([]);
  });
});

describe("getRemarksValue", () => {
  it("remarks の値を返す", () => {
    const getValues = jest.fn().mockReturnValue("備考テキスト");
    expect(getRemarksValue(getValues as never)).toBe("備考テキスト");
    expect(getValues).toHaveBeenCalledWith("remarks");
  });

  it("falsy 値のとき空文字を返す", () => {
    const getValues = jest.fn().mockReturnValue(undefined);
    expect(getRemarksValue(getValues as never)).toBe("");
  });
});

describe("updateRemarks", () => {
  it("readOnly が false のとき setValue を呼ぶ", () => {
    const setValue = jest.fn();
    updateRemarks(setValue as never, false, "新しい備考");
    expect(setValue).toHaveBeenCalledWith("remarks", "新しい備考");
  });

  it("readOnly が true のとき setValue を呼ばない", () => {
    const setValue = jest.fn();
    updateRemarks(setValue as never, true, "新しい備考");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("setValue が undefined のとき何もしない", () => {
    expect(() => updateRemarks(undefined, false, "備考")).not.toThrow();
  });
});
