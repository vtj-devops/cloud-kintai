import { AuthContext } from "@app/providers/auth/AuthContext";
import { render, screen } from "@testing-library/react";

import RegisterAttendanceSummaryCard from "../RegisterAttendanceSummaryCard";

type MockBarProps = {
  data: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
};

const mockUseListAttendancesByDateRangeQuery = jest.fn();
const mockUseCloseDates = jest.fn();
let capturedBarProps: MockBarProps | null = null;
const isMockBarProps = (value: unknown): value is MockBarProps => {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return false;
  }
  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return false;
  }
  return "labels" in data && "datasets" in data;
};

const mockBar = jest.fn((props: unknown) => {
  if (isMockBarProps(props)) {
    capturedBarProps = props;
  }
  return <div data-testid="register-dashboard-work-status-chart-mock" />;
});

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useListAttendancesByDateRangeQuery: (...args: unknown[]) =>
    mockUseListAttendancesByDateRangeQuery(...args),
}));

jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: () => mockUseCloseDates(),
}));

jest.mock("react-chartjs-2", () => ({
  Bar: (props: unknown) => mockBar(props),
}));

describe("RegisterAttendanceSummaryCard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-12T09:00:00+09:00"));
    jest.clearAllMocks();
    capturedBarProps = null;
    mockUseCloseDates.mockReturnValue({
      closeDates: [
        {
          id: "close-1",
          startDate: "2026-03-01",
          endDate: "2026-03-31",
          updatedAt: "2026-03-01T00:00:00Z",
          closeDate: "2026-03-31",
        },
      ],
      loading: false,
      error: null,
    });
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [
        {
          id: "a-1",
          workDate: "2026-03-10",
          startTime: "2026-03-10T09:00:00+09:00",
          endTime: "2026-03-10T18:00:00+09:00",
          rests: [
            {
              startTime: "2026-03-10T12:00:00+09:00",
              endTime: "2026-03-10T13:00:00+09:00",
            },
          ],
        },
        {
          id: "a-2",
          workDate: "2026-03-11",
          startTime: "2026-03-11T09:00:00+09:00",
          endTime: "2026-03-11T19:00:00+09:00",
          rests: [
            {
              startTime: "2026-03-11T12:00:00+09:00",
              endTime: "2026-03-11T13:00:00+09:00",
            },
          ],
        },
      ],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("合計勤務時間・勤務日数を表示し、集計期間は情報アイコンのツールチップで確認できる", () => {
    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={0} />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByTestId("register-dashboard-attendance-summary-card"),
    ).toBeInTheDocument();
    expect(screen.getByText("合計勤務時間")).toBeInTheDocument();
    expect(screen.getByText("勤務日数")).toBeInTheDocument();
    expect(screen.getByText("17.0h")).toBeInTheDocument();
    expect(screen.getByText("2日")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-attendance-summary-info"),
    ).toHaveAttribute("aria-label", "集計期間について: 3/1〜3/31");
    expect(
      screen.getByTestId("register-dashboard-work-status-chart-mock"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-work-status-chart-count"),
    ).toHaveTextContent("対象データ 2件");
    expect(
      screen.getByTestId("register-dashboard-work-status-chart-info"),
    ).toHaveAttribute(
      "aria-label",
      "勤務状況チャートの算出根拠: 勤務時間=退勤時刻-出勤時刻-休憩時間（通常勤務）、有給休暇=有給フラグ付きの勤務時間（休憩時間は表示しない）、残業時間=max(勤務時間-所定労働時間,0)、休憩時間=休憩終了時刻-休憩開始時刻の合計（通常勤務のみ）",
    );
    expect(screen.getByText("打刻エラー件数")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-attendance-error-info"),
    ).toHaveAttribute(
      "aria-label",
      "打刻エラー件数について: 集計期間内で修正が必要な打刻エラー日数を表示しています",
    );
    expect(
      screen.getByTestId("register-dashboard-attendance-error-count"),
    ).toHaveTextContent("0件");
    expect(
      screen.getByTestId("register-dashboard-attendance-error-card"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("register-dashboard-attendance-error-card-link"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-attendance-error-count"),
    ).toHaveClass("text-slate-950");

    if (!capturedBarProps) {
      throw new Error("Bar props were not captured");
    }
    const barProps = capturedBarProps;
    expect(barProps.data.labels).toHaveLength(31);
    expect(barProps.data.labels[0]).toBe("3/1");
    expect(barProps.data.labels[30]).toBe("3/31");
    const overtimeDataset = barProps.data.datasets.find(
      (dataset) => dataset.label === "残業時間",
    );
    const workDataset = barProps.data.datasets.find(
      (dataset) => dataset.label === "勤務時間",
    );
    const restDataset = barProps.data.datasets.find(
      (dataset) => dataset.label === "休憩時間",
    );
    const paidHolidayDataset = barProps.data.datasets.find(
      (dataset) => dataset.label === "有給休暇",
    );
    expect(overtimeDataset?.data).toContain(-1);
    expect(paidHolidayDataset?.data.every((value) => value === 0)).toBe(true);
    expect(workDataset?.data[10]).toBe(8);
    expect(restDataset?.data[9]).toBe(1);
    expect(restDataset?.data[10]).toBe(1);
  });

  it("期間中に勤務データがない場合は0件として表示する", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={0} />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByTestId("register-dashboard-work-status-chart-count"),
    ).toHaveTextContent("対象データ 0件");

    if (!capturedBarProps) {
      throw new Error("Bar props were not captured");
    }
    const workDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "勤務時間",
    );
    const overtimeDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "残業時間",
    );
    const restDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "休憩時間",
    );
    const paidHolidayDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "有給休暇",
    );
    expect(workDataset?.data.every((value) => value === 0)).toBe(true);
    expect(paidHolidayDataset?.data.every((value) => value === 0)).toBe(true);
    expect(overtimeDataset?.data.every((value) => value === 0)).toBe(true);
    expect(restDataset?.data.every((value) => value === 0)).toBe(true);
  });

  it("打刻エラーが1件以上のとき件数を赤色で強調表示する", () => {
    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={3} />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByTestId("register-dashboard-attendance-error-count"),
    ).toHaveTextContent("3件");
    expect(
      screen.getByTestId("register-dashboard-attendance-error-count"),
    ).toHaveClass("text-rose-600");
  });

  it("締め期間が前月から当月にまたがる場合はその期間を集計期間表示に使う", () => {
    mockUseCloseDates.mockReturnValue({
      closeDates: [
        {
          id: "close-cross-month",
          startDate: "2026-02-26",
          endDate: "2026-03-25",
          updatedAt: "2026-03-01T00:00:00Z",
          closeDate: "2026-03-25",
        },
      ],
      loading: false,
      error: null,
    });

    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={2} />
      </AuthContext.Provider>,
    );

    expect(mockUseListAttendancesByDateRangeQuery).toHaveBeenCalledWith(
      {
        staffId: "staff-1",
        startDate: "2026-02-26",
        endDate: "2026-03-31",
      },
      expect.objectContaining({
        skip: false,
        refetchOnMountOrArgChange: true,
      }),
    );
    expect(
      screen.getByTestId("register-dashboard-attendance-summary-info"),
    ).toHaveAttribute("aria-label", "集計期間について: 2/26〜3/25");
  });

  it("退勤時刻がある当日の勤務はサマリーとチャートの集計対象に含める", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [
        {
          id: "a-1",
          workDate: "2026-03-11",
          startTime: "2026-03-11T09:00:00+09:00",
          endTime: "2026-03-11T18:00:00+09:00",
          rests: [
            {
              startTime: "2026-03-11T12:00:00+09:00",
              endTime: "2026-03-11T13:00:00+09:00",
            },
          ],
        },
        {
          id: "a-2",
          workDate: "2026-03-12",
          startTime: "2026-03-12T09:00:00+09:00",
          endTime: "2026-03-12T19:00:00+09:00",
          rests: [
            {
              startTime: "2026-03-12T12:00:00+09:00",
              endTime: "2026-03-12T13:00:00+09:00",
            },
          ],
        },
      ],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={0} />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("17.0h")).toBeInTheDocument();
    expect(screen.getByText("2日")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-work-status-chart-count"),
    ).toHaveTextContent("対象データ 2件");

    if (!capturedBarProps) {
      throw new Error("Bar props were not captured");
    }

    const workDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "勤務時間",
    );
    const restDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "休憩時間",
    );
    expect(workDataset?.data[10]).toBe(8);
    expect(workDataset?.data[11]).toBe(8);
    expect(restDataset?.data[10]).toBe(1);
    expect(restDataset?.data[11]).toBe(1);
  });

  it("退勤時刻がない当日の勤務はサマリーとチャートの集計対象から除外する", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      data: [
        {
          id: "a-1",
          workDate: "2026-03-11",
          startTime: "2026-03-11T09:00:00+09:00",
          endTime: "2026-03-11T18:00:00+09:00",
          rests: [
            {
              startTime: "2026-03-11T12:00:00+09:00",
              endTime: "2026-03-11T13:00:00+09:00",
            },
          ],
        },
        {
          id: "a-2",
          workDate: "2026-03-12",
          startTime: "2026-03-12T09:00:00+09:00",
          endTime: null,
          rests: [],
        },
      ],
      isLoading: false,
      isFetching: false,
      isUninitialized: false,
      error: null,
    });

    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          cognitoUser: { id: "staff-1" } as never,
        }}
      >
        <RegisterAttendanceSummaryCard attendanceErrorCount={0} />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("8.0h")).toBeInTheDocument();
    expect(screen.getByText("1日")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-dashboard-work-status-chart-count"),
    ).toHaveTextContent("対象データ 1件");

    if (!capturedBarProps) {
      throw new Error("Bar props were not captured");
    }

    const workDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "勤務時間",
    );
    const restDataset = capturedBarProps.data.datasets.find(
      (dataset) => dataset.label === "休憩時間",
    );
    expect(workDataset?.data[10]).toBe(8);
    expect(workDataset?.data[11]).toBe(0);
    expect(restDataset?.data[10]).toBe(1);
    expect(restDataset?.data[11]).toBe(0);
  });
});
