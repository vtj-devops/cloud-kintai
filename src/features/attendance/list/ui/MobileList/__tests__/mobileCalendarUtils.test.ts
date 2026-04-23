import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import dayjs from "dayjs";

import {
  buildAttendanceMap,
  createCalendarDays,
  formatDateKey,
  formatTimeRange,
  getHolidayInfoByDate,
  getStatusBadgeMeta,
} from "../mobileCalendarUtils";

// ----------------------------------------------------------------
// formatDateKey
// ----------------------------------------------------------------
describe("formatDateKey", () => {
  it("Dayjs を YYYY-MM-DD 形式に変換する", () => {
    expect(formatDateKey(dayjs("2024-03-15"))).toBe("2024-03-15");
    expect(formatDateKey(dayjs("2024-12-01"))).toBe("2024-12-01");
  });
});

// ----------------------------------------------------------------
// buildAttendanceMap
// ----------------------------------------------------------------
describe("buildAttendanceMap", () => {
  it("workDate をキーとした Map を返す", () => {
    const attendances = [
      { workDate: "2024-03-01", id: "a1" },
      { workDate: "2024-03-02", id: "a2" },
    ] as never[];
    const map = buildAttendanceMap(attendances);
    expect(map.size).toBe(2);
    expect(map.get("2024-03-01")).toMatchObject({ id: "a1" });
    expect(map.get("2024-03-02")).toMatchObject({ id: "a2" });
  });

  it("空配列のとき空の Map を返す", () => {
    expect(buildAttendanceMap([])).toEqual(new Map());
  });
});

// ----------------------------------------------------------------
// createCalendarDays
// ----------------------------------------------------------------
describe("createCalendarDays", () => {
  it("月の開始日と終了日を含むカレンダー日付列を返す", () => {
    const monthStart = dayjs("2024-03-01");
    const monthEnd = dayjs("2024-03-31");
    const days = createCalendarDays(monthStart, monthEnd);
    // 前後の週を含むので最低でも 28 日以上
    expect(days.length).toBeGreaterThanOrEqual(28);
    // 月の最初と最後の日が含まれる
    expect(days.some((d) => d.date.isSame(monthStart, "day"))).toBe(true);
    expect(days.some((d) => d.date.isSame(monthEnd, "day"))).toBe(true);
  });

  it("当月フラグが正しく設定される", () => {
    const monthStart = dayjs("2024-03-01");
    const monthEnd = dayjs("2024-03-31");
    const days = createCalendarDays(monthStart, monthEnd);
    const marchDays = days.filter((d) => d.isCurrentMonth);
    expect(marchDays).toHaveLength(31); // 3月は31日
  });

  it("先月・翌月の日は isCurrentMonth = false", () => {
    const monthStart = dayjs("2024-03-01");
    const monthEnd = dayjs("2024-03-31");
    const days = createCalendarDays(monthStart, monthEnd);
    days
      .filter((d) => !d.isCurrentMonth)
      .forEach((d) => {
        expect(d.date.month()).not.toBe(monthStart.month());
      });
  });
});

// ----------------------------------------------------------------
// getHolidayInfoByDate
// ----------------------------------------------------------------
describe("getHolidayInfoByDate", () => {
  const holidayCalendars = [
    { holidayDate: "2024-01-01", name: "元日" },
  ] as never[];
  const companyHolidayCalendars = [
    { holidayDate: "2024-08-14", name: "夏季休業" },
  ] as never[];

  it("祝日カレンダーにある日を返す", () => {
    const result = getHolidayInfoByDate(
      dayjs("2024-01-01"),
      holidayCalendars,
      companyHolidayCalendars
    );
    expect(result).toEqual({ name: "元日", type: "holiday" });
  });

  it("会社休日カレンダーにある日を返す", () => {
    const result = getHolidayInfoByDate(
      dayjs("2024-08-14"),
      holidayCalendars,
      companyHolidayCalendars
    );
    expect(result).toEqual({ name: "夏季休業", type: "company" });
  });

  it("カレンダーにない日は null を返す", () => {
    const result = getHolidayInfoByDate(
      dayjs("2024-06-01"),
      holidayCalendars,
      companyHolidayCalendars
    );
    expect(result).toBeNull();
  });

  it("name が空文字の祝日はデフォルト名を使う", () => {
    const result = getHolidayInfoByDate(
      dayjs("2024-01-01"),
      [{ holidayDate: "2024-01-01", name: "" }] as never[],
      []
    );
    expect(result?.name).toBe("祝日");
  });

  it("name が空文字の会社休日はデフォルト名を使う", () => {
    const result = getHolidayInfoByDate(
      dayjs("2024-08-14"),
      [],
      [{ holidayDate: "2024-08-14", name: "" }] as never[]
    );
    expect(result?.name).toBe("会社休日");
  });
});

// ----------------------------------------------------------------
// getStatusBadgeMeta
// ----------------------------------------------------------------
describe("getStatusBadgeMeta", () => {
  it("Error → 'エラー'", () => {
    const meta = getStatusBadgeMeta(AttendanceStatus.Error);
    expect(meta.label).toBe("エラー");
  });

  it("Late → '遅刻'", () => {
    const meta = getStatusBadgeMeta(AttendanceStatus.Late);
    expect(meta.label).toBe("遅刻");
  });

  it("Ok → '正常'", () => {
    const meta = getStatusBadgeMeta(AttendanceStatus.Ok);
    expect(meta.label).toBe("正常");
  });

  it("その他 → '未入力'", () => {
    const meta = getStatusBadgeMeta(AttendanceStatus.None);
    expect(meta.label).toBe("未入力");
  });
});

// ----------------------------------------------------------------
// formatTimeRange
// ----------------------------------------------------------------
describe("formatTimeRange", () => {
  it("両方ある場合 'HH:mm 〜 HH:mm' 形式", () => {
    const result = formatTimeRange(
      "2024-01-01T09:00:00.000Z",
      "2024-01-01T18:00:00.000Z"
    );
    expect(result).toMatch(/\d{2}:\d{2} 〜 \d{2}:\d{2}/);
  });

  it("両方 null のとき emptyLabel を返す", () => {
    expect(formatTimeRange(null, null)).toBe("--:--");
    expect(formatTimeRange(null, null, "未入力")).toBe("未入力");
  });

  it("片方だけある場合も 'HH:mm 〜 --:--' 形式", () => {
    const result = formatTimeRange("2024-01-01T09:00:00.000Z", null);
    expect(result).toMatch(/\d{2}:\d{2} 〜 --:--/);
  });
});
