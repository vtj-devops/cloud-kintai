import { AppContext,CalendarContext } from "../CalendarContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (CalendarContext as any)._currentValue;

describe("CalendarContext", () => {
  describe("デフォルト値", () => {
    it("holidayCalendars のデフォルトは空配列", () => {
      expect(ctx.holidayCalendars).toEqual([]);
    });

    it("companyHolidayCalendars のデフォルトは空配列", () => {
      expect(ctx.companyHolidayCalendars).toEqual([]);
    });

    it("eventCalendars のデフォルトは空配列", () => {
      expect(ctx.eventCalendars).toEqual([]);
    });
  });

  describe("デフォルト関数の動作", () => {
    it("createHolidayCalendar はデフォルトで void を返す", async () => {
      const result = await ctx.createHolidayCalendar({
        id: "test",
        holidayDate: "2024-01-01",
        calendarName: "元日",
        calendarType: "NATIONAL",
      });
      expect(result).toBeUndefined();
    });

    it("bulkCreateHolidayCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await ctx.bulkCreateHolidayCalendar([]);
      expect(result).toEqual([]);
    });

    it("bulkCreateCompanyHolidayCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await ctx.bulkCreateCompanyHolidayCalendar(
          [],
        );
      expect(result).toEqual([]);
    });

    it("bulkCreateEventCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await ctx.bulkCreateEventCalendar([]);
      expect(result).toEqual([]);
    });

    it("deleteHolidayCalendar はデフォルトで void を返す", async () => {
      const result = await ctx.deleteHolidayCalendar({
        id: "test",
      });
      expect(result).toBeUndefined();
    });

    it("deleteEventCalendar はデフォルトで void を返す", async () => {
      const result = await ctx.deleteEventCalendar({
        id: "test",
      });
      expect(result).toBeUndefined();
    });
  });

  describe("AppContext (deprecated re-export)", () => {
    it("AppContext は CalendarContext と同一オブジェクトである", () => {
      expect(AppContext).toBe(CalendarContext);
    });
  });
});
