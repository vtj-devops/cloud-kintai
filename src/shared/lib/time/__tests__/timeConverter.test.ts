import dayjs from "dayjs";

import {
  extractDateFromISO,
  formatDateToString,
  formatISOToTime,
  formatMinutesToHHmm,
  parseTimeToISO,
} from "../timeConverter";

describe("formatISOToTime", () => {
  it("ISO文字列 → 'HH:mm' に変換する", () => {
    const iso = "2024-01-15T09:30:00+09:00";
    expect(formatISOToTime(iso)).toBe("09:30");
  });
});

describe("parseTimeToISO", () => {
  it("'HH:mm' + 日付 → ISO文字列に変換する", () => {
    const iso = parseTimeToISO("09:30", "2024-01-15");
    // dayjs toISOString returns UTC, so we compare the date and time parts
    const parsed = dayjs(iso);
    expect(parsed.format("YYYY-MM-DD")).toBe("2024-01-15");
    expect(parsed.format("HH:mm")).toBe("09:30");
  });
});

describe("formatDateToString", () => {
  it("Date/Dayjs → 'YYYY-MM-DD' に変換する", () => {
    const date = new Date("2024-01-15T00:00:00Z");
    expect(formatDateToString(date)).toBe("2024-01-15");
    const dayjsObj = dayjs("2024-01-15");
    expect(formatDateToString(dayjsObj)).toBe("2024-01-15");
  });
});

describe("extractDateFromISO", () => {
  it("ISO文字列から日付部分を抽出する", () => {
    const iso = "2024-01-15T09:30:00+09:00";
    expect(extractDateFromISO(iso)).toBe("2024-01-15");
  });
});

describe("formatMinutesToHHmm", () => {
  it("0分 → '0:00'", () => {
    expect(formatMinutesToHHmm(0)).toBe("0:00");
  });
  it("60分 → '1:00'", () => {
    expect(formatMinutesToHHmm(60)).toBe("1:00");
  });
  it("90分 → '1:30'", () => {
    expect(formatMinutesToHHmm(90)).toBe("1:30");
  });
  it("負の値 → '0:00'", () => {
    expect(formatMinutesToHHmm(-15)).toBe("0:00");
  });
});
