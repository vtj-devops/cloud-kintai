import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
// ─── Re-import mocked modules to allow per-test overrides ────────────────────
import { useDeleteAttendanceMutation,useLazyGetAttendanceByIdQuery } from "@entities/attendance/api/attendanceApi";
// ─── Type helpers ─────────────────────────────────────────────────────────────
import type { AttendanceDaily, DuplicateAttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import useAttendanceDailyMock from "@entities/attendance/model/useAttendanceDaily";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import React from "react";
import { useParams } from "react-router-dom";

import { useAttendanceDailyFetch } from "../../model/useAttendanceDailyFetch";
import AttendanceDailyList from "../AttendanceDailyList";

// ─── Mock: styles ──────────────────────────────────────────────────────────────
jest.mock("../styles.scss", () => ({}));

// ─── Mock: sub-components ─────────────────────────────────────────────────────
jest.mock("../ActionsTableCell", () => ({
  ActionsTableCell: (_props: unknown) => <td data-testid="actions-cell" />,
}));

jest.mock("../StartTimeTableCell", () => ({
  StartTimeTableCell: (_props: unknown) => <td data-testid="start-time-cell">09:00</td>,
}));

jest.mock("../EndTimeTableCell", () => ({
  EndTimeTableCell: (_props: unknown) => <td data-testid="end-time-cell">18:00</td>,
}));

jest.mock("../MoveDateItem", () => {
  const MockMoveDateItem = (_props: unknown) => (
    <div data-testid="move-date-item">date-nav</div>
  );
  MockMoveDateItem.displayName = "MockMoveDateItem";
  return { __esModule: true, default: MockMoveDateItem };
});

// ─── Mock: entities/attendance ───────────────────────────────────────────────
jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useDeleteAttendanceMutation: jest.fn(() => [jest.fn()]),
  useLazyGetAttendanceByIdQuery: jest.fn(() => [jest.fn()]),
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: {
    DataFormat: "YYYY-MM-DD",
    DisplayFormat: "YYYY/MM/DD",
    QueryParamFormat: "YYYYMMDD",
    DatePickerFormat: "YYYY/MM/DD(ddd)",
  },
}));

jest.mock("@entities/attendance/model/useAttendanceDaily", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ─── Mock: entities/calendar ─────────────────────────────────────────────────
jest.mock("@entities/calendar/model/useCalendars", () => ({
  useCalendars: jest.fn(),
}));

// ─── Mock: entities/staff ────────────────────────────────────────────────────
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: jest.fn(),
}));

// ─── Mock: shared/lib/store ──────────────────────────────────────────────────
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({ type: "notification/push", payload })),
}));

// ─── Mock: shared/ui/button ──────────────────────────────────────────────────
jest.mock("@shared/ui/button", () => ({
  AppButton: ({ children, onClick, ...rest }: React.PropsWithChildren<{ onClick?: React.MouseEventHandler; type?: "button" | "submit" | "reset" }>) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  AppIconButton: ({ children, onClick, ...rest }: React.PropsWithChildren<{ onClick?: React.MouseEventHandler; "aria-label"?: string }>) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

// ─── Mock: react-redux ───────────────────────────────────────────────────────
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

// ─── Mock: react-router-dom ──────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(() => ({ targetWorkDate: "20240115" })),
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// ─── Mock: feature local modules ─────────────────────────────────────────────
jest.mock("../../lib/overtimeUtils", () => ({
  formatMinutesToHHmm: jest.fn(() => "01:30"),
}));

jest.mock("../../model/useAttendanceDailyFetch", () => ({
  useAttendanceDailyFetch: jest.fn(),
}));

// ─── Mock: @/errors ──────────────────────────────────────────────────────────
jest.mock("@/errors", () => ({
  E00001: { code: "E00001", message: "データ取得中に問題が発生しました" },
}));

// ─── Mock: MUI icons ─────────────────────────────────────────────────────────
jest.mock("@mui/icons-material/Search", () => ({
  __esModule: true,
  default: () => <span data-testid="search-icon" />,
}));

const useAttendanceDailyFn = useAttendanceDailyMock as jest.Mock;
const useCalendarsFn = useCalendars as jest.Mock;
const useStaffsFn = useStaffs as jest.Mock;
const useAttendanceDailyFetchFn = useAttendanceDailyFetch as jest.Mock;
const useLazyGetAttendanceByIdQueryFn = useLazyGetAttendanceByIdQuery as jest.Mock;
const useDeleteAttendanceMutationFn = useDeleteAttendanceMutation as jest.Mock;
const useParamsFn = useParams as jest.Mock;

// ─── Factories ────────────────────────────────────────────────────────────────
function makeAttendanceDaily(overrides: Partial<AttendanceDaily> = {}): AttendanceDaily {
  return {
    sub: "staff-001",
    givenName: "太郎",
    familyName: "山田",
    sortKey: "yamada",
    attendance: null,
    ...overrides,
  };
}

function makeDuplicate(overrides: Partial<DuplicateAttendanceDaily> = {}): DuplicateAttendanceDaily {
  return {
    staffId: "staff-001",
    staffName: "山田 太郎",
    workDate: "2024-01-15",
    ids: ["id-1", "id-2"],
    ...overrides,
  };
}

const DEFAULT_FETCH_RESULT = {
  attendanceMap: {},
  attendanceLoadingMap: {},
  attendanceErrorMap: {},
  duplicateSummaryMap: {},
  getAttendanceForDisplayDate: jest.fn(() => null),
  overtimeMinutesMap: {},
  getOvertimeMinutes: jest.fn(() => 90),
  summaryDuplicateList: [],
  mergedDuplicateAttendances: [],
  duplicateInfoByStaff: {},
};

// ─── Auth / AppConfig context values ─────────────────────────────────────────
const mockGetEndTime = jest.fn(() => dayjs("2024-01-15T18:00:00"));

const authContextValue = {
  authStatus: "authenticated" as const,
  session: { roles: [] },
  signOut: jest.fn(),
  signIn: jest.fn(),
  isCognitoUserRole: jest.fn(() => false),
};

const appConfigContextValue = {
  getEndTime: mockGetEndTime,
  // Provide required minimal context shape — add more if needed
} as unknown as React.ContextType<typeof AppConfigContext>;

// ─── Wrapper ──────────────────────────────────────────────────────────────────
function Wrapper({ children }: React.PropsWithChildren) {
  return (
    <AuthContext.Provider value={authContextValue}>
      <AppConfigContext.Provider value={appConfigContextValue}>
        {children}
      </AppConfigContext.Provider>
    </AuthContext.Provider>
  );
}
Wrapper.displayName = "TestWrapper";

function renderComponent() {
  return render(<AttendanceDailyList />, { wrapper: Wrapper });
}

// ─── Setup defaults before each test ─────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  useParamsFn.mockReturnValue({ targetWorkDate: "20240115" });

  useStaffsFn.mockReturnValue({
    staffs: [],
    loading: false,
    error: null,
  });

  useAttendanceDailyFn.mockReturnValue({
    attendanceDailyList: [],
    error: null,
    loading: false,
    duplicateAttendances: [],
    loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
  });

  useCalendarsFn.mockReturnValue({
    holidayCalendars: [],
    companyHolidayCalendars: [],
    isLoading: false,
    error: null,
  });

  useAttendanceDailyFetchFn.mockReturnValue({
    ...DEFAULT_FETCH_RESULT,
    getAttendanceForDisplayDate: jest.fn(() => null),
    getOvertimeMinutes: jest.fn(() => 90),
  });

  useLazyGetAttendanceByIdQueryFn.mockReturnValue([jest.fn().mockResolvedValue({ data: null })]);
  useDeleteAttendanceMutationFn.mockReturnValue([jest.fn().mockResolvedValue({})]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AttendanceDailyList", () => {
  describe("基本レンダリング", () => {
    it("コンポーネントが正常にレンダリングされる", () => {
      renderComponent();
      expect(screen.getByTestId("move-date-item")).toBeInTheDocument();
    });

    it("日付ナビゲーションコンポーネントが表示される", () => {
      renderComponent();
      expect(screen.getByTestId("move-date-item")).toBeInTheDocument();
    });

    it("スタッフ名検索ボタンが表示される", () => {
      renderComponent();
      expect(screen.getByRole("button", { name: "スタッフ名検索を表示" })).toBeInTheDocument();
    });

    it("勤怠テーブルのヘッダーが表示される", () => {
      renderComponent();
      expect(screen.getByText("氏名")).toBeInTheDocument();
      expect(screen.getByText("出勤時刻")).toBeInTheDocument();
      expect(screen.getByText("退勤時刻")).toBeInTheDocument();
      expect(screen.getByText("残業時間")).toBeInTheDocument();
      expect(screen.getByText("摘要")).toBeInTheDocument();
    });
  });

  describe("空データ状態", () => {
    it("勤怠データなしの場合、テーブル行が表示されない", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      // attendance-row クラスを持つ行がない
      const rows = document.querySelectorAll(".attendance-row");
      expect(rows).toHaveLength(0);
    });
  });

  describe("データ表示", () => {
    it("スタッフ名がテーブルに表示される", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });

    it("複数スタッフのデータが全て表示される", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [
          makeAttendanceDaily({ sub: "s1", familyName: "田中", givenName: "花子", sortKey: "tanaka" }),
          makeAttendanceDaily({ sub: "s2", familyName: "佐藤", givenName: "次郎", sortKey: "sato" }),
        ],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      expect(screen.getByText("田中 花子")).toBeInTheDocument();
      expect(screen.getByText("佐藤 次郎")).toBeInTheDocument();
    });

    it("ActionsTableCell・StartTimeTableCell・EndTimeTableCellがスタッフ分だけレンダリングされる", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [
          makeAttendanceDaily({ sub: "s1", sortKey: "a" }),
          makeAttendanceDaily({ sub: "s2", sortKey: "b" }),
        ],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      expect(screen.getAllByTestId("actions-cell")).toHaveLength(2);
      expect(screen.getAllByTestId("start-time-cell")).toHaveLength(2);
      expect(screen.getAllByTestId("end-time-cell")).toHaveLength(2);
    });

    it("残業時間が表示される", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      // formatMinutesToHHmm が "01:30" を返すようにモックされている
      expect(screen.getByText("01:30")).toBeInTheDocument();
    });
  });

  describe("スタッフ名フィルター", () => {
    beforeEach(() => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [
          makeAttendanceDaily({ sub: "s1", familyName: "田中", givenName: "花子", sortKey: "tanaka" }),
          makeAttendanceDaily({ sub: "s2", familyName: "佐藤", givenName: "次郎", sortKey: "sato" }),
        ],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
    });

    it("検索ボタンをクリックするとテキストフィールドが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "スタッフ名検索を表示" }));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("検索ボタンを再度クリックするとテキストフィールドが非表示になる", async () => {
      const user = userEvent.setup();
      renderComponent();
      const toggleBtn = screen.getByRole("button", { name: "スタッフ名検索を表示" });
      await user.click(toggleBtn);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      await user.click(toggleBtn);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("スタッフ名で入力すると一致するスタッフのみ表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "スタッフ名検索を表示" }));
      const input = screen.getByRole("textbox");
      await user.type(input, "田中");
      expect(screen.getByText("田中 花子")).toBeInTheDocument();
      expect(screen.queryByText("佐藤 次郎")).not.toBeInTheDocument();
    });

    it("検索をクリアすると全スタッフが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "スタッフ名検索を表示" }));
      const input = screen.getByRole("textbox");
      await user.type(input, "田中");
      expect(screen.queryByText("佐藤 次郎")).not.toBeInTheDocument();
      // 検索バーを閉じると searchName がクリアされて全員表示
      await user.click(screen.getByRole("button", { name: "スタッフ名検索を表示" }));
      expect(screen.getByText("田中 花子")).toBeInTheDocument();
      expect(screen.getByText("佐藤 次郎")).toBeInTheDocument();
    });
  });

  describe("重複データセクション", () => {
    const duplicates: DuplicateAttendanceDaily[] = [
      makeDuplicate({ staffId: "s1", staffName: "山田 太郎", workDate: "2024-01-15", ids: ["id-1", "id-2"] }),
    ];

    beforeEach(() => {
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        mergedDuplicateAttendances: duplicates,
        duplicateInfoByStaff: { "s1": duplicates },
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });
    });

    it("重複データがある場合、重複セクションのタイトルが表示される", () => {
      renderComponent();
      expect(screen.getByText(/重複データが検出されたスタッフ/)).toBeInTheDocument();
    });

    it("重複データのスタッフ名が表示される", () => {
      renderComponent();
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    });

    it("重複データの件数が表示される", () => {
      renderComponent();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("重複データがない場合、重複セクションが表示されない", () => {
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        mergedDuplicateAttendances: [],
        duplicateInfoByStaff: {},
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });
      renderComponent();
      expect(screen.queryByText(/重複データが検出されたスタッフ/)).not.toBeInTheDocument();
    });

    it("重複エラーアラートが表示される", () => {
      renderComponent();
      expect(screen.getByText(/同一日付に重複した勤怠データがあります/)).toBeInTheDocument();
    });
  });

  describe("重複データ確認ダイアログ", () => {
    const duplicates: DuplicateAttendanceDaily[] = [
      makeDuplicate({ staffId: "s1", staffName: "山田 太郎", workDate: "2024-01-15", ids: ["id-1", "id-2"] }),
    ];

    beforeEach(() => {
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        mergedDuplicateAttendances: duplicates,
        duplicateInfoByStaff: { "s1": duplicates },
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });

      const mockTrigger = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ id: "id-1", workDate: "2024-01-15", startTime: null, endTime: null }),
      });
      useLazyGetAttendanceByIdQueryFn.mockReturnValue([mockTrigger]);
    });

    it("確認ボタンをクリックするとダイアログが開く", async () => {
      const user = userEvent.setup();
      renderComponent();
      const confirmBtn = screen.getByRole("button", { name: "確認" });
      await user.click(confirmBtn);
      await waitFor(() => {
        expect(screen.getByText(/重複データ確認/)).toBeInTheDocument();
      });
    });

    it("ダイアログの閉じるボタンでダイアログが閉じる", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "確認" }));
      await waitFor(() => {
        expect(screen.getByText("閉じる")).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: "閉じる" }));
      await waitFor(() => {
        expect(screen.queryByText(/重複データ確認/)).not.toBeInTheDocument();
      });
    });

    it("ダイアログのタイトルにスタッフ名が表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "確認" }));
      await waitFor(() => {
        expect(screen.getByText(/山田 太郎/)).toBeInTheDocument();
      });
    });

    it("読み込み中はローディングメッセージが表示される", async () => {
      // triggerGetAttendanceById が resolve しない Promise を返す（永続的にローディング）
      const neverResolve = new Promise<never>(() => { /* never resolves */ });
      const mockTrigger = jest.fn().mockReturnValue({ unwrap: () => neverResolve });
      useLazyGetAttendanceByIdQueryFn.mockReturnValue([mockTrigger]);

      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "確認" }));
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });
  });

  describe("申請中スタッフセクション", () => {
    it("承認待ちスタッフがいる場合、申請中セクションが表示される", () => {
      const pendingAttendance = {
        id: "att-1",
        workDate: "2024-01-15",
        startTime: "2024-01-15T09:00:00",
        endTime: null,
        changeRequests: [{ completed: false, startTime: null, endTime: null }],
      };
      const staffRow = makeAttendanceDaily({
        sub: "s1",
        familyName: "山田",
        givenName: "太郎",
      });

      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [staffRow],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });

      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        getAttendanceForDisplayDate: jest.fn(() => pendingAttendance),
        getOvertimeMinutes: jest.fn(() => 0),
      });

      renderComponent();
      expect(screen.getAllByText(/申請中のスタッフ/).length).toBeGreaterThan(0);
    });

    it("承認待ちスタッフがいない場合、申請中セクションが表示されない", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });
      renderComponent();
      expect(screen.queryByText(/申請中のスタッフ/)).not.toBeInTheDocument();
    });
  });

  describe("エラーハンドリング", () => {
    it("attendance取得エラー発生時にdispatchが呼ばれる", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [],
        error: new Error("fetch error"),
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      expect(mockDispatch).toHaveBeenCalled();
    });

    it("カレンダー取得エラー発生時にdispatchが呼ばれる", () => {
      useCalendarsFn.mockReturnValue({
        holidayCalendars: [],
        companyHolidayCalendars: [],
        isLoading: false,
        error: new Error("calendar error"),
      });
      renderComponent();
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe("useEffect: 月データのロード", () => {
    it("targetWorkDateが存在する場合にloadAttendanceDataByMonthが呼ばれる", () => {
      const mockLoad = jest.fn().mockResolvedValue(undefined);
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: mockLoad,
      });
      useParamsFn.mockReturnValue({ targetWorkDate: "20240115" });
      renderComponent();
      expect(mockLoad).toHaveBeenCalledWith("20240115");
    });

    it("targetWorkDateが未定義の場合はtodayを使ってloadAttendanceDataByMonthが呼ばれる", () => {
      const mockLoad = jest.fn().mockResolvedValue(undefined);
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: mockLoad,
      });
      useParamsFn.mockReturnValue({ targetWorkDate: undefined });
      renderComponent();
      expect(mockLoad).toHaveBeenCalled();
    });
  });

  describe("データのソート", () => {
    it("sortKeyに従ってスタッフリストがソートされる", () => {
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [
          makeAttendanceDaily({ sub: "s1", familyName: "山田", givenName: "太郎", sortKey: "yamada" }),
          makeAttendanceDaily({ sub: "s2", familyName: "阿部", givenName: "誠", sortKey: "abe" }),
        ],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      renderComponent();
      const cells = screen.getAllByText(/\s/); // スタッフ名セル
      const names = screen.getAllByText(/\s太郎|\s誠/);
      // ソート後に阿部が山田より先に来ることを確認
      const allText = document.body.textContent ?? "";
      const abeIndex = allText.indexOf("阿部 誠");
      const yamadaIndex = allText.indexOf("山田 太郎");
      expect(abeIndex).toBeLessThan(yamadaIndex);
      // suppress unused var warning
      void cells;
      void names;
    });
  });

  describe("摘要メッセージ表示", () => {
    it("有給休暇フラグがある場合、有給休暇チップが表示される", () => {
      const attendance = {
        id: "att-1",
        workDate: "2024-01-15",
        paidHolidayFlag: true,
        specialHolidayFlag: false,
        absentFlag: false,
        substituteHolidayDate: null,
        remarks: "",
      };
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        getAttendanceForDisplayDate: jest.fn(() => attendance),
        getOvertimeMinutes: jest.fn(() => 0),
      });
      renderComponent();
      expect(screen.getByText("有給休暇")).toBeInTheDocument();
    });

    it("特別休暇フラグがある場合、特別休暇チップが表示される", () => {
      const attendance = {
        id: "att-1",
        workDate: "2024-01-15",
        paidHolidayFlag: false,
        specialHolidayFlag: true,
        absentFlag: false,
        substituteHolidayDate: null,
        remarks: "",
      };
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        getAttendanceForDisplayDate: jest.fn(() => attendance),
        getOvertimeMinutes: jest.fn(() => 0),
      });
      renderComponent();
      expect(screen.getByText("特別休暇")).toBeInTheDocument();
    });

    it("欠勤フラグがある場合、欠勤チップが表示される", () => {
      const attendance = {
        id: "att-1",
        workDate: "2024-01-15",
        paidHolidayFlag: false,
        specialHolidayFlag: false,
        absentFlag: true,
        substituteHolidayDate: null,
        remarks: "",
      };
      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [makeAttendanceDaily()],
        error: null,
        loading: false,
        duplicateAttendances: [],
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        getAttendanceForDisplayDate: jest.fn(() => attendance),
        getOvertimeMinutes: jest.fn(() => 0),
      });
      renderComponent();
      expect(screen.getByText("欠勤")).toBeInTheDocument();
    });
  });

  describe("重複バッジ表示", () => {
    it("重複データを持つスタッフ行に「重複」チップが表示される", () => {
      const staffRow = makeAttendanceDaily({ sub: "s1" });
      const duplicateInfo: DuplicateAttendanceDaily[] = [
        { staffId: "s1", staffName: "山田 太郎", workDate: "2024-01-15", ids: ["id-1", "id-2"] },
      ];

      useAttendanceDailyFn.mockReturnValue({
        attendanceDailyList: [staffRow],
        error: null,
        loading: false,
        duplicateAttendances: duplicateInfo,
        loadAttendanceDataByMonth: jest.fn().mockResolvedValue(undefined),
      });

      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        mergedDuplicateAttendances: [],
        duplicateInfoByStaff: { "s1": duplicateInfo },
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });

      renderComponent();
      expect(screen.getAllByText("重複").length).toBeGreaterThan(0);
    });
  });

  describe("ダイアログ: 選択モード切替", () => {
    const duplicates: DuplicateAttendanceDaily[] = [
      makeDuplicate({ staffId: "s1", staffName: "山田 太郎" }),
    ];

    beforeEach(() => {
      useAttendanceDailyFetchFn.mockReturnValue({
        ...DEFAULT_FETCH_RESULT,
        mergedDuplicateAttendances: duplicates,
        duplicateInfoByStaff: { "s1": duplicates },
        getAttendanceForDisplayDate: jest.fn(() => null),
        getOvertimeMinutes: jest.fn(() => 0),
      });

      const record1 = { id: "id-1", workDate: "2024-01-15", startTime: "2024-01-15T09:00:00", endTime: null };
      const record2 = { id: "id-2", workDate: "2024-01-15", startTime: "2024-01-15T10:00:00", endTime: null };
      const mockTrigger = jest.fn()
        .mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue(record1) })
        .mockReturnValueOnce({ unwrap: jest.fn().mockResolvedValue(record2) });
      useLazyGetAttendanceByIdQueryFn.mockReturnValue([mockTrigger]);
    });

    it("ダイアログ内でレコード単位ボタンと項目単位ボタンが表示される", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: "確認" }));

      await waitFor(() => {
        // ToggleButton は role="button" で表示されることを確認
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText("レコード単位")).toBeInTheDocument();
        expect(within(dialog).getByText("項目単位")).toBeInTheDocument();
      });
    });
  });

  describe("targetWorkDateがない場合", () => {
    it("targetWorkDateが未定義でも正常にレンダリングされる", () => {
      useParamsFn.mockReturnValue({ targetWorkDate: undefined });
      renderComponent();
      expect(screen.getByTestId("move-date-item")).toBeInTheDocument();
    });
  });
});
