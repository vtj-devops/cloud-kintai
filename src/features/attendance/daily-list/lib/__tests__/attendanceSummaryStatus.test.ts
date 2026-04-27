import { Attendance, Staff } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { resolveAttendanceSummaryStatus } from "../attendanceSummaryStatus";

const createStaff = (overrides: Partial<Staff> = {}): Staff =>
  ({
    id: "staff-1",
    familyName: "山田",
    givenName: "太郎",
    workType: "normal",
    usageStartDate: "2024-01-01",
    ...overrides,
  }) as Staff;

const createAttendance = (
  workDate: string,
  overrides: Partial<Attendance> = {},
): Attendance =>
  ({
    id: `attendance-${workDate}`,
    staffId: "staff-1",
    workDate,
    startTime: `${workDate}T09:00:00.000Z`,
    endTime: `${workDate}T18:00:00.000Z`,
    changeRequests: [],
    systemComments: [],
    ...overrides,
  }) as Attendance;

describe("resolveAttendanceSummaryStatus", () => {
  it("missing past business days are treated as error", () => {
    const baseDate = dayjs().subtract(1, "month").startOf("month");
    const attendances = [
      createAttendance(baseDate.date(1).format("YYYY-MM-DD")),
    ];

    const result = resolveAttendanceSummaryStatus({
      attendances,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: createStaff(),
      baseDate,
    });

    expect(result).toBe("error");
  });

  it("returns requesting when an unapproved change request exists", () => {
    const baseDate = dayjs().add(2, "month").startOf("month");
    const attendances = [
      createAttendance(baseDate.date(1).format("YYYY-MM-DD"), {
        changeRequests: [
          { __typename: "AttendanceChangeRequest", completed: false },
        ],
      }),
    ];

    const result = resolveAttendanceSummaryStatus({
      attendances,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: createStaff({ usageStartDate: baseDate.format("YYYY-MM-DD") }),
      baseDate,
    });

    expect(result).toBe("requesting");
  });

  it("returns ok when available records are healthy", () => {
    const baseDate = dayjs().add(2, "month").startOf("month");
    const attendances = [
      createAttendance(baseDate.date(1).format("YYYY-MM-DD")),
    ];

    const result = resolveAttendanceSummaryStatus({
      attendances,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: createStaff({ usageStartDate: baseDate.format("YYYY-MM-DD") }),
      baseDate,
    });

    expect(result).toBe("ok");
  });

  it("returns error when any attendance has system comments", () => {
    const baseDate = dayjs().add(2, "month").startOf("month");
    const attendances = [
      createAttendance(baseDate.date(1).format("YYYY-MM-DD"), {
        systemComments: [
          {
            __typename: "SystemComment",
            comment: "自動補正が必要です",
            confirmed: false,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    ];

    const result = resolveAttendanceSummaryStatus({
      attendances,
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: createStaff({ usageStartDate: baseDate.format("YYYY-MM-DD") }),
      baseDate,
    });

    expect(result).toBe("error");
  });
});
