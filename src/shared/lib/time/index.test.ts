import { describe, expect, it } from "@jest/globals";
import dayjs from "dayjs";

import {
  buildClockTimeDayjs,
  formatDateTimeReadable,
  formatISOToTime,
  formatMinutesToHHmm,
  isoDateFromTimestamp,
} from ".";

describe("time index (barrel exports)", () => {
  it("exports and runs buildClockTimeDayjs", () => {
    const result = buildClockTimeDayjs("09:30");
    expect(result.isValid()).toBe(true);
    expect(result.format("HH:mm:ss.SSS")).toBe("09:30:00.000");
  });

  it("exports and runs formatDateTimeReadable", () => {
    const iso = "2024-05-06T12:34:56.000Z";
    expect(formatDateTimeReadable(iso)).toBe(dayjs(iso).format("YYYY/MM/DD HH:mm"));
  });

  it("exports and runs formatISOToTime and isoDateFromTimestamp", () => {
    expect(formatISOToTime("2024-01-15T09:30:00+09:00")).toBe("09:30");
    expect(isoDateFromTimestamp("2024-05-06T12:34:56.000Z")).toBe("2024-05-06");
  });

  it("exports and runs formatMinutesToHHmm", () => {
    expect(formatMinutesToHHmm(150)).toBe("2:30");
    expect(formatMinutesToHHmm(5)).toBe("0:05");
    expect(formatMinutesToHHmm(0)).toBe("0:00");
  });
});
