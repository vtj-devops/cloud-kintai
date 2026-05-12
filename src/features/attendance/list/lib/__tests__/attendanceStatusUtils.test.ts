import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import type { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  buildHolidayLabels,
  buildWeeks,
  formatTimeRange,
  getCalendarDaySurfaceState,
  getHolidayNames,
  getNetWorkingHours,
  getStatus,
  getSubstituteHolidayLabel,
  getTotalRestHours,
  isHolidayLike,
} from "../attendanceStatusUtils";

describe("attendanceStatusUtils.getStatus", () => {
  const buildStaff = (workType: "shift" | "weekday") => ({
    __typename: "Staff" as const,
    id: `staff-${workType}`,
    cognitoUserId: `cognito-${workType}`,
    mailAddress: `${workType}@example.com`,
    role: "staff",
    enabled: true,
    status: "active",
    workType,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });

  const holidayCalendars = [
    {
      __typename: "HolidayCalendar" as const,
      id: "holiday-1",
      holidayDate: "2020-01-01",
      name: "元日",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    },
  ];

  const buildAttendance = (overrides: Partial<Attendance> = {}): Attendance =>
    ({
      __typename: "Attendance",
      id: "attendance-1",
      staffId: "staff-shift",
      workDate: "2020-01-02",
      startTime: "2020-01-02T09:00:00.000Z",
      endTime: "2020-01-02T18:00:00.000Z",
      changeRequests: [],
      systemComments: [],
      createdAt: "2020-01-02T00:00:00.000Z",
      updatedAt: "2020-01-02T00:00:00.000Z",
      ...overrides,
    }) as Attendance;

  it("treats shift worker as evaluation target on holidays when attendance is missing", () => {
    const status = getStatus(
      undefined,
      buildStaff("shift"),
      holidayCalendars,
      [],
      dayjs("2020-01-01"),
    );

    expect(status).toBe(AttendanceStatus.Error);
  });

  it("keeps non-shift worker as out of scope on holidays when attendance is missing", () => {
    const status = getStatus(
      undefined,
      buildStaff("weekday"),
      holidayCalendars,
      [],
      dayjs("2020-01-01"),
    );

    expect(status).toBe(AttendanceStatus.None);
  });

  it("returns error when attendance has system comments", () => {
    const status = getStatus(
      buildAttendance({
        systemComments: [
          {
            __typename: "SystemComment",
            comment: "自動補正が未完了です",
            confirmed: false,
            createdAt: "2020-01-02T00:00:00.000Z",
          },
        ],
      }),
      buildStaff("weekday"),
      [],
      [],
      dayjs("2020-01-02"),
    );

    expect(status).toBe(AttendanceStatus.Error);
  });
});

describe("buildWeeks", () => {
  it("returns arrays of 7-day weeks covering the full month", () => {
    const weeks = buildWeeks(dayjs("2024-01-01"));
    weeks.forEach((week) => expect(week).toHaveLength(7));
    const allDays = weeks.flat();
    expect(allDays.some((d) => d.format("YYYY-MM-DD") === "2024-01-01")).toBe(
      true,
    );
    expect(allDays.some((d) => d.format("YYYY-MM-DD") === "2024-01-31")).toBe(
      true,
    );
  });
});

describe("getTotalRestHours", () => {
  const makeAttendance = (overrides: Partial<Attendance>): Attendance => ({
    __typename: "Attendance",
    id: "a1",
    staffId: "s1",
    workDate: "2024-01-01",
    startTime: "2024-01-01T09:00:00Z",
    endTime: "2024-01-01T18:00:00Z",
    rests: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  });

  it("returns 0 when attendance is undefined", () => {
    expect(getTotalRestHours(undefined)).toBe(0);
  });

  it("returns 0 when rests is null", () => {
    expect(getTotalRestHours(makeAttendance({ rests: null }))).toBe(0);
  });

  it("returns 0 when endTime is missing", () => {
    expect(
      getTotalRestHours(
        makeAttendance({
          endTime: null,
          rests: [
            {
              __typename: "Rest",
              startTime: "2024-01-01T12:00:00Z",
              endTime: "2024-01-01T13:00:00Z",
            },
          ],
        }),
      ),
    ).toBe(0);
  });

  it("returns correct total rest hours", () => {
    const attendance = makeAttendance({
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-01-01T12:00:00Z",
          endTime: "2024-01-01T13:00:00Z",
        },
      ],
    });
    expect(getTotalRestHours(attendance)).toBeCloseTo(1);
  });
});

describe("getNetWorkingHours", () => {
  const makeAttendance = (overrides: Partial<Attendance>): Attendance => ({
    __typename: "Attendance",
    id: "a1",
    staffId: "s1",
    workDate: "2024-01-01",
    startTime: null,
    endTime: null,
    rests: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  });

  it("returns 0 when attendance is undefined", () => {
    expect(getNetWorkingHours(undefined)).toBe(0);
  });

  it("returns 0 when startTime is missing", () => {
    expect(
      getNetWorkingHours(makeAttendance({ endTime: "2024-01-01T18:00:00Z" })),
    ).toBe(0);
  });

  it("returns correct net hours without rest", () => {
    const attendance = makeAttendance({
      startTime: "2024-01-01T09:00:00Z",
      endTime: "2024-01-01T17:00:00Z",
    });
    expect(getNetWorkingHours(attendance)).toBeCloseTo(8);
  });

  it("subtracts rest time from work time", () => {
    const attendance = makeAttendance({
      startTime: "2024-01-01T09:00:00Z",
      endTime: "2024-01-01T18:00:00Z",
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-01-01T12:00:00Z",
          endTime: "2024-01-01T13:00:00Z",
        },
      ],
    });
    expect(getNetWorkingHours(attendance)).toBeCloseTo(8);
  });
});

describe("formatTimeRange", () => {
  const makeAttendance = (overrides: Partial<Attendance>): Attendance => ({
    __typename: "Attendance",
    id: "a1",
    staffId: "s1",
    workDate: "2024-01-01",
    startTime: null,
    endTime: null,
    rests: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  });

  it("returns undefined when attendance is undefined", () => {
    expect(formatTimeRange(undefined)).toBeUndefined();
  });

  it("returns undefined when both startTime and endTime are null", () => {
    expect(formatTimeRange(makeAttendance({}))).toBeUndefined();
  });

  it("formats time range as HH:mm - HH:mm", () => {
    const attendance = makeAttendance({
      startTime: "2024-01-01T00:00:00Z",
      endTime: "2024-01-01T09:00:00Z",
    });
    const result = formatTimeRange(attendance);
    expect(result).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
  });
});

describe("getHolidayNames", () => {
  const holidayCalendars = [
    {
      __typename: "HolidayCalendar" as const,
      id: "h1",
      holidayDate: "2024-01-01",
      name: "元日",
      createdAt: "",
      updatedAt: "",
    },
  ];

  it("returns holiday name for a holiday date", () => {
    const result = getHolidayNames(dayjs("2024-01-01"), holidayCalendars, []);
    expect(result.holidayName).toBe("元日");
  });

  it("returns undefined names for non-holiday date", () => {
    const result = getHolidayNames(dayjs("2024-01-02"), holidayCalendars, []);
    expect(result.holidayName).toBeUndefined();
    expect(result.companyHolidayName).toBeUndefined();
  });
});

describe("isHolidayLike", () => {
  const holidayCalendars = [
    {
      __typename: "HolidayCalendar" as const,
      id: "h1",
      holidayDate: "2024-01-01",
      name: "元日",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const makeStaff = (workType: "shift" | "weekday") => ({
    __typename: "Staff" as const,
    id: "s1",
    cognitoUserId: "c1",
    mailAddress: "a@b.com",
    role: "staff",
    enabled: true,
    status: "active",
    workType,
    createdAt: "",
    updatedAt: "",
  });

  it("returns true for weekday worker on Sunday", () => {
    const sunday = dayjs("2024-01-07"); // Sunday
    expect(isHolidayLike(sunday, makeStaff("weekday"), [], [])).toBe(true);
  });

  it("returns false for shift worker on Sunday (no company holiday)", () => {
    const sunday = dayjs("2024-01-07");
    expect(isHolidayLike(sunday, makeStaff("shift"), [], [])).toBe(false);
  });

  it("returns true for both worker types on a national holiday", () => {
    const holiday = dayjs("2024-01-01");
    expect(
      isHolidayLike(holiday, makeStaff("shift"), holidayCalendars, []),
    ).toBe(true);
    expect(
      isHolidayLike(holiday, makeStaff("weekday"), holidayCalendars, []),
    ).toBe(true);
  });
});

describe("getCalendarDaySurfaceState", () => {
  const weekdayStaff = {
    __typename: "Staff" as const,
    id: "s1",
    cognitoUserId: "c1",
    mailAddress: "a@b.com",
    role: "staff",
    enabled: true,
    status: "active",
    workType: "weekday" as const,
    createdAt: "",
    updatedAt: "",
  };

  it("当日を isToday=true で返す", () => {
    const date = dayjs("2024-01-10");
    const result = getCalendarDaySurfaceState({
      date,
      staff: weekdayStaff,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      today: dayjs("2024-01-10"),
    });

    expect(result.isToday).toBe(true);
  });

  it("平日勤務者の土日を holidayLike=true で返す", () => {
    const sunday = dayjs("2024-01-07");
    const result = getCalendarDaySurfaceState({
      date: sunday,
      staff: weekdayStaff,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      today: dayjs("2024-01-01"),
    });

    expect(result.isWeekend).toBe(true);
    expect(result.holidayLike).toBe(true);
  });
});

describe("getSubstituteHolidayLabel", () => {
  it("substituteHolidayDate がある場合は振替休日を返す", () => {
    const attendance = {
      substituteHolidayDate: "2024-01-08",
    } as Attendance;

    expect(getSubstituteHolidayLabel(attendance)).toBe("振替休日");
  });

  it("substituteHolidayDate がない場合は undefined を返す", () => {
    const attendance = {} as Attendance;

    expect(getSubstituteHolidayLabel(attendance)).toBeUndefined();
    expect(getSubstituteHolidayLabel(undefined)).toBeUndefined();
  });
});

describe("buildHolidayLabels", () => {
  it("祝日・会社休日・振替休日をまとめて返す", () => {
    const labels = buildHolidayLabels({
      holidayName: "元日",
      companyHolidayName: "創立記念日",
      attendance: { substituteHolidayDate: "2024-01-08" } as Attendance,
    });

    expect(labels).toEqual(["元日", "会社休日 創立記念日", "振替休日"]);
  });

  it("モバイル向けに会社休日プレフィックスを付けずに返す", () => {
    const labels = buildHolidayLabels({
      holidayName: undefined,
      companyHolidayName: "夏季休業",
      attendance: undefined,
      includeCompanyHolidayPrefix: false,
    });

    expect(labels).toEqual(["夏季休業"]);
  });

  it("値がない場合は空配列を返す", () => {
    const labels = buildHolidayLabels({
      holidayName: undefined,
      companyHolidayName: undefined,
      attendance: undefined,
    });

    expect(labels).toEqual([]);
  });
});
