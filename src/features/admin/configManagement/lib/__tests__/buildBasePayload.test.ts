import dayjs, { Dayjs } from "dayjs";

import {
  buildBasePayload,
  buildStandardWorkHours,
  formatTime,
} from "@/features/admin/configManagement/lib/payloadHelpers";

describe("buildBasePayload helpers", () => {
  test("formatTime formats Dayjs to HH:mm", () => {
    const d = dayjs("2020-01-01T09:05:00");
    expect(formatTime(d)).toBe("09:05");
  });

  test("buildStandardWorkHours calculates base minus lunch", () => {
    const start = dayjs("2020-01-01T09:00:00");
    const end = dayjs("2020-01-01T18:00:00");
    const restStart = dayjs("2020-01-01T12:00:00");
    const restEnd = dayjs("2020-01-01T13:00:00");
    const hours = buildStandardWorkHours(start, end, restStart, restEnd);
    // 9 hours total - 1 hour lunch = 8
    expect(Math.round(hours)).toBe(8);
  });

  test("buildBasePayload contains formatted times and mapped arrays", () => {
    const requiredTimes: {
      startTime: Dayjs;
      endTime: Dayjs;
      lunchRestStartTime: Dayjs;
      lunchRestEndTime: Dayjs;
      amHolidayStartTime: Dayjs;
      amHolidayEndTime: Dayjs;
      pmHolidayStartTime: Dayjs;
      pmHolidayEndTime: Dayjs;
    } = {
      startTime: dayjs("2020-01-01T09:00:00"),
      endTime: dayjs("2020-01-01T18:00:00"),
      lunchRestStartTime: dayjs("2020-01-01T12:00:00"),
      lunchRestEndTime: dayjs("2020-01-01T13:00:00"),
      amHolidayStartTime: dayjs("2020-01-01T09:00:00"),
      amHolidayEndTime: dayjs("2020-01-01T12:00:00"),
      pmHolidayStartTime: dayjs("2020-01-01T13:00:00"),
      pmHolidayEndTime: dayjs("2020-01-01T18:00:00"),
    };

    const payload = buildBasePayload(requiredTimes, {
      links: [
        { label: "a", url: "https://example.com", enabled: true, icon: "home" },
      ],
      reasons: [{ reason: "test", enabled: true }],
      quickInputStartTimes: [
        { time: dayjs("2020-01-01T09:00:00"), enabled: true },
      ],
      quickInputEndTimes: [
        { time: dayjs("2020-01-01T18:00:00"), enabled: true },
      ],
      officeMode: true,
      absentEnabled: true,
      hourlyPaidHolidayEnabled: true,
      amPmHolidayEnabled: true,
      specialHolidayEnabled: false,
      attendanceStatisticsEnabled: true,
      overTimeCheckEnabled: true,
    });
    expect(payload.workStartTime).toBe("09:00");
    expect(payload.workEndTime).toBe("18:00");
    expect(payload.lunchRestStartTime).toBe("12:00");
    expect(payload.lunchRestEndTime).toBe("13:00");
    expect(payload.amHolidayStartTime).toBe("09:00");
    expect(payload.pmHolidayEndTime).toBe("18:00");
    expect(typeof payload.standardWorkHours).toBe("number");
    expect(Array.isArray(payload.links)).toBe(true);
    expect(Array.isArray(payload.reasons)).toBe(true);
  });
});
