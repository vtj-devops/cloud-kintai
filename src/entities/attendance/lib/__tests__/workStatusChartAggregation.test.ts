import { createMockAttendance } from "@shared/test-utils";

import { toAttendanceWorkStatusHours } from "../workStatusChartAggregation";

describe("toAttendanceWorkStatusHours", () => {
  it("通常勤務は休憩時間を差し引いて勤務時間と残業時間を算出する", () => {
    const attendance = createMockAttendance({
      startTime: "2024-06-01T09:00:00Z",
      endTime: "2024-06-01T19:00:00Z",
      paidHolidayFlag: false,
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-06-01T12:00:00Z",
          endTime: "2024-06-01T13:00:00Z",
        },
      ],
    });

    const result = toAttendanceWorkStatusHours({
      attendance,
      standardWorkHours: 8,
      hideRestHoursOnPaidHoliday: true,
    });

    expect(result.workHours).toBe(8);
    expect(result.overtimeHours).toBe(1);
    expect(result.restHours).toBe(1);
    expect(result.paidHolidayHours).toBe(0);
  });

  it("有給休暇時は休憩時間を非表示にし、勤務時間を有給時間に計上する", () => {
    const attendance = createMockAttendance({
      startTime: "2024-06-01T09:00:00Z",
      endTime: "2024-06-01T18:00:00Z",
      paidHolidayFlag: true,
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-06-01T12:00:00Z",
          endTime: "2024-06-01T13:00:00Z",
        },
      ],
    });

    const result = toAttendanceWorkStatusHours({
      attendance,
      standardWorkHours: 8,
      hideRestHoursOnPaidHoliday: true,
    });

    expect(result.workHours).toBe(0);
    expect(result.paidHolidayHours).toBe(9);
    expect(result.overtimeHours).toBe(0);
    expect(result.restHours).toBe(0);
  });
});
