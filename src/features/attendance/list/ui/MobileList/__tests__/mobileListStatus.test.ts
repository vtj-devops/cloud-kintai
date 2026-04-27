import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import type { Attendance, Staff } from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { getStatus } from "../../../lib/attendanceStatusUtils";
import type { DateRange } from "../../attendanceListUtils";
import { hasErrorOrLateInMonth } from "../mobileListStatus";

jest.mock("../../../lib/attendanceStatusUtils", () => ({
  getStatus: jest.fn(),
}));

const mockGetStatus = getStatus as jest.Mock;

const mockStaff = { id: "staff-1" } as Staff;

function makeAttendance(workDate: string): Attendance {
  return { id: `att-${workDate}`, workDate } as Attendance;
}

function makeDateRange(start: string, end: string): DateRange {
  return {
    start: dayjs(start),
    end: dayjs(end),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStatus.mockReturnValue(AttendanceStatus.Ok);
});

describe("hasErrorOrLateInMonth", () => {
  it("staff が null の場合は false を返す", () => {
    const result = hasErrorOrLateInMonth({
      attendances: [],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: null,
      effectiveDateRange: makeDateRange("2024-03-01", "2024-03-31"),
    });
    expect(result).toBe(false);
  });

  it("全日 Normal ステータスの場合は false を返す", () => {
    mockGetStatus.mockReturnValue(AttendanceStatus.Ok);
    const result = hasErrorOrLateInMonth({
      attendances: [],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange("2024-01-01", "2024-01-03"),
    });
    expect(result).toBe(false);
  });

  it("Error ステータスの日付がある場合は true を返す", () => {
    mockGetStatus
      .mockReturnValueOnce(AttendanceStatus.Ok)
      .mockReturnValueOnce(AttendanceStatus.Error);
    const result = hasErrorOrLateInMonth({
      attendances: [],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange("2024-01-01", "2024-01-02"),
    });
    expect(result).toBe(true);
  });

  it("Late ステータスの日付がある場合は true を返す", () => {
    mockGetStatus.mockReturnValue(AttendanceStatus.Late);
    const result = hasErrorOrLateInMonth({
      attendances: [],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange("2024-01-01", "2024-01-01"),
    });
    expect(result).toBe(true);
  });

  it("未来の日付はスキップする", () => {
    const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD");
    const result = hasErrorOrLateInMonth({
      attendances: [makeAttendance(futureDate)],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange(futureDate, futureDate),
    });
    expect(result).toBe(false);
    expect(mockGetStatus).not.toHaveBeenCalled();
  });

  it("workDate が一致する attendance が見つかる場合、getStatus に渡される", () => {
    const pastDate = "2024-01-15";
    const attendance = makeAttendance(pastDate);
    mockGetStatus.mockReturnValue(AttendanceStatus.Ok);
    hasErrorOrLateInMonth({
      attendances: [attendance],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange(pastDate, pastDate),
    });
    expect(mockGetStatus).toHaveBeenCalledWith(
      attendance,
      mockStaff,
      [],
      [],
      expect.anything(),
    );
  });

  it("start と end が同じ日でも動作する", () => {
    mockGetStatus.mockReturnValue(AttendanceStatus.Ok);
    const result = hasErrorOrLateInMonth({
      attendances: [],
      holidayCalendars: [],
      companyHolidayCalendars: [],
      staff: mockStaff,
      effectiveDateRange: makeDateRange("2024-01-01", "2024-01-01"),
    });
    expect(result).toBe(false);
  });
});
