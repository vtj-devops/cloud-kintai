import type { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  getAssumedLunchRestRange,
  getRestTimes,
  getSelectedDateLabel,
  getSummaryText,
  getSystemCommentTexts,
} from "./mobileCalendarDetailsUtils";

const baseAttendance = {
  startTime: "2026-03-25T09:00:00+09:00",
  endTime: null,
} as Attendance;

describe("getSelectedDateLabel", () => {
  it("日付をラベル形式にフォーマットする", () => {
    const label = getSelectedDateLabel("2024-03-15");
    expect(label).toMatch(/3月15日/);
  });
});

describe("getRestTimes", () => {
  it("休憩時間リストを返す", () => {
    const attendance = {
      ...baseAttendance,
      rests: [{ startTime: "12:00", endTime: "13:00" }, null],
    } as unknown as Attendance;
    const result = getRestTimes(attendance);
    expect(result).toHaveLength(1);
  });

  it("null を渡すと空配列を返す", () => {
    expect(getRestTimes(null)).toEqual([]);
  });

  it("rests が undefined のとき空配列を返す", () => {
    expect(getRestTimes(baseAttendance)).toEqual([]);
  });
});

describe("getSummaryText", () => {
  it("null のとき空文字を返す", () => {
    expect(getSummaryText(null)).toBe("");
  });

  it("有給休暇フラグが立っているとき有給休暇を含む", () => {
    const attendance = { ...baseAttendance, paidHolidayFlag: true } as Attendance;
    expect(getSummaryText(attendance)).toContain("有給休暇");
  });

  it("特別休暇フラグが立っているとき特別休暇を含む", () => {
    const attendance = { ...baseAttendance, specialHolidayFlag: true } as Attendance;
    expect(getSummaryText(attendance)).toContain("特別休暇");
  });

  it("欠勤フラグが立っているとき欠勤を含む", () => {
    const attendance = { ...baseAttendance, absentFlag: true } as Attendance;
    expect(getSummaryText(attendance)).toContain("欠勤");
  });

  it("振替休日日付があるとき振替休日を含む", () => {
    const attendance = {
      ...baseAttendance,
      substituteHolidayDate: "2024-03-15",
    } as Attendance;
    expect(getSummaryText(attendance)).toContain("振替休日");
  });

  it("フラグなしのとき空文字を返す", () => {
    expect(getSummaryText(baseAttendance)).toBe("");
  });
});

describe("getSystemCommentTexts", () => {
  it("システムコメントのテキスト配列を返す", () => {
    const attendance = {
      ...baseAttendance,
      systemComments: [{ comment: "コメント1" }, null, { comment: "コメント2" }],
    } as unknown as Attendance;
    const result = getSystemCommentTexts(attendance);
    expect(result).toEqual(["コメント1", "コメント2"]);
  });

  it("null を渡すと空配列を返す", () => {
    expect(getSystemCommentTexts(null)).toEqual([]);
  });
});

describe("getAssumedLunchRestRange", () => {
  it("当日勤務中で休憩打刻なし、昼休憩終了時刻を過ぎていれば仮休憩を返す", () => {
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-25",
      selectedAttendance: baseAttendance,
      restCount: 0,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T13:01:00+09:00"),
    });

    expect(result).not.toBeNull();
    expect(dayjs(result?.startTime).format("HH:mm")).toBe("12:00");
    expect(dayjs(result?.endTime).format("HH:mm")).toBe("13:00");
  });

  it("昼休憩終了時刻前なら仮休憩を返さない", () => {
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-25",
      selectedAttendance: baseAttendance,
      restCount: 0,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T12:59:00+09:00"),
    });

    expect(result).toBeNull();
  });

  it("明示的な休憩打刻があるなら仮休憩を返さない", () => {
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-25",
      selectedAttendance: baseAttendance,
      restCount: 1,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T13:30:00+09:00"),
    });

    expect(result).toBeNull();
  });

  it("当日以外は仮休憩を返さない", () => {
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-24",
      selectedAttendance: baseAttendance,
      restCount: 0,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T13:30:00+09:00"),
    });

    expect(result).toBeNull();
  });

  it("勤務終了済みなら仮休憩を返さない", () => {
    const attendanceWithEnd = {
      ...baseAttendance,
      endTime: "2026-03-25T18:00:00+09:00",
    } as Attendance;
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-25",
      selectedAttendance: attendanceWithEnd,
      restCount: 0,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T13:30:00+09:00"),
    });
    expect(result).toBeNull();
  });

  it("selectedAttendance が null なら仮休憩を返さない", () => {
    const result = getAssumedLunchRestRange({
      selectedDate: "2026-03-25",
      selectedAttendance: null,
      restCount: 0,
      lunchRestStartTime: dayjs("2026-03-25T12:00:00+09:00"),
      lunchRestEndTime: dayjs("2026-03-25T13:00:00+09:00"),
      now: dayjs("2026-03-25T13:30:00+09:00"),
    });
    expect(result).toBeNull();
  });
});
