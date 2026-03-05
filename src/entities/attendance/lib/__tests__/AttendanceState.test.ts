import { Attendance, Staff } from "@shared/api/graphql/types";
import dayjs, { Dayjs } from "dayjs";

import { AttendanceState, AttendanceStatus } from "../AttendanceState";

describe("AttendanceState", () => {
  const setMockToday = (state: AttendanceState, date: string) => {
    (state as unknown as { today: Dayjs }).today = dayjs(date);
  };

  const baseStaff: Staff = {
    __typename: "Staff",
    id: "staff-1",
    cognitoUserId: "cognito-1",
    mailAddress: "staff@example.com",
    role: "staff",
    enabled: true,
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const baseAttendance: Attendance = {
    __typename: "Attendance",
    id: "attendance-1",
    staffId: baseStaff.id,
    workDate: "2024-01-01",
    startTime: "09:00",
    endTime: "18:00",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const buildState = (
    attendanceOverrides: Partial<Attendance> = {},
    staffOverrides: Partial<
      Staff & { attendanceManagementEnabled?: boolean | null }
    > = {},
  ) => {
    const staff: Staff = {
      ...baseStaff,
      workType: "weekday",
      ...(staffOverrides as Partial<Staff>),
    };

    const attendance: Attendance = {
      ...baseAttendance,
      ...attendanceOverrides,
    };

    return new AttendanceState(staff, attendance, [], []);
  };

  it("returns None when the work date is today", () => {
    const today = "2024-01-05";
    const state = buildState({ workDate: today });

    setMockToday(state, today);

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns None when attendance management is disabled", () => {
    const state = buildState(
      {
        workDate: "2024-01-10",
        startTime: undefined,
      },
      { attendanceManagementEnabled: false },
    );

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("keeps existing checks when attendance management flag is null", () => {
    const state = buildState(
      {
        workDate: "2024-01-10",
        startTime: undefined,
      },
      { attendanceManagementEnabled: null },
    );

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("keeps weekday error evaluation for past dates", () => {
    const today = "2024-01-05";
    const pastDate = "2024-01-04";
    const state = buildState({ workDate: pastDate, startTime: undefined });

    setMockToday(state, today);

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("keeps None when mocked today (UTC) matches workDate after local conversion", () => {
    const workDate = "2024-01-02";
    const state = buildState({ workDate, startTime: undefined });

    // Mock today as 2024-01-01T15:00:00Z (~2024-01-02 00:00+ in many timezones)
    (state as unknown as { today: Dayjs }).today = dayjs(
      "2024-01-01T15:00:00Z",
    );

    // Current implementation compares formatted date strings; if they match, returns None
    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns None when staff usageStartDate is after workDate", () => {
    const state = buildState(
      { workDate: "2024-01-10" },
      { usageStartDate: "2024-02-01" },
    );

    setMockToday(state, "2024-02-10");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns Ok when paidHolidayFlag is true", () => {
    const state = buildState({ workDate: "2024-01-10", paidHolidayFlag: true });

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.Ok);
  });

  it("returns Ok when substituteHolidayDate is valid", () => {
    const state = buildState({
      workDate: "2024-01-10",
      substituteHolidayDate: "2024-01-05",
    });

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.Ok);
  });

  it("returns Requesting when there is an incomplete change request", () => {
    const state = buildState({
      workDate: "2024-01-10",
      changeRequests: [
        {
          __typename: "AttendanceChangeRequest",
          completed: false,
        },
      ],
    });

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.Requesting);
  });

  it("returns Ok when there are only completed change requests", () => {
    const state = buildState({
      workDate: "2024-01-10",
      changeRequests: [
        {
          __typename: "AttendanceChangeRequest",
          completed: true,
        },
      ],
    });

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.Ok);
  });

  it("returns None on weekend with no start/end time", () => {
    const state = buildState({
      workDate: "2024-01-06", // Saturday
      startTime: "",
      endTime: "",
    });

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns Ok on weekend with start/end time entered", () => {
    const state = buildState({ workDate: "2024-01-07" }); // Sunday

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.Ok);
  });

  it("returns Error on weekday when startTime is missing", () => {
    const state = buildState({
      workDate: "2024-01-09",
      startTime: undefined,
      endTime: "18:00",
    });

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("returns Error on weekday when endTime is missing", () => {
    const state = buildState({
      workDate: "2024-01-09",
      startTime: "09:00",
      endTime: undefined,
    });

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("returns None for shift worker on deemed holiday", () => {
    const state = buildState(
      {
        workDate: "2024-01-09",
        isDeemedHoliday: true,
      },
      { workType: "shift" },
    );

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("treats shift worker as weekday even on weekend", () => {
    const state = buildState(
      {
        workDate: "2024-01-06", // Saturday
        startTime: undefined,
      },
      { workType: "shift" },
    );

    setMockToday(state, "2024-01-10");

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("returns None when non-shift staff has a holiday calendar entry", () => {
    const state = new AttendanceState(
      { ...baseStaff, workType: "weekday" },
      { ...baseAttendance, workDate: "2024-01-10" },
      [
        {
          __typename: "HolidayCalendar",
          id: "h1",
          holidayDate: "2024-01-10",
          name: "祝日",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      [],
    );

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns None when non-shift staff has a company holiday", () => {
    const state = new AttendanceState(
      { ...baseStaff, workType: "weekday" },
      { ...baseAttendance, workDate: "2024-01-10" },
      [],
      [
        {
          __typename: "CompanyHolidayCalendar",
          id: "c1",
          holidayDate: "2024-01-10",
          name: "会社休日",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    );

    setMockToday(state, "2024-02-01");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("prioritizes holiday over change requests for non-shift staff", () => {
    const state = new AttendanceState(
      { ...baseStaff, workType: "weekday" },
      {
        ...baseAttendance,
        workDate: "2024-02-11",
        changeRequests: [
          {
            __typename: "AttendanceChangeRequest",
            completed: false,
          },
        ],
      },
      [
        {
          __typename: "HolidayCalendar",
          id: "h1",
          holidayDate: "2024-02-11",
          name: "祝日",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      [],
    );

    setMockToday(state, "2024-03-01");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns Error when substituteHolidayDate is invalid and startTime is missing", () => {
    const state = buildState({
      workDate: "2024-03-05",
      substituteHolidayDate: "not-a-date",
      startTime: undefined,
    });

    setMockToday(state, "2024-03-06");

    expect(state.get()).toBe(AttendanceStatus.Error);
  });

  it("still returns None when usageStartDate is after workDate even with change requests", () => {
    const state = buildState(
      {
        workDate: "2024-04-01",
        changeRequests: [
          {
            __typename: "AttendanceChangeRequest",
            completed: false,
          },
        ],
      },
      { usageStartDate: "2024-05-01" },
    );

    setMockToday(state, "2024-05-10");

    expect(state.get()).toBe(AttendanceStatus.None);
  });

  it("returns Requesting for shift worker with incomplete change request before late/working checks", () => {
    const state = buildState(
      {
        workDate: "2024-06-10",
        startTime: undefined,
        changeRequests: [
          {
            __typename: "AttendanceChangeRequest",
            completed: false,
          },
        ],
      },
      { workType: "shift" },
    );

    setMockToday(state, "2024-06-20");

    expect(state.get()).toBe(AttendanceStatus.Requesting);
  });
});
