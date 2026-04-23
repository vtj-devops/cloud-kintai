import dayjs from "dayjs";

import {
  calcTotalRestTime,
  calcTotalWorkTime,
  getNowISOStringWithZeroSeconds,
} from "../time";

describe("getNowISOStringWithZeroSeconds", () => {
  test("ISO 8601 形式の文字列を返すこと", () => {
    const iso = getNowISOStringWithZeroSeconds();
    expect(typeof iso).toBe("string");
    expect(() => dayjs(iso)).not.toThrow();
  });

  test("秒とミリ秒が 0 であること", () => {
    const iso = getNowISOStringWithZeroSeconds();
    const parsed = dayjs(iso);
    expect(parsed.second()).toBe(0);
    expect(parsed.millisecond()).toBe(0);
  });
});

describe("calcTotalRestTime", () => {
  test("startTime が null の場合、0 を返すこと", () => {
    expect(calcTotalRestTime(null, "2024-06-15T10:00:00.000Z")).toBe(0);
  });

  test("startTime が undefined の場合、0 を返すこと", () => {
    expect(calcTotalRestTime(undefined, "2024-06-15T10:00:00.000Z")).toBe(0);
  });

  test("startTime と endTime が指定された場合、差分時間（時）を返すこと", () => {
    const start = "2024-06-15T09:00:00.000Z";
    const end = "2024-06-15T10:30:00.000Z";
    const result = calcTotalRestTime(start, end);
    expect(result).toBeCloseTo(1.5);
  });

  test("endTime が null の場合、現在時刻との差分を返すこと（正の値）", () => {
    const start = "2020-01-01T00:00:00.000Z"; // 十分に過去の日時
    const result = calcTotalRestTime(start, null);
    expect(result).toBeGreaterThan(0);
  });
});

describe("calcTotalWorkTime", () => {
  test("startTime が null の場合、0 を返すこと", () => {
    expect(calcTotalWorkTime(null, "2024-06-15T18:00:00.000Z")).toBe(0);
  });

  test("startTime が undefined の場合、0 を返すこと", () => {
    expect(calcTotalWorkTime(undefined, "2024-06-15T18:00:00.000Z")).toBe(0);
  });

  test("startTime と endTime が指定された場合、差分時間（時）を返すこと", () => {
    const start = "2024-06-15T09:00:00.000Z";
    const end = "2024-06-15T18:00:00.000Z";
    const result = calcTotalWorkTime(start, end);
    expect(result).toBeCloseTo(9);
  });

  test("endTime が null の場合、現在時刻との差分を返すこと（正の値）", () => {
    const start = "2020-01-01T00:00:00.000Z"; // 十分に過去の日時
    const result = calcTotalWorkTime(start, null);
    expect(result).toBeGreaterThan(0);
  });
});
