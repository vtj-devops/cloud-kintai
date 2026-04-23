import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import dayjs from "dayjs";

import { WorkStatusCodes, WorkStatusTexts } from "../../lib/common";
import {
  formatClockDisplayText,
  hasPendingChangeRequests,
  resolveElapsedWorkInfo,
  summarizeAttendanceErrors,
  toConfiguredTimeISO,
} from "../timeRecorderUtils";

const mockAttendanceStateGet = jest.fn();

jest.mock("@/entities/attendance/lib/AttendanceState", () => ({
  AttendanceStatus: {
    Ok: "OK",
    Error: "Error",
    Requesting: "申請中",
    Late: "遅刻",
    Working: "勤務中",
    None: "",
  },
  AttendanceState: jest.fn().mockImplementation(() => ({
    get: () => mockAttendanceStateGet(),
  })),
}));

describe("summarizeAttendanceErrors", () => {
  beforeEach(() => {
    mockAttendanceStateGet.mockReset();
  });

  it("当日を除外して打刻エラー日数を集計する", () => {
    mockAttendanceStateGet
      .mockReturnValueOnce(AttendanceStatus.Error)
      .mockReturnValueOnce(AttendanceStatus.Error)
      .mockReturnValueOnce(AttendanceStatus.Error);

    const result = summarizeAttendanceErrors({
      staff: { id: "staff-1" } as never,
      attendances: [
        { workDate: "2026-03-25" } as never,
        { workDate: "2026-03-26" } as never,
        { workDate: "2026-03-27" } as never,
      ],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      today: dayjs("2026-03-27T00:00:00+09:00"),
    });

    expect(result).toEqual({
      errorCount: 2,
      hasTimeElapsedError: false,
    });
  });

  it("1週間超の打刻エラーがある場合は経過エラーフラグを立てる", () => {
    mockAttendanceStateGet.mockReturnValue(AttendanceStatus.Error);

    const result = summarizeAttendanceErrors({
      staff: { id: "staff-1" } as never,
      attendances: [{ workDate: "2026-03-10" } as never],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      today: dayjs("2026-03-19T00:00:00+09:00"),
    });

    expect(result).toEqual({
      errorCount: 1,
      hasTimeElapsedError: true,
    });
  });
});

const makeLunchTimes = () => ({
  lunchRestStartTime: dayjs("2024-01-01T12:00:00"),
  lunchRestEndTime: dayjs("2024-01-01T13:00:00"),
});

// ----------------------------------------------------------------
// hasPendingChangeRequests
// ----------------------------------------------------------------
describe("hasPendingChangeRequests", () => {
  it("changeRequests が null/undefined のとき false を返す", () => {
    expect(hasPendingChangeRequests(null)).toBe(false);
    expect(hasPendingChangeRequests(undefined)).toBe(false);
  });

  it("未完了の申請があるとき true を返す", () => {
    const attendance = {
      changeRequests: [{ completed: false }],
    } as never;
    expect(hasPendingChangeRequests(attendance)).toBe(true);
  });

  it("すべて完了済みのとき false を返す", () => {
    const attendance = {
      changeRequests: [{ completed: true }, { completed: true }],
    } as never;
    expect(hasPendingChangeRequests(attendance)).toBe(false);
  });

  it("null の申請エントリは無視される", () => {
    const attendance = {
      changeRequests: [null, { completed: false }],
    } as never;
    expect(hasPendingChangeRequests(attendance)).toBe(true);
  });
});

// ----------------------------------------------------------------
// formatClockDisplayText
// ----------------------------------------------------------------
describe("formatClockDisplayText", () => {
  it("time が null のとき null を返す", () => {
    expect(formatClockDisplayText(null, "出勤")).toBeNull();
    expect(formatClockDisplayText(undefined, "退勤")).toBeNull();
  });

  it("time があるとき HH:mm suffix の形式で返す", () => {
    expect(formatClockDisplayText("2024-01-01T09:00:00.000Z", "出勤")).toMatch(
      /^\d{2}:\d{2} 出勤$/
    );
    expect(formatClockDisplayText("2024-01-01T18:30:00.000Z", "退勤")).toMatch(
      /^\d{2}:\d{2} 退勤$/
    );
  });
});

// ----------------------------------------------------------------
// toConfiguredTimeISO
// ----------------------------------------------------------------
describe("toConfiguredTimeISO", () => {
  it("ベース日時を保ちつつ時・分をコンフィグ値で置き換える", () => {
    const base = "2024-06-15T10:00:00.000Z";
    const configured = dayjs("2024-01-01T09:30:00");
    const result = toConfiguredTimeISO(base, configured);
    const d = dayjs(result);
    expect(d.hour()).toBe(9);
    expect(d.minute()).toBe(30);
    expect(d.second()).toBe(0);
    expect(d.millisecond()).toBe(0);
  });
});

// ----------------------------------------------------------------
// resolveElapsedWorkInfo
// ----------------------------------------------------------------
describe("resolveElapsedWorkInfo", () => {
  it("attendance が null のとき非表示を返す", () => {
    const result = resolveElapsedWorkInfo({
      attendance: null,
      workStatus: { code: WorkStatusCodes.WORKING, text: WorkStatusTexts.WORKING },
      now: dayjs(),
      ...makeLunchTimes(),
    });
    expect(result.visible).toBe(false);
  });

  it("workStatus が null のとき非表示を返す", () => {
    const result = resolveElapsedWorkInfo({
      attendance: { startTime: "2024-01-01T09:00:00.000Z" } as never,
      workStatus: null,
      now: dayjs(),
      ...makeLunchTimes(),
    });
    expect(result.visible).toBe(false);
  });

  it("BEFORE_WORK のとき非表示を返す", () => {
    const result = resolveElapsedWorkInfo({
      attendance: { startTime: "2024-01-01T09:00:00.000Z" } as never,
      workStatus: {
        code: WorkStatusCodes.BEFORE_WORK,
        text: WorkStatusTexts.BEFORE_WORK,
      },
      now: dayjs(),
      ...makeLunchTimes(),
    });
    expect(result.visible).toBe(false);
  });

  it("WORKING のとき visible = true で時間ラベルを返す", () => {
    const startTime = dayjs().subtract(2, "hour").toISOString();
    const now = dayjs();
    const result = resolveElapsedWorkInfo({
      attendance: { startTime, rests: [] } as never,
      workStatus: { code: WorkStatusCodes.WORKING, text: WorkStatusTexts.WORKING },
      now,
      lunchRestStartTime: dayjs().add(2, "hour"),
      lunchRestEndTime: dayjs().add(3, "hour"),
    });
    expect(result.visible).toBe(true);
    expect(result.workDurationLabel).toMatch(/^\d{2}:\d{2}$/);
    expect(result.restDurationLabel).toMatch(/^\d{2}:\d{2}$/);
  });

  it("RESTING のとき active rest 時間を restDurationLabel に反映する", () => {
    const restStart = dayjs().subtract(30, "minute").toISOString();
    const now = dayjs();
    const result = resolveElapsedWorkInfo({
      attendance: {
        startTime: dayjs().subtract(3, "hour").toISOString(),
        rests: [{ startTime: restStart, endTime: null }],
      } as never,
      workStatus: { code: WorkStatusCodes.RESTING, text: WorkStatusTexts.RESTING },
      now,
      lunchRestStartTime: dayjs().add(1, "hour"),
      lunchRestEndTime: dayjs().add(2, "hour"),
    });
    expect(result.visible).toBe(true);
    // 約30分の休憩 (前後1分の誤差を許容)
    const [hh, mm] = result.restDurationLabel.split(":").map(Number);
    expect(hh).toBe(0);
    expect(mm).toBeGreaterThanOrEqual(29);
    expect(mm).toBeLessThanOrEqual(31);
  });
});
