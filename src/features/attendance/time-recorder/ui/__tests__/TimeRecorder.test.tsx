import {
  AuthContext,
  type AuthContextProps,
} from "@app/providers/auth/AuthContext";
import {
  useGetAttendanceByStaffAndDateQuery,
  useListAttendancesByDateRangeWithPlaceholdersQuery,
  useUpdateAttendanceMutation,
  useUpsertAttendanceByStaffAndDateMutation,
} from "@entities/attendance/api/attendanceApi";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import type { Attendance, Staff } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDispatch } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { clockInCallback } from "../clockInCallback";
import { clockOutCallback } from "../clockOutCallback";
import { goDirectlyCallback } from "../goDirectlyCallback";
import { restEndCallback } from "../restEndCallback";
import { restStartCallback } from "../restStartCallback";
import { returnDirectlyCallback } from "../returnDirectlyCallback";
import TimeRecorder, {
  type TimeRecorderElapsedWorkInfo,
} from "../TimeRecorder";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useGetAttendanceByStaffAndDateQuery: jest.fn(),
  useListAttendancesByDateRangeWithPlaceholdersQuery: jest.fn(),
  useUpdateAttendanceMutation: jest.fn(),
  useUpsertAttendanceByStaffAndDateMutation: jest.fn(),
}));

jest.mock("@entities/calendar/model/useCalendars", () => ({
  useCalendars: jest.fn(),
}));

jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@entities/attendance/lib/businessDate", () => ({
  resolveCurrentBusinessWorkDate: jest.fn(() => "2024-12-25"),
  resolveBusinessWorkDate: jest.fn(() => "2024-12-25"),
}));

jest.mock("@entities/attendance/lib/aggregationDateRange", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dayjs = require("dayjs");
  return {
    getEffectiveDateRange: jest.fn(() => ({
      start: dayjs("2024-12-01"),
      end: dayjs("2024-12-25"),
    })),
    getEffectivePastDateRangeEnd: jest.fn(() => dayjs("2024-12-24")),
  };
});

jest.mock("@entities/attendance/lib/time", () => ({
  getNowISOStringWithZeroSeconds: jest.fn(() => "2024-12-25T09:00:00.000Z"),
}));

jest.mock("@entities/attendance/lib/operationContext", () => ({
  buildAttendanceIdempotencyKey: jest.fn(() => "test-idempotency-key"),
}));

jest.mock("@entities/attendance/lib/actions/attendanceActions", () => ({
  GoDirectlyFlag: { YES: 0, NO: 1 },
  ReturnDirectlyFlag: { YES: 0, NO: 1 },
  clockInAction: jest.fn(),
  clockOutAction: jest.fn(),
  restStartAction: jest.fn(),
  restEndAction: jest.fn(),
}));

jest.mock("@shared/lib/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload: unknown) => ({
    type: "notification/push",
    payload,
  })),
}));

jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onUpdateAttendance: "mock-on-update-attendance",
}));

// View stubs that expose TimeRecorderContext values as data-testid elements
jest.mock("../TimeRecorderView", () => ({
  TimeRecorderLoadingView: () => <div data-testid="time-recorder-loading" />,
  TimeRecorderView: function TimeRecorderViewMock() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTimeRecorder } = require("../TimeRecorderContext");
    const ctx = useTimeRecorder();
    return (
      <div data-testid="time-recorder-view">
        <span data-testid="ctx-work-status">{ctx.workStatus.code}</span>
        <span data-testid="ctx-direct-mode">{String(ctx.directMode)}</span>
        <span data-testid="ctx-has-change-request">
          {String(ctx.hasChangeRequest)}
        </span>
        <span data-testid="ctx-is-attendance-error">
          {String(ctx.isAttendanceError)}
        </span>
        <span data-testid="ctx-clock-in-text">
          {ctx.clockInDisplayText ?? ""}
        </span>
        <span data-testid="ctx-clock-out-text">
          {ctx.clockOutDisplayText ?? ""}
        </span>
        <button data-testid="btn-clock-in" onClick={ctx.onClockIn} />
        <button data-testid="btn-clock-out" onClick={ctx.onClockOut} />
        <button data-testid="btn-rest-start" onClick={ctx.onRestStart} />
        <button data-testid="btn-rest-end" onClick={ctx.onRestEnd} />
        <button data-testid="btn-go-directly" onClick={ctx.onGoDirectly} />
        <button
          data-testid="btn-return-directly"
          onClick={ctx.onReturnDirectly}
        />
        <button
          data-testid="btn-toggle-direct"
          onClick={() => ctx.onDirectModeChange((p: boolean) => !p)}
        />
      </div>
    );
  },
}));

jest.mock("../clockInCallback", () => ({ clockInCallback: jest.fn() }));
jest.mock("../clockOutCallback", () => ({ clockOutCallback: jest.fn() }));
jest.mock("../goDirectlyCallback", () => ({ goDirectlyCallback: jest.fn() }));
jest.mock("../returnDirectlyCallback", () => ({
  returnDirectlyCallback: jest.fn(),
}));
jest.mock("../restStartCallback", () => ({ restStartCallback: jest.fn() }));
jest.mock("../restEndCallback", () => ({ restEndCallback: jest.fn() }));

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_STAFF: Staff = {
  __typename: "Staff",
  id: "staff-1",
  cognitoUserId: "user-1",
  mailAddress: "test@example.com",
  role: "staff",
  enabled: true,
  status: "active",
  createdAt: "2024-12-01T00:00:00.000Z",
  updatedAt: "2024-12-01T00:00:00.000Z",
};

const MOCK_COGNITO_USER: CognitoUser = {
  id: "user-1",
  givenName: "Test",
  familyName: "User",
  mailAddress: "test@example.com",
  owner: false,
  roles: [],
  emailVerified: true,
};

const DEFAULT_AUTH: AuthContextProps = {
  cognitoUser: MOCK_COGNITO_USER,
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
};

const mockDispatch = jest.fn();
const mockRefetchAttendance = jest.fn().mockResolvedValue(undefined);
const mockRefetchAttendances = jest.fn().mockResolvedValue(undefined);

function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    __typename: "Attendance",
    id: "attendance-1",
    staffId: "staff-1",
    workDate: "2024-12-25",
    startTime: null,
    endTime: null,
    rests: [],
    changeRequests: [],
    createdAt: "2024-12-25T00:00:00.000Z",
    updatedAt: "2024-12-25T00:00:00.000Z",
    ...overrides,
  };
}

// ─── Setup Helpers ────────────────────────────────────────────────────────────

type SetupOptions = {
  attendanceData?: Attendance | null;
  attendanceLoading?: boolean;
  attendanceError?: unknown;
  attendancesError?: unknown;
  calendarLoading?: boolean;
  calendarError?: unknown;
};

function setupMocks(options: SetupOptions = {}) {
  (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);

  (useGetAttendanceByStaffAndDateQuery as jest.Mock).mockReturnValue({
    data: options.attendanceData,
    isLoading: options.attendanceLoading ?? false,
    isFetching: false,
    isUninitialized: false,
    error: options.attendanceError,
    refetch: mockRefetchAttendance,
  });

  (
    useListAttendancesByDateRangeWithPlaceholdersQuery as jest.Mock
  ).mockReturnValue({
    data: { attendances: [] },
    isLoading: false,
    isFetching: false,
    isUninitialized: false,
    error: options.attendancesError,
    refetch: mockRefetchAttendances,
  });

  (useUpsertAttendanceByStaffAndDateMutation as jest.Mock).mockReturnValue([
    jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) }),
  ]);

  (useUpdateAttendanceMutation as jest.Mock).mockReturnValue([
    jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) }),
  ]);

  (useCalendars as jest.Mock).mockReturnValue({
    holidayCalendars: [],
    companyHolidayCalendars: [],
    isLoading: options.calendarLoading ?? false,
    error: options.calendarError,
  });

  (useCloseDates as jest.Mock).mockReturnValue({
    closeDates: [],
    loading: false,
  });

  (fetchStaff as jest.Mock).mockResolvedValue(MOCK_STAFF);

  (graphqlClient.graphql as jest.Mock).mockReturnValue({
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  });
}

function renderTimeRecorder(
  props: {
    onAttendanceErrorCountChange?: (n: number) => void;
    onElapsedWorkTimeChange?: (p: TimeRecorderElapsedWorkInfo) => void;
  } = {},
  authOverrides: Partial<AuthContextProps> = {},
) {
  const authValue = { ...DEFAULT_AUTH, ...authOverrides };

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }
  TestWrapper.displayName = "TestWrapper";

  return render(<TimeRecorder {...props} />, { wrapper: TestWrapper });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe("TimeRecorder", () => {
  // ── Loading States ──────────────────────────────────────────────────────────
  describe("ローディング状態", () => {
    it("出勤情報取得中はローディングビューを表示する", () => {
      setupMocks({ attendanceLoading: true });
      renderTimeRecorder();

      expect(screen.getByTestId("time-recorder-loading")).toBeInTheDocument();
      expect(
        screen.queryByTestId("time-recorder-view"),
      ).not.toBeInTheDocument();
    });

    it("カレンダー取得中はローディングビューを表示する", () => {
      setupMocks({ calendarLoading: true });
      renderTimeRecorder();

      expect(screen.getByTestId("time-recorder-loading")).toBeInTheDocument();
    });

    it("workStatus が確定するまでローディングビューを表示する（初期状態）", () => {
      // isUninitialized=true → attendanceLoading=true → loading view
      (useGetAttendanceByStaffAndDateQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetching: false,
        isUninitialized: true,
        error: undefined,
        refetch: mockRefetchAttendance,
      });
      renderTimeRecorder();

      expect(screen.getByTestId("time-recorder-loading")).toBeInTheDocument();
    });

    it("cognitoUser がない場合はローディングビューを表示する", () => {
      renderTimeRecorder({}, { cognitoUser: undefined });

      // !shouldFetchAttendance → attendanceLoading = true
      expect(screen.getByTestId("time-recorder-loading")).toBeInTheDocument();
    });
  });

  // ── Work Status Rendering ────────────────────────────────────────────────────
  describe("勤務状態別レンダリング", () => {
    it("出勤データなし（出勤前）の場合、BEFORE_WORK を表示する", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("time-recorder-view")).toBeInTheDocument();
      });
      expect(screen.getByTestId("ctx-work-status")).toHaveTextContent(
        "BEFORE_WORK",
      );
    });

    it("startTime のみある場合、WORKING を表示する", async () => {
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T09:00:00.000Z",
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-work-status")).toHaveTextContent(
          "WORKING",
        );
      });
    });

    it("進行中の休憩がある場合、RESTING を表示する", async () => {
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T09:00:00.000Z",
          rests: [
            {
              __typename: "Rest",
              startTime: "2024-12-25T12:00:00.000Z",
              endTime: null,
            },
          ],
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-work-status")).toHaveTextContent(
          "RESTING",
        );
      });
    });

    it("startTime と endTime がある場合、LEFT_WORK を表示する", async () => {
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T09:00:00.000Z",
          endTime: "2024-12-25T18:00:00.000Z",
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-work-status")).toHaveTextContent(
          "LEFT_WORK",
        );
      });
    });
  });

  // ── Button Click Handlers ────────────────────────────────────────────────────
  describe("打刻ボタン操作", () => {
    it("出勤ボタンクリックで clockInCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-clock-in")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-clock-in"));

      expect(clockInCallback).toHaveBeenCalled();
    });

    it("退勤ボタンクリックで clockOutCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-clock-out")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-clock-out"));

      expect(clockOutCallback).toHaveBeenCalled();
    });

    it("休憩開始ボタンクリックで restStartCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-rest-start")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-rest-start"));

      expect(restStartCallback).toHaveBeenCalled();
    });

    it("休憩終了ボタンクリックで restEndCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-rest-end")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-rest-end"));

      expect(restEndCallback).toHaveBeenCalled();
    });

    it("直行ボタンクリックで goDirectlyCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-go-directly")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-go-directly"));

      expect(goDirectlyCallback).toHaveBeenCalled();
    });

    it("直帰ボタンクリックで returnDirectlyCallback を呼び出す", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-return-directly")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId("btn-return-directly"));

      expect(returnDirectlyCallback).toHaveBeenCalled();
    });
  });

  // ── Direct Mode Toggle ───────────────────────────────────────────────────────
  describe("直行/直帰モード切替", () => {
    it("初期状態では directMode は false である", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-direct-mode")).toBeInTheDocument();
      });
      expect(screen.getByTestId("ctx-direct-mode")).toHaveTextContent("false");
    });

    it("トグルボタンクリックで directMode が true に切り替わる", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-toggle-direct")).toBeInTheDocument();
      });

      expect(screen.getByTestId("ctx-direct-mode")).toHaveTextContent("false");
      await userEvent.click(screen.getByTestId("btn-toggle-direct"));
      expect(screen.getByTestId("ctx-direct-mode")).toHaveTextContent("true");
    });

    it("2 回トグルすると directMode が false に戻る", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("btn-toggle-direct")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("btn-toggle-direct"));
      expect(screen.getByTestId("ctx-direct-mode")).toHaveTextContent("true");

      await userEvent.click(screen.getByTestId("btn-toggle-direct"));
      expect(screen.getByTestId("ctx-direct-mode")).toHaveTextContent("false");
    });
  });

  // ── Error Notifications ──────────────────────────────────────────────────────
  describe("エラー通知", () => {
    it("出勤情報取得エラー時に通知をディスパッチする", async () => {
      setupMocks({ attendanceError: new Error("attendance fetch failed") });
      renderTimeRecorder();

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: "notification/push" }),
        );
      });
      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });

    it("出勤一覧取得エラー時に通知をディスパッチする", async () => {
      setupMocks({ attendancesError: new Error("attendances fetch failed") });
      renderTimeRecorder();

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: "notification/push" }),
        );
      });
      expect(pushNotification).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });

    it("カレンダー取得エラー時に通知をディスパッチする", async () => {
      setupMocks({ calendarError: new Error("calendar error") });
      renderTimeRecorder();

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: "notification/push" }),
        );
      });
    });
  });

  // ── Clock Display Texts ──────────────────────────────────────────────────────
  describe("打刻時刻テキスト表示", () => {
    it("startTime がある場合、clockInDisplayText に出勤時刻テキストが設定される", async () => {
      // 2024-12-25T00:00:00.000Z = 09:00 JST (UTC+9)
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T00:00:00.000Z",
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-clock-in-text")).toHaveTextContent(
          "09:00 出勤",
        );
      });
    });

    it("endTime がある場合、clockOutDisplayText に退勤時刻テキストが設定される", async () => {
      // 2024-12-25T09:00:00.000Z = 18:00 JST (UTC+9)
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T00:00:00.000Z",
          endTime: "2024-12-25T09:00:00.000Z",
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-clock-out-text")).toHaveTextContent(
          "18:00 退勤",
        );
      });
    });

    it("startTime がない場合、clockInDisplayText は空になる", async () => {
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("time-recorder-view")).toBeInTheDocument();
      });
      expect(screen.getByTestId("ctx-clock-in-text")).toHaveTextContent("");
    });
  });

  // ── Change Request ───────────────────────────────────────────────────────────
  describe("変更リクエスト状態", () => {
    it("未完了の変更リクエストがある場合、hasChangeRequest が true になる", async () => {
      setupMocks({
        attendanceData: makeAttendance({
          changeRequests: [
            {
              __typename: "AttendanceChangeRequest",
              completed: false,
              startTime: null,
              endTime: null,
              rests: null,
              remarks: null,
            },
          ],
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-has-change-request")).toHaveTextContent(
          "true",
        );
      });
    });

    it("完了済みの変更リクエストのみの場合、hasChangeRequest が false になる", async () => {
      setupMocks({
        attendanceData: makeAttendance({
          changeRequests: [
            {
              __typename: "AttendanceChangeRequest",
              completed: true,
              startTime: null,
              endTime: null,
              rests: null,
              remarks: null,
            },
          ],
        }),
      });
      renderTimeRecorder();

      await waitFor(() => {
        expect(screen.getByTestId("ctx-has-change-request")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  // ── Callback Props ───────────────────────────────────────────────────────────
  describe("コールバック props", () => {
    it("onAttendanceErrorCountChange が 0 で呼び出される", async () => {
      const onAttendanceErrorCountChange = jest.fn();
      renderTimeRecorder({ onAttendanceErrorCountChange });

      await waitFor(() => {
        expect(onAttendanceErrorCountChange).toHaveBeenCalledWith(0);
      });
    });

    it("onElapsedWorkTimeChange が経過作業情報とともに呼び出される", async () => {
      const onElapsedWorkTimeChange = jest.fn();
      renderTimeRecorder({ onElapsedWorkTimeChange });

      await waitFor(() => {
        expect(onElapsedWorkTimeChange).toHaveBeenCalledWith(
          expect.objectContaining({
            visible: expect.any(Boolean),
            workDurationLabel: expect.any(String),
            restDurationLabel: expect.any(String),
          }),
        );
      });
    });

    it("勤務中の場合、onElapsedWorkTimeChange の visible が true になる", async () => {
      const onElapsedWorkTimeChange = jest.fn();
      setupMocks({
        attendanceData: makeAttendance({
          startTime: "2024-12-25T09:00:00.000Z",
        }),
      });
      renderTimeRecorder({ onElapsedWorkTimeChange });

      await waitFor(() => {
        expect(onElapsedWorkTimeChange).toHaveBeenCalledWith(
          expect.objectContaining({ visible: true }),
        );
      });
    });
  });
});
