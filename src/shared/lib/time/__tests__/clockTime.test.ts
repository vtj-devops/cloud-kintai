import { buildClockTimeDayjs } from "../clockTime";

describe("buildClockTimeDayjs", () => {
  it("正常系: '09:30' → hour=9, minute=30 の Dayjs を返す", () => {
    const result = buildClockTimeDayjs("09:30");
    expect(result.format("HH:mm")).toBe("09:30");
  });

  it("境界値: '00:00'", () => {
    const result = buildClockTimeDayjs("00:00");
    expect(result.format("HH:mm")).toBe("00:00");
  });

  it("境界値: '23:59'", () => {
    const result = buildClockTimeDayjs("23:59");
    expect(result.format("HH:mm")).toBe("23:59");
  });

  it("無効入力: null → fallback を返す", () => {
    const result = buildClockTimeDayjs(null);
    expect(result.format("HH:mm")).toBe("00:00");
  });

  it("無効入力: undefined → fallback を返す", () => {
    const result = buildClockTimeDayjs(undefined);
    expect(result.format("HH:mm")).toBe("00:00");
  });

  it("無効入力: '25:00'（hour > 23）→ fallback を返す", () => {
    const result = buildClockTimeDayjs("25:00");
    expect(result.format("HH:mm")).toBe("00:00");
  });

  it("無効入力: '9:60'（minute > 59）→ fallback を返す", () => {
    const result = buildClockTimeDayjs("9:60");
    expect(result.format("HH:mm")).toBe("00:00");
  });

  it("fallback 引数が指定されている場合、無効値でその値を返す", () => {
    const result = buildClockTimeDayjs("25:00", "12:34");
    expect(result.format("HH:mm")).toBe("12:34");
  });
});
