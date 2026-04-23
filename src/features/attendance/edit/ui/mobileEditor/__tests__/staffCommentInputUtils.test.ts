import { createSelectReasonHandler, getEnabledReasons } from "../staffCommentInputUtils";

describe("getEnabledReasons", () => {
  it("enabled な理由だけを返す", () => {
    const reasons = [
      { reason: "理由A", enabled: true },
      { reason: "理由B", enabled: false },
      { reason: "理由C", enabled: true },
    ];
    const result = getEnabledReasons(reasons);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.reason)).toEqual(["理由A", "理由C"]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(getEnabledReasons([])).toEqual([]);
  });

  it("全て無効な場合は空配列を返す", () => {
    const reasons = [{ reason: "A", enabled: false }];
    expect(getEnabledReasons(reasons)).toEqual([]);
  });
});

describe("createSelectReasonHandler", () => {
  it("呼び出すと setValue を staffComment に設定する", () => {
    const setValue = jest.fn();
    const handler = createSelectReasonHandler(setValue as never);
    handler("遅刻のため");
    expect(setValue).toHaveBeenCalledWith("staffComment", "遅刻のため", {
      shouldDirty: true,
    });
  });
});
