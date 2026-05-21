import dayjs from "dayjs";

import {
  getAttendanceMonthRangeInput,
  getAttendancePreviousMonthToCurrentMonthRangeInput,
} from "../attendanceQueryRange";

describe("attendanceQueryRange", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getAttendanceMonthRangeInput", () => {
    it("baseDate 未指定時は当月範囲を返す", () => {
      jest.setSystemTime(new Date("2024-01-20T09:00:00"));

      expect(getAttendanceMonthRangeInput()).toEqual({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });
    });

    it("指定した日付の月範囲を返す", () => {
      expect(getAttendanceMonthRangeInput("2024-02-10")).toEqual({
        startDate: "2024-02-01",
        endDate: "2024-02-29",
      });
    });
  });

  describe("getAttendancePreviousMonthToCurrentMonthRangeInput", () => {
    it("指定月に対して前月初日〜当月末日を返す", () => {
      const march = dayjs("2024-03-01");

      expect(
        getAttendancePreviousMonthToCurrentMonthRangeInput(march),
      ).toEqual({
        startDate: "2024-02-01",
        endDate: "2024-03-31",
      });
    });

    it("baseMonth 未指定時は今月基準で範囲を返す", () => {
      jest.setSystemTime(new Date("2024-01-20T09:00:00"));

      expect(getAttendancePreviousMonthToCurrentMonthRangeInput()).toEqual({
        startDate: "2023-12-01",
        endDate: "2024-01-31",
      });
    });
  });
});
