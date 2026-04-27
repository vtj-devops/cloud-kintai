import {
  ELAPSED_ERROR_THRESHOLD_DAYS,
  FLAG_VALUES,
  INITIAL_STEP_ORDER,
  MAX_REST_MISMATCH_COUNT,
  MIN_ELEMENTS_COUNT,
} from "../businessLogic";

describe("businessLogic 定数", () => {
  describe("FLAG_VALUES", () => {
    test("TRUE が 1 であること", () => {
      expect(FLAG_VALUES.TRUE).toBe(1);
    });

    test("FALSE が 0 であること", () => {
      expect(FLAG_VALUES.FALSE).toBe(0);
    });

    test("TRUE は truthy であること", () => {
      expect(Boolean(FLAG_VALUES.TRUE)).toBe(true);
    });

    test("FALSE は falsy であること", () => {
      expect(Boolean(FLAG_VALUES.FALSE)).toBe(false);
    });

    test("TRUE と FALSE は異なる値であること", () => {
      expect(FLAG_VALUES.TRUE).not.toBe(FLAG_VALUES.FALSE);
    });
  });

  test("INITIAL_STEP_ORDER が 0 であること", () => {
    expect(INITIAL_STEP_ORDER).toBe(0);
  });

  test("MIN_ELEMENTS_COUNT が 0 であること", () => {
    expect(MIN_ELEMENTS_COUNT).toBe(0);
  });

  test("MIN_ELEMENTS_COUNT: 空配列の length との比較で空判定に使えること", () => {
    const emptyArray: unknown[] = [];
    expect(emptyArray.length > MIN_ELEMENTS_COUNT).toBe(false);

    const nonEmptyArray = [1];
    expect(nonEmptyArray.length > MIN_ELEMENTS_COUNT).toBe(true);
  });

  test("ELAPSED_ERROR_THRESHOLD_DAYS が 7 であること", () => {
    expect(ELAPSED_ERROR_THRESHOLD_DAYS).toBe(7);
  });

  test("ELAPSED_ERROR_THRESHOLD_DAYS は 1 週間分の日数であること", () => {
    const ONE_WEEK_DAYS = 7;
    expect(ELAPSED_ERROR_THRESHOLD_DAYS).toBe(ONE_WEEK_DAYS);
  });

  test("MAX_REST_MISMATCH_COUNT が 2 であること", () => {
    expect(MAX_REST_MISMATCH_COUNT).toBe(2);
  });
});
