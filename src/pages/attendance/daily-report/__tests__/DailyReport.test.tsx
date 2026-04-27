import { AuthContext } from "@app/providers/auth/AuthContext";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { DailyReportStatus } from "@shared/api/graphql/types";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import DailyReport from "../DailyReport";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: jest.fn(),
}));

const mockUseCognitoUser = jest.fn();
jest.mock("@entities/staff/model/useCognitoUser", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCognitoUser(...args),
}));

const mockFetchStaff = jest.fn();
jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetchStaff(...args),
}));

const mockUseStaffs = jest.fn();
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  ...jest.requireActual("@entities/staff/model/useStaffs/useStaffs"),
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

const mockNotify = jest.fn();
jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({ notify: mockNotify }),
}));

jest.mock(
  "@features/attendance/daily-report/lib/sendDailyReportSubmissionNotification",
  () => ({
    sendDailyReportSubmissionNotification: jest
      .fn()
      .mockResolvedValue(undefined),
  }),
);

jest.mock("@entities/operation-log/model/dailyReportOperationLog", () => ({
  logDailyReportMutation: jest.fn().mockResolvedValue(undefined),
}));

// Stub heavy sub-components to isolate DailyReport logic
jest.mock("@features/attendance/daily-report", () => ({
  DailyReportCalendar: ({
    onChange,
  }: {
    value: unknown;
    onChange: (v: unknown) => void;
    reportedDateSet: Set<string>;
  }) => (
    <button
      type="button"
      data-testid="calendar"
      onClick={() => onChange(dayjs("2024-06-15"))}
    >
      calendar
    </button>
  ),
  DailyReportFormFields: ({
    form,
    onChange,
  }: {
    form: { title: string; content: string; date: string; author: string };
    onChange: (field: string, value: string) => void;
  }) => (
    <div>
      <input
        data-testid="title-input"
        value={form.title}
        onChange={(e) => onChange("title", e.target.value)}
        aria-label="タイトル"
      />
      <textarea
        data-testid="content-input"
        value={form.content}
        onChange={(e) => onChange("content", e.target.value)}
        aria-label="内容"
      />
    </div>
  ),
  DailyReportFormChangeHandler: jest.fn(),
}));

jest.mock("@shared/ui/layout", () => ({
  DashboardInnerSurface: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  PageContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  PageSection: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@shared/ui/page/Page", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="page">{children}</div>
  ),
}));

jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn(() => ({})),
  getGraphQLErrorMessage: jest.fn(
    (_errors: unknown, fallback: string) => fallback,
  ),
  getNextVersion: jest.fn((v: number) => (v ?? 0) + 1),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const graphqlClientMock = graphqlClient as jest.Mocked<typeof graphqlClient>;
const { useSearchParams } = jest.requireMock("react-router-dom") as {
  useSearchParams: jest.Mock;
};

function buildStaff(overrides: Record<string, unknown> = {}) {
  return {
    id: "staff-1",
    cognitoUserId: "cognito-1",
    familyName: "山田",
    givenName: "太郎",
    mailAddress: "yamada@example.com",
    owner: false,
    role: "STAFF",
    enabled: true,
    status: "CONFIRMED",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

// Use today's date so the report's date always matches the calendar's default date
const TODAY = dayjs().format("YYYY-MM-DD");

function buildDailyReportRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    staffId: "staff-1",
    reportDate: TODAY,
    title: "今日の日報",
    content: "作業内容",
    status: DailyReportStatus.DRAFT,
    updatedAt: `${TODAY}T12:00:00.000Z`,
    createdAt: `${TODAY}T10:00:00.000Z`,
    version: 1,
    reactions: [],
    comments: [],
    ...overrides,
  };
}

function buildAuthContext(overrides: Record<string, unknown> = {}) {
  return {
    session: { roles: [] },
    signOut: jest.fn(),
    signIn: jest.fn(),
    hasRole: jest.fn(() => false),
    isCognitoUserRole: jest.fn(() => false),
    isAuthenticated: true,
    isLoading: false,
    authStatus: "authenticated" as const,
    ...overrides,
  };
}

interface WrapperProps {
  children: ReactNode;
  authContext?: ReturnType<typeof buildAuthContext>;
}

function Wrapper({ children, authContext }: WrapperProps) {
  const ctx = authContext ?? buildAuthContext();
  return (
    <MemoryRouter>
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    </MemoryRouter>
  );
}

function renderDailyReport(authContext?: ReturnType<typeof buildAuthContext>) {
  return render(
    <Wrapper authContext={authContext}>
      <DailyReport />
    </Wrapper>,
  );
}

// Convenience: fire a click and flush React state/effects
async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

// ─── Default mock setup ───────────────────────────────────────────────────────

function buildCognitoUser() {
  return {
    id: "cognito-1",
    givenName: "太郎",
    familyName: "山田",
    mailAddress: "yamada@example.com",
    owner: false,
    roles: [],
  };
}

function setupDefaultMocks(staffOverrides: Record<string, unknown> = {}) {
  const setSearchParamsMock = jest.fn();
  useSearchParams.mockReturnValue([new URLSearchParams(), setSearchParamsMock]);

  mockUseCognitoUser.mockReturnValue({
    cognitoUser: buildCognitoUser(),
    loading: false,
  });

  mockFetchStaff.mockResolvedValue(buildStaff(staffOverrides));
  mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });

  (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
    data: { dailyReportsByStaffId: { items: [], nextToken: null } },
    errors: undefined,
  });

  return { setSearchParamsMock };
}

function setupWithReports(
  reports: ReturnType<typeof buildDailyReportRecord>[],
) {
  const setSearchParamsMock = jest.fn();
  useSearchParams.mockReturnValue([new URLSearchParams(), setSearchParamsMock]);

  mockUseCognitoUser.mockReturnValue({
    cognitoUser: buildCognitoUser(),
    loading: false,
  });

  mockFetchStaff.mockResolvedValue(buildStaff());
  mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });

  (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
    data: { dailyReportsByStaffId: { items: reports, nextToken: null } },
    errors: undefined,
  });

  return { setSearchParamsMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // resetAllMocks clears ALL mock implementations including Once queues,
  // preventing mock pollution between tests
  jest.resetAllMocks();

  // Re-stub mocks reset by resetAllMocks
  const { logDailyReportMutation } = jest.requireMock(
    "@entities/operation-log/model/dailyReportOperationLog",
  ) as { logDailyReportMutation: jest.Mock };
  logDailyReportMutation.mockResolvedValue(undefined);

  const { sendDailyReportSubmissionNotification } = jest.requireMock(
    "@features/attendance/daily-report/lib/sendDailyReportSubmissionNotification",
  ) as { sendDailyReportSubmissionNotification: jest.Mock };
  sendDailyReportSubmissionNotification.mockResolvedValue(undefined);

  const concurrency = jest.requireMock(
    "@shared/api/graphql/concurrency",
  ) as {
    buildVersionOrUpdatedAtCondition: jest.Mock;
    getGraphQLErrorMessage: jest.Mock;
    getNextVersion: jest.Mock;
  };
  concurrency.buildVersionOrUpdatedAtCondition.mockReturnValue({});
  concurrency.getGraphQLErrorMessage.mockImplementation(
    (_errors: unknown, fallback: string) => fallback,
  );
  concurrency.getNextVersion.mockImplementation((v: number) => (v ?? 0) + 1);
});

// ── Loading state ──────────────────────────────────────────────────────────

describe("Loading state", () => {
  it("renders page structure while cognitoUser is loading", () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({ cognitoUser: null, loading: true });
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    expect(screen.getByTestId("page")).toBeInTheDocument();
    expect(screen.getByText("日報")).toBeInTheDocument();
  });

  it("renders page structure when cognitoUser is undefined and loading", () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({ cognitoUser: undefined, loading: true });
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    expect(screen.getByTestId("page")).toBeInTheDocument();
  });

  it("shows NoReportSection after data resolves with no reports", async () => {
    setupDefaultMocks();
    renderDailyReport();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "日報を作成する" }),
      ).toBeInTheDocument();
    });
  });
});

// ── No staff state ─────────────────────────────────────────────────────────

describe("No staff state", () => {
  it("shows NoReportSection when cognitoUser is null", async () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({ cognitoUser: null, loading: false });
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "日報を作成する" }),
      ).toBeInTheDocument();
    });
  });

  it("shows NoReportSection when fetchStaff returns undefined", async () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockResolvedValue(undefined);
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "日報を作成する" }),
      ).toBeInTheDocument();
    });
  });
});

// ── Page structure ─────────────────────────────────────────────────────────

describe("Page structure", () => {
  it("renders the hero title 日報", () => {
    setupDefaultMocks();
    renderDailyReport();
    expect(screen.getByText("日報")).toBeInTheDocument();
  });

  it("renders the calendar widget after data loads", async () => {
    setupDefaultMocks();
    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByTestId("calendar")).toBeInTheDocument();
    });
  });

  it("renders 日付を選択 label", () => {
    setupDefaultMocks();
    renderDailyReport();
    expect(screen.getByText("日付を選択")).toBeInTheDocument();
  });
});

// ── Hero section interaction ───────────────────────────────────────────────

describe("Hero section", () => {
  it("toggles description expansion when もっと見る is clicked", async () => {
    setupDefaultMocks();
    renderDailyReport();

    const toggleBtn = screen.getByRole("button", { name: "もっと見る" });
    await click(toggleBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "閉じる" }),
      ).toBeInTheDocument();
    });
  });

  it("collapses description when 閉じる is clicked", async () => {
    setupDefaultMocks();
    renderDailyReport();

    await click(screen.getByRole("button", { name: "もっと見る" }));
    await click(await screen.findByRole("button", { name: "閉じる" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "もっと見る" }),
      ).toBeInTheDocument();
    });
  });
});

// ── Create mode ────────────────────────────────────────────────────────────

describe("Create mode", () => {
  async function openCreateMode() {
    setupDefaultMocks();
    renderDailyReport();

    const btn = await screen.findByRole("button", { name: "日報を作成する" });
    await click(btn);
    return btn;
  }

  it("enters create mode when 日報を作成する is clicked", async () => {
    await openCreateMode();

    await waitFor(() => {
      expect(screen.getByText("新しい日報を登録")).toBeInTheDocument();
    });
  });

  it("shows form inputs in create mode", async () => {
    await openCreateMode();

    await waitFor(() => {
      expect(screen.getByTestId("title-input")).toBeInTheDocument();
      expect(screen.getByTestId("content-input")).toBeInTheDocument();
    });
  });

  it("shows 下書き保存 and 提出する buttons in create mode", async () => {
    await openCreateMode();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "下書き保存" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "提出する" }),
      ).toBeInTheDocument();
    });
  });

  it("shows the not-yet-submitted warning in create mode", async () => {
    await openCreateMode();

    await waitFor(() => {
      expect(screen.getByText(/まだ提出されていません/)).toBeInTheDocument();
    });
  });
});

// ── Create form submission ─────────────────────────────────────────────────

describe("Create form submission", () => {
  async function renderInCreateMode() {
    setupDefaultMocks();
    renderDailyReport();

    const btn = await screen.findByRole("button", { name: "日報を作成する" });
    await click(btn);

    await waitFor(() => {
      expect(screen.getByText("新しい日報を登録")).toBeInTheDocument();
    });
  }

  it("disables submit buttons when staffId cannot be resolved", async () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockResolvedValue(undefined); // no staff found
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await click(
      await screen.findByRole("button", { name: "日報を作成する" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "下書き保存" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "提出する" })).toBeDisabled();
    });
  });

  it("calls createDailyReport with SUBMITTED status on 提出する click", async () => {
    await renderInCreateMode();

    const createdReport = buildDailyReportRecord({
      id: "new-report-1",
      status: DailyReportStatus.SUBMITTED,
    });
    (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
      data: { createDailyReport: createdReport },
      errors: undefined,
    });

    const submitBtn = screen.getByRole("button", { name: "提出する" });
    expect(submitBtn).not.toBeDisabled();
    await click(submitBtn);

    await waitFor(() => {
      expect(graphqlClientMock.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              staffId: "staff-1",
              status: DailyReportStatus.SUBMITTED,
            }),
          }),
          authMode: "userPool",
        }),
      );
    });
  });

  it("calls createDailyReport with DRAFT status on 下書き保存 click", async () => {
    await renderInCreateMode();

    const createdReport = buildDailyReportRecord({ id: "draft-report-1" });
    (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
      data: { createDailyReport: createdReport },
      errors: undefined,
    });

    await click(screen.getByRole("button", { name: "下書き保存" }));

    await waitFor(() => {
      expect(graphqlClientMock.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              status: DailyReportStatus.DRAFT,
            }),
          }),
          authMode: "userPool",
        }),
      );
    });
  });

  it("shows error alert when createDailyReport returns GraphQL errors", async () => {
    await renderInCreateMode();

    (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
      data: {},
      errors: [{ message: "API エラーが発生しました" }],
    });

    await click(screen.getByRole("button", { name: "提出する" }));

    await waitFor(() => {
      expect(screen.getByText(/API エラーが発生しました/)).toBeInTheDocument();
    });
  });

  it("shows error alert when createDailyReport throws a network error", async () => {
    await renderInCreateMode();

    (graphqlClientMock.graphql as jest.Mock).mockRejectedValue(
      new Error("ネットワークエラー"),
    );

    await click(screen.getByRole("button", { name: "提出する" }));

    await waitFor(() => {
      expect(screen.getByText(/ネットワークエラー/)).toBeInTheDocument();
    });
  });

  it("closes error alert when close button is clicked", async () => {
    await renderInCreateMode();

    (graphqlClientMock.graphql as jest.Mock).mockRejectedValue(
      new Error("ネットワークエラー"),
    );

    await click(screen.getByRole("button", { name: "提出する" }));

    await waitFor(() => {
      expect(screen.getByText(/ネットワークエラー/)).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole("button", { name: "閉じる" });
    await click(closeButtons[0]);

    await waitFor(() => {
      expect(
        screen.queryByText(/ネットワークエラー/),
      ).not.toBeInTheDocument();
    });
  });

  it("クリア button resets the form", async () => {
    const user = userEvent.setup();
    await renderInCreateMode();

    const titleInput = screen.getByTestId("title-input");
    await user.clear(titleInput);
    await user.type(titleInput, "カスタムタイトル");
    expect(titleInput).toHaveValue("カスタムタイトル");

    await click(screen.getByRole("button", { name: "クリア" }));

    await waitFor(() => {
      expect(
        screen.getByTestId("title-input"),
      ).not.toHaveValue("カスタムタイトル");
    });
  });
});

// ── Reports detail view ────────────────────────────────────────────────────

describe("Reports detail view", () => {
  it("renders report title when reports are loaded", async () => {
    setupWithReports([buildDailyReportRecord()]);
    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByText("今日の日報")).toBeInTheDocument();
    });
  });

  it("shows 編集 button when a DRAFT report is selected", async () => {
    setupWithReports([buildDailyReportRecord()]);
    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
    });
  });

  it("shows edit form buttons after clicking 編集", async () => {
    setupWithReports([buildDailyReportRecord()]);
    renderDailyReport();

    await click(await screen.findByRole("button", { name: "編集" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "下書き保存" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "キャンセル" }),
      ).toBeInTheDocument();
    });
  });

  it("cancels edit and returns to detail view when キャンセル is clicked", async () => {
    setupWithReports([buildDailyReportRecord()]);
    renderDailyReport();

    await click(await screen.findByRole("button", { name: "編集" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "キャンセル" }),
      ).toBeInTheDocument();
    });

    await click(screen.getByRole("button", { name: "キャンセル" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "キャンセル" }),
      ).not.toBeInTheDocument();
    });
  });
});

// ── Edit form submission ───────────────────────────────────────────────────

describe("Edit form submission", () => {
  function setupForEdit() {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockResolvedValue(buildStaff());
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });
  }

  it("calls updateDailyReport API when 下書き保存 clicked in edit mode", async () => {
    setupForEdit();

    const report = buildDailyReportRecord();
    const updatedReport = buildDailyReportRecord({ title: "更新済タイトル" });

    (graphqlClientMock.graphql as jest.Mock)
      .mockResolvedValueOnce({
        data: { dailyReportsByStaffId: { items: [report], nextToken: null } },
        errors: undefined,
      })
      .mockResolvedValueOnce({
        data: { updateDailyReport: updatedReport },
        errors: undefined,
      });

    renderDailyReport();

    await click(await screen.findByRole("button", { name: "編集" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "下書き保存" }),
      ).toBeInTheDocument();
    });

    await click(screen.getByRole("button", { name: "下書き保存" }));

    await waitFor(() => {
      expect(graphqlClientMock.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              id: "report-1",
              status: DailyReportStatus.DRAFT,
            }),
          }),
          authMode: "userPool",
        }),
      );
    });
  });

  it("shows error alert when updateDailyReport API throws", async () => {
    setupForEdit();

    const report = buildDailyReportRecord();

    (graphqlClientMock.graphql as jest.Mock)
      .mockResolvedValueOnce({
        data: { dailyReportsByStaffId: { items: [report], nextToken: null } },
        errors: undefined,
      })
      .mockRejectedValueOnce(new Error("更新に失敗しました"));

    renderDailyReport();

    await click(await screen.findByRole("button", { name: "編集" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "下書き保存" }),
      ).toBeInTheDocument();
    });

    await click(screen.getByRole("button", { name: "下書き保存" }));

    await waitFor(() => {
      expect(screen.getByText(/更新に失敗しました/)).toBeInTheDocument();
    });
  });

  it("disables 提出する button for SUBMITTED reports", async () => {
    setupWithReports([
      buildDailyReportRecord({ status: DailyReportStatus.SUBMITTED }),
    ]);

    renderDailyReport();

    await click(await screen.findByRole("button", { name: "編集" }));

    await waitFor(() => {
      const submitBtn = screen.getByRole("button", { name: "提出する" });
      expect(submitBtn).toBeDisabled();
    });
  });
});

// ── Calendar interaction ───────────────────────────────────────────────────

describe("Calendar interaction", () => {
  it("updates search params when calendar date is changed", async () => {
    const { setSearchParamsMock } = setupDefaultMocks();
    renderDailyReport();

    await click(await screen.findByTestId("calendar"));

    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalledWith({ date: "2024-06-15" });
    });
  });
});

// ── Request error handling ─────────────────────────────────────────────────

describe("Request error handling", () => {
  function setupForError() {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockResolvedValue(buildStaff());
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });
  }

  it("shows request error alert when fetchReports throws", async () => {
    setupForError();
    (graphqlClientMock.graphql as jest.Mock).mockRejectedValue(
      new Error("データ取得エラー"),
    );

    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByText(/データ取得エラー/)).toBeInTheDocument();
    });
  });

  it("dismisses request error alert when close button is clicked", async () => {
    setupForError();
    (graphqlClientMock.graphql as jest.Mock).mockRejectedValue(
      new Error("データ取得エラー"),
    );

    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByText(/データ取得エラー/)).toBeInTheDocument();
    });

    await click(screen.getByRole("button", { name: "閉じる" }));

    await waitFor(() => {
      expect(
        screen.queryByText(/データ取得エラー/),
      ).not.toBeInTheDocument();
    });
  });

  it("shows error text when API response contains GraphQL errors", async () => {
    setupForError();
    (graphqlClientMock.graphql as jest.Mock).mockResolvedValue({
      data: {},
      errors: [{ message: "GraphQL エラー" }],
    });

    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByText(/GraphQL エラー/)).toBeInTheDocument();
    });
  });
});

// ── URL param initialization ───────────────────────────────────────────────

describe("URL param initialization", () => {
  it("reads date from URL params and shows it in the summary header", async () => {
    useSearchParams.mockReturnValue([
      new URLSearchParams("date=2025-03-10"),
      jest.fn(),
    ]);
    mockUseCognitoUser.mockReturnValue({ cognitoUser: null, loading: false });
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await waitFor(() => {
      expect(screen.getByText("2025年03月10日")).toBeInTheDocument();
    });
  });

  it("sets search params to today when no date param is present", async () => {
    const setSearchParamsMock = jest.fn();
    useSearchParams.mockReturnValue([
      new URLSearchParams(),
      setSearchParamsMock,
    ]);
    mockUseCognitoUser.mockReturnValue({ cognitoUser: null, loading: false });
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await waitFor(() => {
      expect(setSearchParamsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
        { replace: true },
      );
    });
  });
});

// ── Author name resolution ─────────────────────────────────────────────────

describe("Author name resolution", () => {
  it("calls fetchStaff with the cognitoUser id", async () => {
    setupDefaultMocks();
    renderDailyReport();

    await waitFor(() => {
      expect(mockFetchStaff).toHaveBeenCalledWith("cognito-1");
    });
  });

  it("falls back to NoReportSection when fetchStaff throws", async () => {
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockRejectedValue(new Error("fetchStaff failed"));
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false });

    renderDailyReport();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "日報を作成する" }),
      ).toBeInTheDocument();
    });
  });
});

// ── Pagination ─────────────────────────────────────────────────────────────

describe("Pagination", () => {
  it("fetches all pages when nextToken is returned", async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    const report1 = buildDailyReportRecord({ id: "r1", reportDate: today });
    const report2 = buildDailyReportRecord({
      id: "r2",
      reportDate: yesterday,
      title: "昨日の日報",
    });

    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseCognitoUser.mockReturnValue({
      cognitoUser: buildCognitoUser(),
      loading: false,
    });
    mockFetchStaff.mockResolvedValue(buildStaff());
    mockUseStaffs.mockReturnValue({ staffs: [], loading: false, error: null });

    (graphqlClientMock.graphql as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          dailyReportsByStaffId: { items: [report1], nextToken: "token-abc" },
        },
        errors: undefined,
      })
      .mockResolvedValueOnce({
        data: {
          dailyReportsByStaffId: { items: [report2], nextToken: null },
        },
        errors: undefined,
      });

    renderDailyReport();

    // Both pages fetched
    await waitFor(() => {
      const calls = (graphqlClientMock.graphql as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });

    // Today's report (most recent) is auto-selected and displayed
    await waitFor(() => {
      expect(screen.getByText("今日の日報")).toBeInTheDocument();
    });
  });
});
