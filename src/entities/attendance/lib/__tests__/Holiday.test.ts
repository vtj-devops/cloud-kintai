import { HolidayCalendar } from "@shared/api/graphql/types";

import { Holiday, normalizeHolidayName } from "../Holiday";

describe("Holiday", () => {
  const mockHolidayCalendars: HolidayCalendar[] = [
    {
      __typename: "HolidayCalendar",
      id: "holiday-1",
      holidayDate: "2024-01-01",
      name: "元日",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      __typename: "HolidayCalendar",
      id: "holiday-2",
      holidayDate: "2024-01-08",
      name: "成人の日",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      __typename: "HolidayCalendar",
      id: "holiday-3",
      holidayDate: "2024-12-31",
      name: "大晦日",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  describe("isHoliday", () => {
    it("祝日カレンダーにある日付を祝日と判定できる", () => {
      const holiday = new Holiday(mockHolidayCalendars, "2024-01-01");
      expect(holiday.isHoliday()).toBe(true);
    });

    it("祝日カレンダーにない日付を祝日でないと判定できる", () => {
      const holiday = new Holiday(mockHolidayCalendars, "2024-01-02");
      expect(holiday.isHoliday()).toBe(false);
    });

    it("複数の祝日のうち該当する日付を正しく判定できる", () => {
      const holiday1 = new Holiday(mockHolidayCalendars, "2024-01-08");
      expect(holiday1.isHoliday()).toBe(true);

      const holiday2 = new Holiday(mockHolidayCalendars, "2024-12-31");
      expect(holiday2.isHoliday()).toBe(true);
    });

    it("空の祝日カレンダーの場合、すべての日付を祝日でないと判定できる", () => {
      const holiday = new Holiday([], "2024-01-01");
      expect(holiday.isHoliday()).toBe(false);
    });
  });

  describe("getHoliday", () => {
    it("祝日カレンダーにある日付の祝日情報を取得できる", () => {
      const holiday = new Holiday(mockHolidayCalendars, "2024-01-01");
      const holidayInfo = holiday.getHoliday();

      expect(holidayInfo).toBeDefined();
      expect(holidayInfo?.name).toBe("元日");
      expect(holidayInfo?.id).toBe("holiday-1");
    });

    it("祝日カレンダーにない日付の場合、undefinedを返す", () => {
      const holiday = new Holiday(mockHolidayCalendars, "2024-01-02");
      const holidayInfo = holiday.getHoliday();

      expect(holidayInfo).toBeUndefined();
    });

    it("複数の祝日のうち該当する祝日情報を正しく取得できる", () => {
      const holiday1 = new Holiday(mockHolidayCalendars, "2024-01-08");
      const holidayInfo1 = holiday1.getHoliday();
      expect(holidayInfo1?.name).toBe("成人の日");

      const holiday2 = new Holiday(mockHolidayCalendars, "2024-12-31");
      const holidayInfo2 = holiday2.getHoliday();
      expect(holidayInfo2?.name).toBe("大晦日");
    });
  });

  describe("convertDate", () => {
    it("ISO形式の日付をYYYY-MM-DD形式に変換できる", () => {
      const holiday = new Holiday([], "2024-01-01");
      expect(holiday.convertDate("2024-01-01T00:00:00.000Z")).toBe(
        "2024-01-01",
      );
    });

    it("YYYY-MM-DD形式の日付をそのまま返す", () => {
      const holiday = new Holiday([], "2024-01-01");
      expect(holiday.convertDate("2024-01-15")).toBe("2024-01-15");
    });

    it("タイムゾーン付きのISO形式の日付を正しく変換できる", () => {
      const holiday = new Holiday([], "2024-01-01");
      expect(holiday.convertDate("2024-01-15T09:30:00+09:00")).toBe(
        "2024-01-15",
      );
    });
  });
});

describe("normalizeHolidayName", () => {
  it("「休日」を「振替休日」に変換する", () => {
    expect(normalizeHolidayName("休日")).toBe("振替休日");
  });

  it("「○○振替休日」を「振替休日」に変換する", () => {
    expect(normalizeHolidayName("憲法記念日振替休日")).toBe("振替休日");
    expect(normalizeHolidayName("こどもの日振替休日")).toBe("振替休日");
    expect(normalizeHolidayName("振替休日")).toBe("振替休日");
  });

  it("通常の祝日名はそのまま返す", () => {
    expect(normalizeHolidayName("元日")).toBe("元日");
    expect(normalizeHolidayName("憲法記念日")).toBe("憲法記念日");
    expect(normalizeHolidayName("祝日")).toBe("祝日");
  });
});
