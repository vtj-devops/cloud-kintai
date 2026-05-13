import { useLazyListAttendancesByDateRangeQuery } from "@entities/attendance/api/attendanceApi";
import { useAttendanceDailyFetch } from "@features/attendance/daily-list/model/useAttendanceDailyFetch";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useLazyListAttendancesByDateRangeQuery: jest.fn(),
}));

const mockTrigger = jest.fn();

const makeAttendance = (overrides: Record<string, unknown> = {}) => ({
  id: "att-1",
  staffId: "staff-1",
  workDate: "2024-01-15",
  startTime: "2024-01-15T09:00:00.000Z",
  endTime: "2024-01-15T19:00:00.000Z",
  ...overrides,
});

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  sub: "staff-1",
  givenName: "太郎",
  familyName: "山田",
  sortKey: "山田太郎",
  attendance: null,
  ...overrides,
});

const defaultParams = {
  attendanceDailyList: [],
  displayDateFormatted: "2024-01-15",
  staffNameMap: { "staff-1": "山田 太郎" },
  scheduledHour: 18,
  scheduledMinute: 0,
  duplicateAttendances: [],
  loading: false,
};

describe("useAttendanceDailyFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      useLazyListAttendancesByDateRangeQuery as jest.Mock
    ).mockReturnValue([mockTrigger]);
    mockTrigger.mockReturnValue({
      unwrap: () => Promise.resolve([]),
    });
  });

  it("returns empty maps when attendanceDailyList is empty", () => {
    const { result } = renderHook(() =>
      useAttendanceDailyFetch(defaultParams),
    );

    expect(result.current.attendanceMap).toEqual({});
    expect(result.current.attendanceLoadingMap).toEqual({});
    expect(result.current.attendanceErrorMap).toEqual({});
  });

  it("calls trigger for each staff in attendanceDailyList", async () => {
    const rows = [makeRow()];
    renderHook(() =>
      useAttendanceDailyFetch({ ...defaultParams, attendanceDailyList: rows }),
    );

    await waitFor(() => expect(mockTrigger).toHaveBeenCalled());

    expect(mockTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: "staff-1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );
  });

  it("stores fetched attendances in attendanceMap", async () => {
    const attendance = makeAttendance();
    mockTrigger.mockReturnValue({
      unwrap: () => Promise.resolve([attendance]),
    });

    const rows = [makeRow()];
    const { result } = renderHook(() =>
      useAttendanceDailyFetch({ ...defaultParams, attendanceDailyList: rows }),
    );

    await waitFor(() =>
      expect(result.current.attendanceMap["staff-1"]).toHaveLength(1),
    );

    expect(result.current.attendanceMap["staff-1"][0].workDate).toBe(
      "2024-01-15",
    );
    expect(result.current.attendanceLoadingMap["staff-1"]).toBe(false);
  });

  it("sets error when fetch fails", async () => {
    mockTrigger.mockReturnValue({
      unwrap: () => Promise.reject(new Error("API error")),
    });

    const rows = [makeRow()];
    const { result } = renderHook(() =>
      useAttendanceDailyFetch({ ...defaultParams, attendanceDailyList: rows }),
    );

    await waitFor(() =>
      expect(result.current.attendanceErrorMap["staff-1"]).toBeTruthy(),
    );

    expect(result.current.attendanceErrorMap["staff-1"]?.message).toBe(
      "API error",
    );
    expect(result.current.attendanceLoadingMap["staff-1"]).toBe(false);
  });

  it("handles duplicate error details in error response", async () => {
    const dupError = {
      details: {
        duplicates: [
          {
            workDate: "2024-01-15",
            ids: ["att-1", "att-2"],
            staffId: "staff-1",
          },
        ],
      },
    };
    mockTrigger.mockReturnValue({
      unwrap: () => Promise.reject(dupError),
    });

    const rows = [makeRow()];
    const { result } = renderHook(() =>
      useAttendanceDailyFetch({ ...defaultParams, attendanceDailyList: rows }),
    );

    await waitFor(() =>
      expect(result.current.duplicateSummaryMap["staff-1"]).toBeDefined(),
    );

    expect(result.current.duplicateSummaryMap["staff-1"]).toHaveLength(1);
    expect(result.current.duplicateSummaryMap["staff-1"][0].workDate).toBe(
      "2024-01-15",
    );
  });

  it("deduplicates staff fetches when duplicate sub values exist", async () => {
    const rows = [makeRow(), makeRow()]; // same sub "staff-1" twice
    renderHook(() =>
      useAttendanceDailyFetch({ ...defaultParams, attendanceDailyList: rows }),
    );

    await waitFor(() => expect(mockTrigger).toHaveBeenCalled());

    // Should only be called once due to Set deduplication
    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  describe("getAttendanceForDisplayDate", () => {
    it("returns matching attendance from attendanceMap for displayDate", async () => {
      const attendance = makeAttendance({ workDate: "2024-01-15" });
      mockTrigger.mockReturnValue({
        unwrap: () => Promise.resolve([attendance]),
      });

      const rows = [makeRow()];
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: rows,
        }),
      );

      await waitFor(() =>
        expect(result.current.attendanceMap["staff-1"]).toBeTruthy(),
      );

      const found = result.current.getAttendanceForDisplayDate(
        rows[0] as ReturnType<typeof makeRow>,
      );
      expect(found?.workDate).toBe("2024-01-15");
    });

    it("returns row.attendance when no match in attendanceMap and dates match", () => {
      const attendance = makeAttendance({ workDate: "2024-01-15" });
      const row = makeRow({ attendance });
      const list = [row];

      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: list,
        }),
      );

      const found = result.current.getAttendanceForDisplayDate(
        row as ReturnType<typeof makeRow>,
      );
      expect(found?.workDate).toBe("2024-01-15");
    });

    it("returns null when row.attendance date does not match displayDate", () => {
      const attendance = makeAttendance({ workDate: "2024-01-10" });
      const row = makeRow({ attendance });
      const list = [row];

      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          displayDateFormatted: "2024-01-15",
          attendanceDailyList: list,
        }),
      );

      const found = result.current.getAttendanceForDisplayDate(
        row as ReturnType<typeof makeRow>,
      );
      expect(found).toBeNull();
    });

    it("returns null when row.attendance is null and no map match", () => {
      const row = makeRow({ attendance: null });
      const list = [row];

      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          displayDateFormatted: "2024-01-15",
          attendanceDailyList: list,
        }),
      );

      const found = result.current.getAttendanceForDisplayDate(
        row as ReturnType<typeof makeRow>,
      );
      expect(found).toBeNull();
    });
  });

  describe("overtimeMinutesMap", () => {
    it("calculates overtime when end time exceeds scheduled end", async () => {
      // scheduledHour=18:00, endTime=19:00 → 60 min overtime
      const attendance = makeAttendance({
        workDate: "2024-01-15",
        endTime: "2024-01-15T19:00:00.000Z",
      });
      mockTrigger.mockReturnValue({
        unwrap: () => Promise.resolve([attendance]),
      });

      const rows = [makeRow()];
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: rows,
          scheduledHour: 18,
          scheduledMinute: 0,
        }),
      );

      await waitFor(() =>
        expect(result.current.overtimeMinutesMap["staff-1"]).toBeDefined(),
      );

      expect(result.current.overtimeMinutesMap["staff-1"]).toBeGreaterThan(0);
    });

    it("returns 0 overtime when end time is before scheduled end", async () => {
      // scheduledHour=18:00, endTime=17:00 local → 0 min overtime
      const attendance = makeAttendance({
        workDate: "2024-01-15",
        endTime: "2024-01-15T17:00:00",
      });
      mockTrigger.mockReturnValue({
        unwrap: () => Promise.resolve([attendance]),
      });

      const rows = [makeRow()];
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: rows,
          scheduledHour: 18,
          scheduledMinute: 0,
        }),
      );

      await waitFor(() =>
        expect(result.current.attendanceMap["staff-1"]).toBeTruthy(),
      );

      expect(result.current.overtimeMinutesMap["staff-1"]).toBe(0);
    });
  });

  describe("mergedDuplicateAttendances", () => {
    it("deduplicates across duplicateAttendances and summaryDuplicateList", async () => {
      const dupError = {
        details: {
          duplicates: [
            {
              workDate: "2024-01-15",
              ids: ["att-1", "att-2"],
              staffId: "staff-1",
            },
          ],
        },
      };
      mockTrigger.mockReturnValue({
        unwrap: () => Promise.reject(dupError),
      });

      const externalDup = {
        staffId: "staff-1",
        staffName: "山田 太郎",
        workDate: "2024-01-15",
        ids: ["att-1", "att-2"],
      };

      const rows = [makeRow()];
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: rows,
          duplicateAttendances: [externalDup],
        }),
      );

      await waitFor(() =>
        expect(result.current.duplicateSummaryMap["staff-1"]).toBeDefined(),
      );

      expect(result.current.mergedDuplicateAttendances).toHaveLength(1);
    });

    it("returns empty array when loading is true", () => {
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          loading: true,
          duplicateAttendances: [
            {
              staffId: "staff-1",
              staffName: "山田 太郎",
              workDate: "2024-01-15",
              ids: ["att-1", "att-2"],
            },
          ],
        }),
      );

      expect(result.current.mergedDuplicateAttendances).toHaveLength(0);
    });
  });

  describe("duplicateInfoByStaff", () => {
    it("groups duplicates by staffId", async () => {
      const dupError = {
        details: {
          duplicates: [
            {
              workDate: "2024-01-15",
              ids: ["att-1", "att-2"],
              staffId: "staff-1",
            },
          ],
        },
      };
      mockTrigger.mockReturnValue({
        unwrap: () => Promise.reject(dupError),
      });

      const rows = [makeRow()];
      const { result } = renderHook(() =>
        useAttendanceDailyFetch({
          ...defaultParams,
          attendanceDailyList: rows,
        }),
      );

      await waitFor(() =>
        expect(result.current.duplicateSummaryMap["staff-1"]).toBeDefined(),
      );

      expect(result.current.duplicateInfoByStaff["staff-1"]).toHaveLength(1);
    });
  });
});
