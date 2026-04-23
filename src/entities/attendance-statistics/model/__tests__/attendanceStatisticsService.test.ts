import fetchCloseDates from "@entities/attendance/model/closeDates/fetchCloseDates";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import { aggregateAttendanceStatistics } from "../aggregation";
import { rebuildAttendanceStatistics } from "../attendanceStatisticsService";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn(),
  },
}));

jest.mock("@entities/attendance/model/closeDates/fetchCloseDates", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../aggregation", () => ({
  aggregateAttendanceStatistics: jest.fn(),
}));

const mockGraphql = graphqlClient.graphql as jest.Mock;
const mockFetchCloseDates = fetchCloseDates as jest.Mock;
const mockAggregateStats = aggregateAttendanceStatistics as jest.Mock;

const makeSnapshot = (overrides = {}) => ({
  id: "attendance-statistics#s1#2024",
  staffId: "s1",
  year: 2024,
  status: "RUNNING",
  progressPercent: 10,
  currentStepLabel: "",
  rangeStart: "2024-01-01",
  rangeEnd: "2024-12-31",
  monthlySummaries: [],
  totalWorkHours: 0,
  totalPaidDays: 0,
  totalSpecialHolidayDays: 0,
  totalAbsentDays: 0,
  totalWorkDays: 0,
  startedAt: "2024-01-01T00:00:00.000Z",
  completedAt: null,
  lastAggregatedAt: null,
  errorMessage: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const makeAggregateResult = () => ({
  rangeStart: "2024-01-01",
  rangeEnd: "2024-12-31",
  monthlySummaries: [],
  totalWorkHours: 160,
  totalPaidDays: 2,
  totalSpecialHolidayDays: 1,
  totalAbsentDays: 0,
  totalWorkDays: 20,
  hasFallbackTerms: false,
});

describe("rebuildAttendanceStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCloseDates.mockResolvedValue([]);
    mockAggregateStats.mockReturnValue(makeAggregateResult());
  });

  it("既存スナップショットなしで新規作成フローが完了する", async () => {
    const snapshot = makeSnapshot();
    // 呼び出し順: fetch→create(10%)→update(35%)→fetchAttendances→update(70%)→update(SUCCEEDED)
    mockGraphql
      .mockResolvedValueOnce({ data: { attendanceStatisticsByStaffIdYear: { items: [] } } })
      .mockResolvedValueOnce({ data: { createAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { attendancesByStaffId: { items: [], nextToken: null } } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: { ...snapshot, status: "SUCCEEDED" } } });

    const onProgress = jest.fn();
    const result = await rebuildAttendanceStatistics({
      staffId: "s1",
      year: 2024,
      onProgress,
    });

    expect(result).toBeDefined();
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ progressPercent: 10 })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ progressPercent: 100 })
    );
  });

  it("既存スナップショットありで更新フローが完了する", async () => {
    const existing = makeSnapshot({ status: "SUCCEEDED" });
    const updated = makeSnapshot({ status: "RUNNING" });
    mockGraphql
      .mockResolvedValueOnce({ data: { attendanceStatisticsByStaffIdYear: { items: [existing] } } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: updated } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: updated } })
      .mockResolvedValueOnce({ data: { attendancesByStaffId: { items: [], nextToken: null } } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: updated } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: { ...updated, status: "SUCCEEDED" } } });

    const result = await rebuildAttendanceStatistics({
      staffId: "s1",
      year: 2024,
    });

    expect(result).toBeDefined();
  });

  it("スナップショット取得エラー時に例外をスローする", async () => {
    mockGraphql.mockResolvedValueOnce({
      errors: [{ message: "取得エラー" }],
    });

    await expect(
      rebuildAttendanceStatistics({ staffId: "s1", year: 2024 })
    ).rejects.toThrow("取得エラー");
  });

  it("勤怠データ取得エラー時にFAILEDステータスで保存する", async () => {
    const snapshot = makeSnapshot();
    let callCount = 0;
    mockGraphql.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: { attendanceStatisticsByStaffIdYear: { items: [] } } };
      }
      if (callCount === 2) {
        return { data: { createAttendanceStatisticsSnapshot: snapshot } };
      }
      if (callCount === 3) {
        // fetchAttendancesByDateRange fails
        return { data: { attendancesByStaffId: null } };
      }
      // FAILED persist
      return {
        data: {
          updateAttendanceStatisticsSnapshot: {
            ...snapshot,
            status: "FAILED",
          },
        },
      };
    });

    await expect(
      rebuildAttendanceStatistics({ staffId: "s1", year: 2024 })
    ).rejects.toThrow();
  });

  it("ページング付きで全勤怠データを取得する", async () => {
    const snapshot = makeSnapshot();
    const attendance = {
      id: "att1",
      staffId: "s1",
      workDate: "2024-04-01",
      startTime: null,
      endTime: null,
      paidHolidayFlag: false,
    };
    let callCount = 0;
    mockGraphql.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: { attendanceStatisticsByStaffIdYear: { items: [] } } };
      }
      if (callCount <= 3) {
        return { data: { createAttendanceStatisticsSnapshot: snapshot } };
      }
      if (callCount === 4) {
        // first page with nextToken
        return {
          data: {
            attendancesByStaffId: {
              items: [attendance],
              nextToken: "page2",
            },
          },
        };
      }
      if (callCount === 5) {
        // second page
        return {
          data: {
            attendancesByStaffId: {
              items: [{ ...attendance, id: "att2" }],
              nextToken: null,
            },
          },
        };
      }
      return { data: { updateAttendanceStatisticsSnapshot: snapshot } };
    });

    await rebuildAttendanceStatistics({ staffId: "s1", year: 2024 });

    // aggregateAttendanceStatistics should be called with both pages combined
    const secondCall = mockAggregateStats.mock.calls.find(
      (call) => call[0].attendances.length > 0
    );
    expect(secondCall?.[0].attendances).toHaveLength(2);
  });

  it("onProgressコールバックなしでも正常に動作する", async () => {
    const snapshot = makeSnapshot();
    mockGraphql
      .mockResolvedValueOnce({ data: { attendanceStatisticsByStaffIdYear: { items: [] } } })
      .mockResolvedValueOnce({ data: { createAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { attendancesByStaffId: { items: [], nextToken: null } } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: snapshot } })
      .mockResolvedValueOnce({ data: { updateAttendanceStatisticsSnapshot: { ...snapshot, status: "SUCCEEDED" } } });

    await expect(
      rebuildAttendanceStatistics({ staffId: "s1", year: 2024 })
    ).resolves.toBeDefined();
  });
});
