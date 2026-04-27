import type { FieldRule, FieldState } from "../fieldState";
import { resolveFieldState } from "../fieldState";

const fallback: FieldState = { error: false, helperText: "" };

describe("resolveFieldState", () => {
  it("マッチするルールがない場合はフォールバックを返す", () => {
    const rules: FieldRule[] = [
      { when: false, helperText: "エラー1" },
      { when: false, helperText: "エラー2" },
    ];
    expect(resolveFieldState(rules, fallback)).toEqual(fallback);
  });

  it("マッチするルールがある場合はそのルールを返す", () => {
    const rules: FieldRule[] = [
      { when: false, helperText: "エラー1" },
      { when: true, helperText: "エラー2" },
    ];
    expect(resolveFieldState(rules, fallback)).toEqual({
      error: true,
      helperText: "エラー2",
    });
  });

  it("error が明示的に false のルールを返す", () => {
    const rules: FieldRule[] = [{ when: true, helperText: "ヒント", error: false }];
    expect(resolveFieldState(rules, fallback)).toEqual({
      error: false,
      helperText: "ヒント",
    });
  });

  it("最初にマッチしたルールを優先する", () => {
    const rules: FieldRule[] = [
      { when: true, helperText: "最初" },
      { when: true, helperText: "二番目" },
    ];
    expect(resolveFieldState(rules, fallback).helperText).toBe("最初");
  });

  it("ルールが空配列のときはフォールバックを返す", () => {
    expect(resolveFieldState([], fallback)).toEqual(fallback);
  });
});
