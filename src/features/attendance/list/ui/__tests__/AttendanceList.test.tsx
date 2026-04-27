import { AuthContext } from "@app/providers/auth/AuthContext";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import AttendanceTable from "../AttendanceList";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("../AttendanceList.scss", () => ({}));

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    }),
  },
}));

const mockUseListAttendancesByDateRangeQuery = jest.fn();
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useListAttendancesByDateRangeQuery: (...args: unknown[]) =>
    mockUseListAttendancesByDateRangeQuery(...args),
}));

const mockUseCalendars = jest.fn();
jest.mock("@entities/calendar/model/useCalendars", () => ({
  useCalendars: (...args: unknown[]) => mockUseCalendars(...args),
}));

const mockUseCloseDates = jest.fn();
jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCloseDates(...args),
}));

const mockFetchStaff = jest.fn();
jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetchStaff(...args),
}));

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("@shared/lib/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD", QueryParamFormat: "YYYYMMDD" },
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({ type: "pushNotification", payload })),
}));

jest.mock("@shared/api/graphql/documents/subscriptions", () => ({
  onCreateAttendance: "onCreateAttendance",
  onDeleteAttendance: "onDeleteAttendance",
  onUpdateAttendance: "onUpdateAttendance",
}));

jest.mock("@/errors", () => ({
  E00001: "E00001",
  E02001: "E02001",
}));

// Child component stubs
jest.mock("../AttendanceListHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="attendance-list-header">勤怠一覧</div>,
}));

jest.mock("../AttendanceListCard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="attendance-list-card">{children}</div>
  ),
}));

jest.mock("../DesktopList", () => ({
  __esModule: true,
  default: () => <div data-testid="desktop-list" />,
}));

jest.mock("../MobileList/MobileList", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-list" />,
}));

jest.mock("../AttendanceListContext", () => ({
  AttendanceListProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ─── Test Helpers ────────────────────────────────────────────────────────────

const mockCognitoUser = {
  id: "staff-1",
  givenName: "太郎",
  familyName: "テスト",
  mailAddress: "test@example.com",
  owner: false,
  roles: [],
  emailVerified: true,
};

const defaultAuthContext = {
  session: { roles: [] as [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  hasRole: jest.fn(() => false),
  isCognitoUserRole: jest.fn(() => false),
  isAuthenticated: true,
  isLoading: false,
  roles: [] as [],
};

const defaultAttendanceQueryResult = {
  data: [],
  isLoading: false,
  isFetching: false,
  isUninitialized: false,
  error: undefined,
  refetch: jest.fn(),
};

const defaultCalendarsResult = {
  holidayCalendars: [],
  companyHolidayCalendars: [],
  isLoading: false,
  error: null,
};

const defaultCloseDatesResult = {
  closeDates: [],
  loading: false,
  error: null,
};

function renderWithAuth(cognitoUser: typeof mockCognitoUser | null = mockCognitoUser) {
  return render(
    <AuthContext.Provider value={{ ...defaultAuthContext, cognitoUser }}>
      <AttendanceTable />
    </AuthContext.Provider>,
  );
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockUseListAttendancesByDateRangeQuery.mockReturnValue(defaultAttendanceQueryResult);
  mockUseCalendars.mockReturnValue(defaultCalendarsResult);
  mockUseCloseDates.mockReturnValue(defaultCloseDatesResult);
  mockFetchStaff.mockResolvedValue(undefined);

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AttendanceTable", () => {
  // 1. attendanceLoading=true (isLoading: true) → spinner
  it("isLoading が true のときスピナーを表示する", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      ...defaultAttendanceQueryResult,
      isLoading: true,
    });

    renderWithAuth();

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance-list-header")).not.toBeInTheDocument();
  });

  // 2. calendarLoading=true → spinner
  it("calendarLoading が true のときスピナーを表示する", () => {
    mockUseCalendars.mockReturnValue({
      ...defaultCalendarsResult,
      isLoading: true,
    });

    renderWithAuth();

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance-list-header")).not.toBeInTheDocument();
  });

  // 3. closeDatesLoading=true → spinner
  it("closeDatesLoading が true のときスピナーを表示する", () => {
    mockUseCloseDates.mockReturnValue({
      ...defaultCloseDatesResult,
      loading: true,
    });

    renderWithAuth();

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance-list-header")).not.toBeInTheDocument();
  });

  // 4. cognitoUser が null → shouldFetchAttendances=false → attendanceLoading=true → spinner
  it("cognitoUser が null のときスピナーを表示する（未認証）", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      ...defaultAttendanceQueryResult,
      isUninitialized: true,
    });

    renderWithAuth(null);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance-list-header")).not.toBeInTheDocument();
  });

  // 5. 正常表示 → attendance-list-header が表示される
  it("ローディング完了後に attendance-list-header を表示する", () => {
    renderWithAuth();

    expect(screen.getByTestId("attendance-list-header")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  // 6. デスクトップ表示 (innerWidth >= 768) → desktop-list
  it("innerWidth が 768px 以上のとき DesktopList を表示する", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    renderWithAuth();

    expect(screen.getByTestId("desktop-list")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-list")).not.toBeInTheDocument();
  });

  // 7. モバイル表示 (innerWidth < 768) → mobile-list
  it("innerWidth が 768px 未満のとき MobileList を表示する", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithAuth();

    expect(screen.getByTestId("mobile-list")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-list")).not.toBeInTheDocument();
  });

  // 8. fetchStaff が reject → dispatch(pushNotification) が呼ばれる
  it("fetchStaff が失敗したとき dispatch(pushNotification) を呼ぶ", async () => {
    mockFetchStaff.mockRejectedValue(new Error("fetch staff failed"));

    renderWithAuth();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });
  });

  // 9. calendarsError がある → dispatch(pushNotification) が呼ばれる
  it("calendarsError があるとき dispatch(pushNotification) を呼ぶ", async () => {
    mockUseCalendars.mockReturnValue({
      ...defaultCalendarsResult,
      error: new Error("calendar error"),
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });
  });

  // 10. closeDatesError がある → dispatch(pushNotification) が呼ばれる
  it("closeDatesError があるとき dispatch(pushNotification) を呼ぶ", async () => {
    mockUseCloseDates.mockReturnValue({
      ...defaultCloseDatesResult,
      error: new Error("close dates error"),
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });
  });

  // 11. attendancesError がある → dispatch(pushNotification) が呼ばれる
  it("attendancesError があるとき dispatch(pushNotification) を呼ぶ", async () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      ...defaultAttendanceQueryResult,
      error: { status: 500, error: "Server Error" },
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ tone: "error" }),
        }),
      );
    });
  });

  // 12. cognitoUser=null → skip=true → isUninitialized:true → spinner
  it("cognitoUser が null のとき useListAttendancesByDateRangeQuery が skip:true で呼ばれスピナーを表示する", () => {
    mockUseListAttendancesByDateRangeQuery.mockReturnValue({
      ...defaultAttendanceQueryResult,
      isUninitialized: true,
    });

    renderWithAuth(null);

    // skip=true のときは第2引数の skip が true になる
    expect(mockUseListAttendancesByDateRangeQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ skip: true }),
    );

    // isUninitialized=true → attendanceLoading=true → spinner 表示
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
