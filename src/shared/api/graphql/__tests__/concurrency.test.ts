import {
  buildRevisionCondition,
  buildUpdatedAtCondition,
  buildVersionCondition,
  buildVersionOrUpdatedAtCondition,
  getGraphQLErrorMessage,
  getNextVersion,
  isConditionalCheckFailed,
} from "../concurrency";

describe("buildUpdatedAtCondition", () => {
  it("値があると eq 条件を返す", () => {
    expect(buildUpdatedAtCondition("2024-01-01")).toEqual({
      updatedAt: { eq: "2024-01-01" },
    });
  });

  it("null を渡すと undefined を返す", () => {
    expect(buildUpdatedAtCondition(null)).toBeUndefined();
  });

  it("undefined を渡すと undefined を返す", () => {
    expect(buildUpdatedAtCondition(undefined)).toBeUndefined();
  });
});

describe("buildRevisionCondition", () => {
  it("数値を渡すと eq 条件を返す", () => {
    expect(buildRevisionCondition(3)).toEqual({ revision: { eq: 3 } });
  });

  it("0 を渡しても eq 条件を返す", () => {
    expect(buildRevisionCondition(0)).toEqual({ revision: { eq: 0 } });
  });

  it("null を渡すと undefined を返す", () => {
    expect(buildRevisionCondition(null)).toBeUndefined();
  });

  it("undefined を渡すと undefined を返す", () => {
    expect(buildRevisionCondition(undefined)).toBeUndefined();
  });
});

describe("buildVersionCondition", () => {
  it("数値を渡すと eq 条件を返す", () => {
    expect(buildVersionCondition(5)).toEqual({ version: { eq: 5 } });
  });

  it("null を渡すと undefined を返す", () => {
    expect(buildVersionCondition(null)).toBeUndefined();
  });
});

describe("getNextVersion", () => {
  it("数値のとき +1 を返す", () => {
    expect(getNextVersion(3)).toBe(4);
  });

  it("null のとき 1 を返す", () => {
    expect(getNextVersion(null)).toBe(1);
  });

  it("undefined のとき 1 を返す", () => {
    expect(getNextVersion(undefined)).toBe(1);
  });

  it("0 のとき 1 を返す", () => {
    expect(getNextVersion(0)).toBe(1);
  });
});

describe("buildVersionOrUpdatedAtCondition", () => {
  it("version があれば version 条件を返す", () => {
    expect(buildVersionOrUpdatedAtCondition(2, "2024-01-01")).toEqual({
      version: { eq: 2 },
    });
  });

  it("version がなく updatedAt があれば updatedAt 条件を返す", () => {
    expect(buildVersionOrUpdatedAtCondition(null, "2024-01-01")).toEqual({
      updatedAt: { eq: "2024-01-01" },
    });
  });

  it("両方ない場合は undefined を返す", () => {
    expect(buildVersionOrUpdatedAtCondition(null, null)).toBeUndefined();
  });
});

describe("isConditionalCheckFailed", () => {
  it("ConditionalCheckFailed を含む場合 true を返す", () => {
    expect(isConditionalCheckFailed("ConditionalCheckFailed")).toBe(true);
  });

  it("The conditional request failed を含む場合 true を返す", () => {
    expect(isConditionalCheckFailed("The conditional request failed")).toBe(true);
  });

  it("関係ないメッセージは false を返す", () => {
    expect(isConditionalCheckFailed("Some other error")).toBe(false);
  });
});

describe("getGraphQLErrorMessage", () => {
  it("errors が null/undefined のときフォールバックを返す", () => {
    expect(getGraphQLErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("errors が空配列のときフォールバックを返す", () => {
    expect(getGraphQLErrorMessage([], "fallback")).toBe("fallback");
  });

  it("競合エラーのとき競合メッセージを返す", () => {
    const result = getGraphQLErrorMessage(
      [{ message: "ConditionalCheckFailed" }],
      "fallback",
    );
    expect(result).toContain("他の更新が先に反映されました");
  });

  it("一般エラーのときそのメッセージを返す", () => {
    const result = getGraphQLErrorMessage(
      [{ message: "Internal server error" }],
      "fallback",
    );
    expect(result).toBe("Internal server error");
  });

  it("カスタム競合メッセージを使用できる", () => {
    const result = getGraphQLErrorMessage(
      [{ message: "ConditionalCheckFailed" }],
      "fallback",
      "競合発生",
    );
    expect(result).toBe("競合発生");
  });
});
