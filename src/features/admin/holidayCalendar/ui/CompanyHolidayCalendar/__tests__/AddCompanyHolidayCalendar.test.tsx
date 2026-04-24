/**
 * AddCompanyHolidayCalendar コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - 初期レンダリング
 * - ダイアログの開閉
 * - フォームバリデーション（登録ボタンの disabled 状態）
 * - 単日登録フロー（createCompanyHolidayCalendar の呼び出し）
 * - 期間登録フロー（bulkCreateCompanyHolidayCalendar の呼び出し）
 * - 成功・失敗・HolidayDateRangeError 時の通知
 *
 * Note: react-hook-form v7 の isValid は onChange イベントでは自動更新されない
 * ため、fireEvent.change でフォーム値を設定した後に trigger() を呼んで
 * バリデーションを強制実行してから登録ボタンをクリックする。
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AddCompanyHolidayCalendar from "../AddCompanyHolidayCalendar";

// ── react-hook-form: trigger をキャプチャするためにラップ ────────────────────
// NOTE: jest.mock はホイスティングされるが、capturedTrigger への代入は
// useForm ラッパーが呼ばれる（コンポーネントのレンダリング時）に行われるため
// 変数初期化のタイミング問題は発生しない。
let capturedTrigger: (() => Promise<boolean>) | null = null;

jest.mock("react-hook-form", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = jest.requireActual<any>("react-hook-form");
  return {
    ...actual,
    useForm: (options?: unknown) => {
      const form = actual.useForm(options);
      // コンポーネントのレンダリング時に trigger をキャプチャ
      capturedTrigger = form.trigger;
      return form;
    },
  };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD", DisplayFormat: "YYYY/MM/DD" },
}));

const mockBuildHolidayDateRange = jest.fn();

// HolidayDateRangeError クラスは jest.mock ファクトリ内で定義する（TDZ 回避）
jest.mock(
  "@features/admin/holidayCalendar/lib/buildHolidayDateRange",
  () => ({
    buildHolidayDateRange: (...args: unknown[]) =>
      mockBuildHolidayDateRange(...args),
    // クラスをファクトリ内で定義することで jest.mock のホイスティングによる TDZ を回避
    HolidayDateRangeError: class HolidayDateRangeError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.name = "HolidayDateRangeError";
        this.code = code;
      }
    },
    MAX_HOLIDAY_RANGE_DAYS: 366,
  }),
);

const pushNotificationMock = jest.fn(
  (payload: { tone: string; message: string }) => ({
    type: "notification/push",
    payload,
  }),
);
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: (...args: Parameters<typeof pushNotificationMock>) =>
    pushNotificationMock(...args),
}));

jest.mock("@shared/lib/message/CompanyHolidayCalendarMessage", () => ({
  CompanyHolidayCalendarMessage: () => ({
    getCategoryName: () => "会社休日カレンダー",
    create: (status: string) =>
      status === "S"
        ? "会社休日カレンダーを作成しました"
        : "会社休日カレンダーの作成に失敗しました",
    update: (status: string) =>
      status === "S"
        ? "会社休日カレンダーを更新しました"
        : "会社休日カレンダーの更新に失敗しました",
    delete: (status: string) =>
      status === "S"
        ? "会社休日カレンダーを削除しました"
        : "会社休日カレンダーの削除に失敗しました",
  }),
}));

// ダイアログクローズガードをシンプルにする: requestClose/closeWithoutGuard は即座に onClose を実行
jest.mock("@shared/ui/feedback/useDialogCloseGuard", () => ({
  useDialogCloseGuard: ({
    onClose,
  }: {
    onClose: () => void;
    isDirty?: boolean;
    isBusy?: boolean;
  }) => ({
    dialog: null,
    requestClose: onClose,
    closeWithoutGuard: onClose,
  }),
}));

// DatePicker をシンプルな input として扱う
jest.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (val: { format: (f: string) => string } | null) => void;
    [key: string]: unknown;
  }) => (
    <input
      aria-label={label}
      data-testid={`datepicker-${label}`}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          onChange(null);
          return;
        }
        onChange({ format: () => v });
      }}
    />
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultCreateMock = jest.fn();
const defaultBulkCreateMock = jest.fn();

function renderComponent(
  createMock = defaultCreateMock,
  bulkCreateMock = defaultBulkCreateMock,
) {
  return render(
    <AddCompanyHolidayCalendar
      createCompanyHolidayCalendar={createMock}
      bulkCreateCompanyHolidayCalendar={bulkCreateMock}
    />,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /休日を追加/ }));
}

/**
 * react-hook-form v7 では onChange イベントだけでは isValid が自動更新されないため、
 * trigger() を明示的に呼んでバリデーションを強制実行し isValid を true にする。
 */
async function triggerValidation() {
  await act(async () => {
    await capturedTrigger!();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("AddCompanyHolidayCalendar", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    capturedTrigger = null;
    mockBuildHolidayDateRange.mockReturnValue([
      "2024-01-01T00:00:00.000Z",
    ]);
    defaultCreateMock.mockResolvedValue({
      id: "1",
      holidayDate: "2024-01-01T00:00:00.000Z",
      name: "元日",
    });
    defaultBulkCreateMock.mockResolvedValue([]);
  });

  // ── 初期レンダリング ──────────────────────────────────────────────────────

  it("「休日を追加」ボタンが表示される", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: /休日を追加/ }),
    ).toBeInTheDocument();
  });

  it("初期状態ではダイアログが表示されない", () => {
    renderComponent();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── ダイアログ開閉 ────────────────────────────────────────────────────────

  it("ボタンをクリックするとダイアログが開く", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ダイアログタイトルに「会社休日を追加」が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("heading", { name: "会社休日を追加" }),
    ).toBeInTheDocument();
  });

  it("「開始日」「終了日 (任意)」「休日名」のフィールドが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByTestId("datepicker-開始日")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-終了日 (任意)")).toBeInTheDocument();
    expect(screen.getByLabelText(/休日名/)).toBeInTheDocument();
  });

  it("キャンセルボタンをクリックするとダイアログが閉じる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await openDialog();
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ── フォームバリデーション ────────────────────────────────────────────────

  it("開始日と休日名が未入力の場合、登録ボタンが disabled になっている", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
  });

  it("開始日のみ入力した場合、登録ボタンが disabled のまま", async () => {
    renderComponent();
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    await waitFor(() => {
      // isDirty=true になるが name が空なので isValid=false のまま
      expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
    });
  });

  it("開始日と休日名を入力し trigger() を呼ぶと登録ボタンが有効になる", async () => {
    renderComponent();
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });
  });

  // ── 単日登録フロー ────────────────────────────────────────────────────────

  it("開始日のみ指定した場合 createCompanyHolidayCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", holidayDate: "2024-01-01T00:00:00.000Z", name: "元日" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith({
        holidayDate: "2024-01-01T00:00:00.000Z",
        name: "元日",
      });
    });
  });

  it("単日登録成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", holidayDate: "2024-01-01T00:00:00.000Z", name: "元日" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success" }),
      );
    });
  });

  it("単日登録成功後にダイアログが閉じる", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", holidayDate: "2024-01-01T00:00:00.000Z", name: "元日" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ── 期間登録フロー ────────────────────────────────────────────────────────

  it("開始日と終了日を指定した場合 bulkCreateCompanyHolidayCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    mockBuildHolidayDateRange.mockReturnValue([
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T00:00:00.000Z",
      "2024-01-03T00:00:00.000Z",
    ]);
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(jest.fn(), bulkMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByTestId("datepicker-終了日 (任意)"), {
      target: { value: "2024-01-03" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "年末年始" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkMock).toHaveBeenCalledTimes(1);
      expect(bulkMock).toHaveBeenCalledWith([
        { holidayDate: "2024-01-01T00:00:00.000Z", name: "年末年始" },
        { holidayDate: "2024-01-02T00:00:00.000Z", name: "年末年始" },
        { holidayDate: "2024-01-03T00:00:00.000Z", name: "年末年始" },
      ]);
    });
  });

  it("期間登録成功時に件数入り success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    mockBuildHolidayDateRange.mockReturnValue([
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T00:00:00.000Z",
    ]);
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(jest.fn(), bulkMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByTestId("datepicker-終了日 (任意)"), {
      target: { value: "2024-01-02" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "年末" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      const successCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "success",
      );
      expect(successCall).toBeDefined();
      expect(successCall![0].message).toContain("2件");
    });
  });

  // ── エラーハンドリング ────────────────────────────────────────────────────

  it("createCompanyHolidayCalendar が失敗した場合 error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("HolidayDateRangeError が throw された場合、そのメッセージで error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    // jest.mock ファクトリ内で定義したクラスを取得することで instanceof が正しく機能する
    const { HolidayDateRangeError: MockHolidayDateRangeError } =
      jest.requireMock(
        "@features/admin/holidayCalendar/lib/buildHolidayDateRange",
      ) as {
        HolidayDateRangeError: new (message: string, code: string) => Error;
      };
    const rangeError = new MockHolidayDateRangeError(
      "一度に登録できる期間は最大366日までです。",
      "RANGE_TOO_LARGE",
    );
    mockBuildHolidayDateRange.mockImplementation(() => {
      throw rangeError;
    });
    renderComponent();
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "長期休暇" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          message: "一度に登録できる期間は最大366日までです。",
        }),
      );
    });
  });

  it("bulkCreateCompanyHolidayCalendar が失敗した場合 error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    mockBuildHolidayDateRange.mockReturnValue([
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T00:00:00.000Z",
    ]);
    const bulkMock = jest.fn().mockRejectedValue(new Error("Bulk Error"));
    renderComponent(jest.fn(), bulkMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByTestId("datepicker-終了日 (任意)"), {
      target: { value: "2024-01-02" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "年末" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("登録成功後に再度ダイアログを開くとフォームがリセットされている", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", holidayDate: "2024-01-01T00:00:00.000Z", name: "元日" });
    renderComponent(createMock);

    // 1回目: フォーム入力→登録
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/休日名/), {
      target: { value: "元日" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // 2回目: ダイアログを開くと名前フィールドが空
    await user.click(screen.getByRole("button", { name: /休日を追加/ }));
    expect(screen.getByLabelText(/休日名/)).toHaveValue("");
  });
});
