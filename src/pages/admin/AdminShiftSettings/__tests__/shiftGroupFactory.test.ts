import {
  buildShiftGroupPayload,
  createShiftGroup,
  createShiftGroupId,
  toShiftGroupFormValue,
  toShiftGroupPayload,
} from "../shiftGroupFactory";

describe("createShiftGroupId", () => {
  it("sg- で始まる文字列を生成する", () => {
    const id = createShiftGroupId();
    expect(id).toMatch(/^sg-/);
  });

  it("カスタム now と random を使用できる", () => {
    const id = createShiftGroupId(() => 12345, () => 0.5);
    expect(id).toBe("sg-12345-8");
  });
});

describe("createShiftGroup", () => {
  it("デフォルト値を持つグループを作成する", () => {
    const group = createShiftGroup();
    expect(group.label).toBe("");
    expect(group.min).toBe("");
    expect(group.max).toBe("");
    expect(group.fixed).toBe("");
    expect(group.id).toMatch(/^sg-/);
  });

  it("初期値を上書きできる", () => {
    const group = createShiftGroup({ label: "テスト", min: "3" });
    expect(group.label).toBe("テスト");
    expect(group.min).toBe("3");
  });
});

describe("toShiftGroupFormValue", () => {
  it("ShiftGroupConfig を FormValue に変換する", () => {
    const config = {
      id: "g-1",
      label: "グループ1",
      description: "説明",
      min: 1,
      max: 5,
      fixed: null,
    };
    const result = toShiftGroupFormValue(config as never);
    expect(result.label).toBe("グループ1");
    expect(result.min).toBe("1");
    expect(result.max).toBe("5");
    expect(result.fixed).toBe("");
  });

  it("null の数値フィールドは空文字になる", () => {
    const config = { id: "g-1", label: "G", description: "", min: null, max: null, fixed: null };
    const result = toShiftGroupFormValue(config as never);
    expect(result.min).toBe("");
    expect(result.max).toBe("");
    expect(result.fixed).toBe("");
  });
});

describe("toShiftGroupPayload", () => {
  it("FormValue をペイロードに変換する", () => {
    const group = { id: "sg-1", label: "  G  ", description: "  desc  ", min: "2", max: "8", fixed: "" };
    const result = toShiftGroupPayload(group as never);
    expect(result.label).toBe("G");
    expect(result.description).toBe("desc");
    expect(result.min).toBe(2);
    expect(result.max).toBe(8);
    expect(result.fixed).toBeNull();
  });

  it("description が空のとき null を返す", () => {
    const group = { id: "sg-1", label: "G", description: "", min: "", max: "", fixed: "" };
    const result = toShiftGroupPayload(group as never);
    expect(result.description).toBeNull();
  });
});

describe("buildShiftGroupPayload", () => {
  it("複数グループを一括変換する", () => {
    const groups = [
      { id: "sg-1", label: "A", description: "", min: "1", max: "3", fixed: "" },
      { id: "sg-2", label: "B", description: "テスト", min: "", max: "", fixed: "5" },
    ];
    const result = buildShiftGroupPayload(groups as never);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("A");
    expect(result[1].description).toBe("テスト");
    expect(result[1].fixed).toBe(5);
  });
});
