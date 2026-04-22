import { AuthContext, type AuthContextProps } from "@app/providers/auth/AuthContext";
import { useGetAttendanceStatisticsSnapshotQuery } from "@entities/attendance-statistics/api/attendanceStatisticsApi";
import { rebuildAttendanceStatistics } from "@entities/attendance-statistics/model/attendanceStatisticsService";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AttendanceStatistics from "./AttendanceStatistics";

jest.mock("@entities/attendance-statistics/api/attendanceStatisticsApi", () => ({
  useGetAttendanceStatisticsSnapshotQuery: jest.fn(),
}));

jest.mock(
  "@entities/attendance-statistics/model/attendanceStatisticsService",
  () => ({
    rebuildAttendanceStatistics: jest.fn(),
  }),
);

const mockedUseGetAttendanceStatisticsSnapshotQuery =
  useGetAttendanceStatisticsSnapshotQuery as jest.Mock;
const mockedRebuildAttendanceStatistics =
  rebuildAttendanceStatistics as jest.Mock;

const authContextValue: AuthContextProps = {
  session: {
    roles: [],
    cognitoUser: {
      id: "staff-1",
      givenName: "Test",
      familyName: "User",
      mailAddress: "test@example.com",
      owner: false,
      roles: [],
      emailVerified: true,
    },
  },
  cognitoUser: {
    id: "staff-1",
    givenName: "Test",
    familyName: "User",
    mailAddress: "test@example.com",
    owner: false,
    roles: [],
    emailVerified: true,
  },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
  roles: [],
};

function renderComponent() {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <AttendanceStatistics />
    </AuthContext.Provider>,
  );
}

describe("AttendanceStatistics", () => {
  beforeEach(() => {
    mockedUseGetAttendanceStatisticsSnapshotQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      isError: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    });
    mockedRebuildAttendanceStatistics.mockReset();
  });

  it("統計未作成時は空状態と再集計ボタンを表示する", () => {
    renderComponent();

    expect(
      screen.getByText("まだ統計が作成されていません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "この年の統計を再集計" }),
    ).toBeInTheDocument();
  });

  it("保存済みスナップショットを年間・月別サマリーとして表示する", () => {
    mockedUseGetAttendanceStatisticsSnapshotQuery.mockReturnValue({
      data: {
        id: "snapshot-1",
        staffId: "staff-1",
        year: 2026,
        status: "SUCCEEDED",
        progressPercent: 100,
        currentStepLabel: "集計が完了しました",
        rangeStart: "2026-01-01",
        rangeEnd: "2026-12-31",
        monthlySummaries: [
          {
            month: 1,
            rangeStart: "2026-01-01",
            rangeEnd: "2026-01-31",
            workHours: 8,
            paidDays: 1,
            specialHolidayDays: 0,
            absentDays: 0,
            workDays: 1,
            isFallback: false,
          },
        ],
        totalWorkHours: 8,
        totalPaidDays: 1,
        totalSpecialHolidayDays: 0,
        totalAbsentDays: 0,
        totalWorkDays: 1,
        startedAt: "2026-04-08T01:00:00.000Z",
        completedAt: "2026-04-08T01:01:00.000Z",
        lastAggregatedAt: "2026-04-08T01:01:00.000Z",
        errorMessage: null,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      isError: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    });

    renderComponent();

    expect(screen.getByText("年間サマリー")).toBeInTheDocument();
    expect(screen.getByText("月別サマリー")).toBeInTheDocument();
    expect(screen.getByText("2026/01/01 - 2026/12/31 を集計期間として表示しています。")).toBeInTheDocument();
    expect(screen.getAllByText("8.0 時間").length).toBeGreaterThan(0);
    expect(screen.getByText("1月")).toBeInTheDocument();
  });

  it("再集計中は進捗テキストを表示する", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn().mockResolvedValue(undefined);
    let resolveRebuild: (() => void) | undefined;

    mockedUseGetAttendanceStatisticsSnapshotQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      error: null,
      isError: false,
      refetch,
    });
    mockedRebuildAttendanceStatistics.mockImplementation(
      ({
        onProgress,
      }: {
        onProgress?: (progress: {
          progressPercent: number;
          currentStepLabel: string;
          startedAt: string;
        }) => void;
      }) =>
        new Promise<void>((resolve) => {
          onProgress?.({
            progressPercent: 35,
            currentStepLabel: "勤怠データを取得しています",
            startedAt: "2026-04-08T01:00:00.000Z",
          });
          resolveRebuild = resolve;
        }),
    );

    renderComponent();
    await user.click(screen.getByRole("button", { name: "この年の統計を再集計" }));

    expect(screen.getByText("統計を再集計しています")).toBeInTheDocument();
    expect(screen.getByText("勤怠データを取得しています")).toBeInTheDocument();

    const finishRebuild = resolveRebuild;
    if (finishRebuild) {
      finishRebuild();
    }

    await waitFor(() => {
      expect(refetch).toHaveBeenCalled();
    });
  });
});
