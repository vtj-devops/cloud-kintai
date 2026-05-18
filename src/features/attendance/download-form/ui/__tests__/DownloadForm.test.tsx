import { renderWithProviders } from "@shared/test-utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DownloadForm from "../DownloadForm";
import { createDownloadTestStaff } from "./downloadFormTestUtils";

// ─── Mock: useStaffs ─────────────────────────────────────────────────────────
const mockUseStaffs = jest.fn();
jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  ...jest.requireActual<typeof import("@entities/staff/model/useStaffs/useStaffs")>(
    "@entities/staff/model/useStaffs/useStaffs",
  ),
  useStaffs: (...args: unknown[]) => mockUseStaffs(...args),
}));

// ─── Mock: useCloseDates ─────────────────────────────────────────────────────
const mockUseCloseDates = jest.fn();
jest.mock("@entities/attendance/model/useCloseDates", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseCloseDates(...args),
}));

// ─── Mock: react-router-dom (useNavigate) ───────────────────────────────────
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual<typeof import("react-router-dom")>("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ─── Mock: AttendanceDate ────────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: {
    DataFormat: "YYYY-MM-DD",
    DisplayFormat: "YYYY/MM/DD",
    QueryParamFormat: "YYYYMMDD",
  },
}));

// ─── Mock: child components ───────────────────────────────────────────────────
jest.mock("../AggregateExportButton", () => ({
  __esModule: true,
  default: ({ workDates, selectedStaff }: { workDates: string[]; selectedStaff: unknown[] }) => (
    <button
      data-testid="aggregate-export-button"
      disabled={workDates.length === 0 || selectedStaff.length === 0}
    >
      集計ダウンロード
    </button>
  ),
}));

jest.mock("../ExportButton", () => ({
  __esModule: true,
  default: ({ workDates, selectedStaff }: { workDates: string[]; selectedStaff: unknown[] }) => (
    <button
      data-testid="export-button"
      disabled={workDates.length === 0 || selectedStaff.length === 0}
    >
      一括ダウンロード
    </button>
  ),
}));

jest.mock("../StaffSelector", () => ({
  __esModule: true,
  default: ({
    staffs,
    selectedStaff,
    setSelectedStaff,
  }: {
    staffs: unknown[];
    selectedStaff: unknown[];
    setSelectedStaff: (s: unknown[]) => void;
  }) => (
    <div data-testid="staff-selector">
      <span data-testid="staffs-count">{staffs.length}</span>
      <span data-testid="selected-count">{selectedStaff.length}</span>
      <button
        type="button"
        data-testid="select-all-staff"
        onClick={() => setSelectedStaff(staffs)}
      >
        全選択
      </button>
    </div>
  ),
}));

// ─── Mock: uiDimensions ──────────────────────────────────────────────────────
jest.mock("@shared/config/uiDimensions", () => ({
  STANDARD_PADDING: { CARD: 3, SMALL: 1 },
  SELECTOR_MAX_WIDTH: 500,
  SELECTOR_MIN_WIDTH: 300,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderForm() {
  return renderWithProviders(<DownloadForm />);
}

const defaultStaffsResult = {
  staffs: [createDownloadTestStaff()],
  loading: false,
  error: null,
  refreshStaff: jest.fn(),
  createStaff: jest.fn(),
  updateStaff: jest.fn(),
  deleteStaff: jest.fn(),
  getAllStaffs: jest.fn(),
};

const defaultCloseDatesResult = {
  closeDates: [],
  loading: false,
  error: null,
  createCloseDate: jest.fn(),
  updateCloseDate: jest.fn(),
  deleteCloseDate: jest.fn(),
};

// Helper: expand the form
async function expandForm() {
  const user = userEvent.setup();
  renderForm();
  await user.click(
    screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
  );
  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("DownloadForm", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseStaffs.mockReturnValue(defaultStaffsResult);
    mockUseCloseDates.mockReturnValue(defaultCloseDatesResult);
  });

  describe("ローディング状態", () => {
    it("staffLoading が true のとき「読み込み中...」を表示する", () => {
      mockUseStaffs.mockReturnValue({ ...defaultStaffsResult, loading: true });
      renderForm();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("closeDateLoading が true のとき「読み込み中...」を表示する", () => {
      mockUseCloseDates.mockReturnValue({ ...defaultCloseDatesResult, loading: true });
      renderForm();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("ローディング中はタイトル「ダウンロード」が表示されない", () => {
      mockUseStaffs.mockReturnValue({ ...defaultStaffsResult, loading: true });
      renderForm();
      expect(screen.queryByText("ダウンロード")).not.toBeInTheDocument();
    });
  });

  describe("エラー状態", () => {
    it("staffError が設定されているとき「エラーが発生しました」を表示する", () => {
      mockUseStaffs.mockReturnValue({
        ...defaultStaffsResult,
        error: new Error("staff error"),
      });
      renderForm();
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    });

    it("closeDateError が設定されているとき「エラーが発生しました」を表示する", () => {
      mockUseCloseDates.mockReturnValue({
        ...defaultCloseDatesResult,
        error: new Error("close date error"),
      });
      renderForm();
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    });

    it("エラー時はタイトル「ダウンロード」が表示されない", () => {
      mockUseStaffs.mockReturnValue({
        ...defaultStaffsResult,
        error: new Error("error"),
      });
      renderForm();
      expect(screen.queryByText("ダウンロード")).not.toBeInTheDocument();
    });
  });

  describe("正常状態（折りたたまれた状態）", () => {
    it("「ダウンロード」タイトルを表示する", () => {
      renderForm();
      expect(screen.getByText("ダウンロード")).toBeInTheDocument();
    });

    it("説明文を表示する", () => {
      renderForm();
      expect(
        screen.getByText(/期間と対象スタッフを選択して/),
      ).toBeInTheDocument();
    });

    it("「展開する」ボタンを表示する（初期状態は折りたたまれている）", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      ).toBeInTheDocument();
    });

    it("初期状態ではフォーム本体（開始日ラベルなど）が表示されない", () => {
      renderForm();
      expect(screen.queryByText("開始日")).not.toBeInTheDocument();
    });
  });

  describe("展開・折りたたみ", () => {
    it("「展開する」ボタンをクリックするとフォームが表示される", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      expect(screen.getByText("開始日")).toBeInTheDocument();
    });

    it("展開後は「折りたたむ」ボタンが表示される", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      expect(
        screen.getByRole("button", { name: "ダウンロード要素を折りたたむ" }),
      ).toBeInTheDocument();
    });

    it("「折りたたむ」ボタンをクリックするとフォームが非表示になる", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      expect(screen.getByText("開始日")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を折りたたむ" }),
      );
      expect(screen.queryByText("開始日")).not.toBeInTheDocument();
    });

    it("展開ボタンの aria-expanded が初期状態で false", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    it("展開後に aria-expanded が true になる", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      expect(
        screen.getByRole("button", { name: "ダウンロード要素を折りたたむ" }),
      ).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("展開後のフォーム", () => {
    it("開始日ラベルが表示される", async () => {
      await expandForm();
      expect(screen.getByText("開始日")).toBeInTheDocument();
    });

    it("終了日ラベルが表示される", async () => {
      await expandForm();
      expect(screen.getByText("終了日")).toBeInTheDocument();
    });

    it("date type の input が 2 つ表示される（開始日・終了日）", async () => {
      const user = userEvent.setup();
      const { container } = renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      const dateInputs = container.querySelectorAll('input[type="date"]');
      expect(dateInputs).toHaveLength(2);
    });

    it("集計対象月セレクトが表示される", async () => {
      await expandForm();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("StaffSelector が表示される", async () => {
      await expandForm();
      expect(screen.getByTestId("staff-selector")).toBeInTheDocument();
    });

    it("ExportButton が表示される", async () => {
      await expandForm();
      expect(screen.getByTestId("export-button")).toBeInTheDocument();
    });

    it("AggregateExportButton が表示される", async () => {
      await expandForm();
      expect(screen.getByTestId("aggregate-export-button")).toBeInTheDocument();
    });

    it("「新規」ボタンが表示される", async () => {
      await expandForm();
      expect(screen.getByRole("button", { name: /新規/ })).toBeInTheDocument();
    });

    it("staffs が StaffSelector に渡される", async () => {
      mockUseStaffs.mockReturnValue({
        ...defaultStaffsResult,
        staffs: [
          createDownloadTestStaff({ id: "s1", cognitoUserId: "s1" }),
          createDownloadTestStaff({ id: "s2", cognitoUserId: "s2" }),
        ],
      });
      await expandForm();
      expect(screen.getByTestId("staffs-count")).toHaveTextContent("2");
    });
  });

  describe("日付入力", () => {
    it("開始日 input の初期値が今日の日付", async () => {
      const user = userEvent.setup();
      const { container } = renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      const dateInputs = container.querySelectorAll('input[type="date"]');
      // Both start and end date default to today
      expect(dateInputs[0]).toBeInTheDocument();
      expect(dateInputs[1]).toBeInTheDocument();
    });

    it("開始日 input の値を変更できる", async () => {
      const user = userEvent.setup();
      const { container } = renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      const dateInputs = container.querySelectorAll('input[type="date"]');
      const startInput = dateInputs[0] as HTMLInputElement;
      await user.clear(startInput);
      await user.type(startInput, "2024-02-01");
      expect(startInput.value).toBe("2024-02-01");
    });

    it("終了日 input の値を変更できる", async () => {
      const user = userEvent.setup();
      const { container } = renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      const dateInputs = container.querySelectorAll('input[type="date"]');
      const endInput = dateInputs[1] as HTMLInputElement;
      await user.clear(endInput);
      await user.type(endInput, "2024-02-28");
      expect(endInput.value).toBe("2024-02-28");
    });
  });

  describe("集計対象月セレクト", () => {
    it("closeDates が空のとき選択肢は「対象月を選択」のみ", async () => {
      await expandForm();
      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("");
      const options = within(select).queryAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("対象月を選択");
    });

    it("closeDates がある場合、選択肢に月が表示される", async () => {
      mockUseCloseDates.mockReturnValue({
        ...defaultCloseDatesResult,
        closeDates: [
          {
            id: "cd1",
            closeDate: "2024-01-31",
            startDate: "2024-01-01T00:00:00.000Z",
            endDate: "2024-01-31T23:59:59.000Z",
          },
        ],
      });
      await expandForm();
      expect(screen.getByText("2024/01")).toBeInTheDocument();
    });

    it("closeDates を選択すると開始日・終了日が更新される", async () => {
      const closeDate = {
        id: "cd1",
        closeDate: "2024-01-31",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T00:00:00.000Z",
      };
      mockUseCloseDates.mockReturnValue({
        ...defaultCloseDatesResult,
        closeDates: [closeDate],
      });
      const user = userEvent.setup();
      const { container } = renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "2024-01-31");
      await waitFor(() => {
        const dateInputs = container.querySelectorAll('input[type="date"]');
        expect((dateInputs[0] as HTMLInputElement).value).toBe("2024-01-01");
        expect((dateInputs[1] as HTMLInputElement).value).toBe("2024-01-31");
      });
    });
  });

  describe("新規ボタン（ナビゲーション）", () => {
    it("「新規」ボタンをクリックすると /admin/master/job_term に遷移する", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole("button", { name: "ダウンロード要素を展開する" }),
      );
      await user.click(screen.getByRole("button", { name: /新規/ }));
      expect(mockNavigate).toHaveBeenCalledWith("/admin/master/job_term");
    });
  });

  describe("useStaffs の引数", () => {
    it("authStatus が authenticated のとき isAuthenticated=true で useStaffs を呼ぶ", () => {
      renderForm();
      expect(mockUseStaffs).toHaveBeenCalledWith({ isAuthenticated: true });
    });
  });
});
