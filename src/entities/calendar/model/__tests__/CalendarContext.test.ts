import { AppContext,CalendarContext } from "../CalendarContext";

describe("CalendarContext", () => {
  describe("デフォルト値", () => {
    it("holidayCalendars のデフォルトは空配列", () => {
      expect(CalendarContext._currentValue.holidayCalendars).toEqual([]);
    });

    it("companyHolidayCalendars のデフォルトは空配列", () => {
      expect(CalendarContext._currentValue.companyHolidayCalendars).toEqual([]);
    });

    it("eventCalendars のデフォルトは空配列", () => {
      expect(CalendarContext._currentValue.eventCalendars).toEqual([]);
    });
  });

  describe("デフォルト関数の動作", () => {
    it("createHolidayCalendar はデフォルトで void を返す", async () => {
      const result = await CalendarContext._currentValue.createHolidayCalendar({
        id: "test",
        holidayDate: "2024-01-01",
        calendarName: "元日",
        calendarType: "NATIONAL",
      });
      expect(result).toBeUndefined();
    });

    it("bulkCreateHolidayCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await CalendarContext._currentValue.bulkCreateHolidayCalendar([]);
      expect(result).toEqual([]);
    });

    it("bulkCreateCompanyHolidayCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await CalendarContext._currentValue.bulkCreateCompanyHolidayCalendar(
          [],
        );
      expect(result).toEqual([]);
    });

    it("bulkCreateEventCalendar はデフォルトで空配列を返す", async () => {
      const result =
        await CalendarContext._currentValue.bulkCreateEventCalendar([]);
      expect(result).toEqual([]);
    });

    it("deleteHolidayCalendar はデフォルトで void を返す", async () => {
      const result = await CalendarContext._currentValue.deleteHolidayCalendar({
        id: "test",
      });
      expect(result).toBeUndefined();
    });

    it("deleteEventCalendar はデフォルトで void を返す", async () => {
      const result = await CalendarContext._currentValue.deleteEventCalendar({
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
