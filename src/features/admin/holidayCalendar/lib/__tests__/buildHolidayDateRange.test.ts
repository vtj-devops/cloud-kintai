import dayjs from "dayjs";

import {
  buildHolidayDateRange,
  HolidayDateRangeError,
  MAX_HOLIDAY_RANGE_DAYS,
} from "../buildHolidayDateRange";

describe("buildHolidayDateRange", () => {
  describe("single-day range (no endDate)", () => {
    it("returns one ISO string for a valid single date", () => {
      const result = buildHolidayDateRange("2024-01-01");
      expect(result).toHaveLength(1);
      expect(dayjs(result[0]).format("YYYY-MM-DD")).toBe("2024-01-01");
    });

    it("returns ISO string when endDate is null", () => {
      const result = buildHolidayDateRange("2024-06-15", null);
      expect(result).toHaveLength(1);
      expect(dayjs(result[0]).format("YYYY-MM-DD")).toBe("2024-06-15");
    });
  });

  describe("multi-day range", () => {
    it("returns correct number of days for a range", () => {
      const result = buildHolidayDateRange("2024-01-01", "2024-01-07");
      expect(result).toHaveLength(7);
    });

    it("first and last entries correspond to start and end dates", () => {
      const result = buildHolidayDateRange("2024-03-01", "2024-03-03");
      expect(dayjs(result[0]).format("YYYY-MM-DD")).toBe("2024-03-01");
      expect(dayjs(result[2]).format("YYYY-MM-DD")).toBe("2024-03-03");
    });

    it("returns consecutive dates in order", () => {
      const result = buildHolidayDateRange("2024-01-01", "2024-01-03");
      expect(dayjs(result[0]).format("YYYY-MM-DD")).toBe("2024-01-01");
      expect(dayjs(result[1]).format("YYYY-MM-DD")).toBe("2024-01-02");
      expect(dayjs(result[2]).format("YYYY-MM-DD")).toBe("2024-01-03");
    });
  });

  describe("error cases", () => {
    it("throws INVALID_START_DATE for empty startDate", () => {
      expect(() => buildHolidayDateRange("")).toThrow(HolidayDateRangeError);
      try {
        buildHolidayDateRange("");
      } catch (e) {
        expect((e as HolidayDateRangeError).code).toBe("INVALID_START_DATE");
      }
    });

    it("throws END_BEFORE_START when end is before start", () => {
      expect(() => buildHolidayDateRange("2024-01-10", "2024-01-01")).toThrow(
        HolidayDateRangeError
      );
      try {
        buildHolidayDateRange("2024-01-10", "2024-01-01");
      } catch (e) {
        expect((e as HolidayDateRangeError).code).toBe("END_BEFORE_START");
      }
    });

    it("throws RANGE_TOO_LARGE when range exceeds MAX_HOLIDAY_RANGE_DAYS", () => {
      const start = "2020-01-01";
      const end = "2022-01-01"; // ~730 days
      expect(() => buildHolidayDateRange(start, end)).toThrow(
        HolidayDateRangeError
      );
      try {
        buildHolidayDateRange(start, end);
      } catch (e) {
        expect((e as HolidayDateRangeError).code).toBe("RANGE_TOO_LARGE");
      }
    });

    it("respects custom maxRangeDays option", () => {
      expect(() =>
        buildHolidayDateRange("2024-01-01", "2024-01-10", { maxRangeDays: 5 })
      ).toThrow(HolidayDateRangeError);
    });
  });

  describe("boundary cases", () => {
    it("same-day start and end returns one result", () => {
      const result = buildHolidayDateRange("2024-05-05", "2024-05-05");
      expect(result).toHaveLength(1);
    });

    it("succeeds at exactly MAX_HOLIDAY_RANGE_DAYS days", () => {
      const start = "2024-01-01";
      const end = dayjs(start)
        .add(MAX_HOLIDAY_RANGE_DAYS - 1, "day")
        .format("YYYY-MM-DD");
      const result = buildHolidayDateRange(start, end);
      expect(result).toHaveLength(MAX_HOLIDAY_RANGE_DAYS);
    });

    it("throws RANGE_TOO_LARGE at MAX_HOLIDAY_RANGE_DAYS + 1 days", () => {
      const start = "2024-01-01";
      const end = dayjs(start)
        .add(MAX_HOLIDAY_RANGE_DAYS, "day")
        .format("YYYY-MM-DD");
      expect(() => buildHolidayDateRange(start, end)).toThrow(
        HolidayDateRangeError
      );
    });
  });
});
