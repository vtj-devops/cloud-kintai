/**
 * AddEventCalendar コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - 初期レンダリング（「イベントを追加」ボタン）
 * - ダイアログの開閉
 * - フォームバリデーション（登録ボタンの disabled 状態）
 * - 単日登録フロー（createEventCalendar の呼び出し）
 * - 期間登録フロー（bulkCreateEventCalendar の呼び出し）
 * - 成功・失敗・HolidayDateRangeError 時の通知
 * - 登録成功後のダイアログクローズ
 *
 * Note: react-hook-form v7 の isValid は onChange イベントでは自動更新されない
 * ため、fireEvent.change でフォーム値を設定した後に trigger() を呼んで
 * バリデーションを強制実行してから登録ボタンをクリックする。
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { AddEventCalendar } from "../AddEventCalendar";

// ── react-hook-form: trigger をキャプチャするためにラップ ────────────────────
let capturedTrigger: (() => Promise<boolean>) | null = null;

jest.mock("react-hook-form", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = jest.requireActual<any>("react-hook-form");
  return {
    ...actual,
    useForm: (options?: unknown) => {
      const form = actual.useForm(options);
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

jest.mock(
  "@features/admin/holidayCalendar/lib/buildHolidayDateRange",
  () => ({
    buildHolidayDateRange: (...args: unknown[]) =>
      mockBuildHolidayDateRange(...args),
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

jest.mock("@shared/lib/message/EventCalendarMessage", () => ({
  EventCalendarMessage: () => ({
    getCategoryName: () => "イベントカレンダー",
    create: (status: string) =>
      status === "S"
        ? "イベントカレンダーを作成しました"
        : "イベントカレンダーの作成に失敗しました",
  }),
}));

// ダイアログクローズガードをシンプルにする
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
    <AddEventCalendar
      createEventCalendar={createMock}
      bulkCreateEventCalendar={bulkCreateMock}
    />,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /イベントを追加/ }));
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

describe("AddEventCalendar", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    capturedTrigger = null;
    mockBuildHolidayDateRange.mockReturnValue(["2026-04-01"]);
    defaultCreateMock.mockResolvedValue({
      id: "1",
      eventDate: "2026-04-01",
      name: "花見",
    });
    defaultBulkCreateMock.mockResolvedValue([]);
  });

  // ── 初期レンダリング ──────────────────────────────────────────────────────

  it("「イベントを追加」ボタンが表示される", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: /イベントを追加/ }),
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

  it("ダイアログタイトルに「イベントを追加」が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("heading", { name: "イベントを追加" }),
    ).toBeInTheDocument();
  });

  it("「開始日」「終了日 (任意)」「イベント名」のフィールドが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByTestId("datepicker-開始日")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-終了日 (任意)")).toBeInTheDocument();
    expect(screen.getByLabelText(/イベント名/)).toBeInTheDocument();
  });

  it("「詳細 (任意)」フィールドが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByLabelText(/詳細/)).toBeInTheDocument();
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

  it("開始日とイベント名が未入力の場合、登録ボタンが disabled になっている", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
  });

  it("開始日のみ入力した場合、登録ボタンが disabled のまま", async () => {
    renderComponent();
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    await waitFor(() => {
      // isDirty=true になるが name が空なので isValid=false のまま
      expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
    });
  });

  it("開始日とイベント名を入力し trigger() を呼ぶと登録ボタンが有効になる", async () => {
    renderComponent();
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
    });
    await triggerValidation();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });
  });

  // ── 単日登録フロー ────────────────────────────────────────────────────────

  it("開始日のみ指定した場合 createEventCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", eventDate: "2026-04-01", name: "花見" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith({
        eventDate: "2026-04-01",
        name: "花見",
        description: undefined,
      });
    });
  });

  it("単日登録成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", eventDate: "2026-04-01", name: "花見" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
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
      .mockResolvedValue({ id: "1", eventDate: "2026-04-01", name: "花見" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
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

  it("description を入力すると createEventCalendar に description が渡される", async () => {
    const user = userEvent.setup();
    const createMock = jest
      .fn()
      .mockResolvedValue({ id: "1", eventDate: "2026-04-01", name: "花見" });
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
    });
    fireEvent.change(screen.getByLabelText(/詳細/), {
      target: { value: "桜を見る会" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "桜を見る会" }),
      );
    });
  });

  // ── 期間登録フロー ────────────────────────────────────────────────────────

  it("開始日と終了日を指定した場合 bulkCreateEventCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    mockBuildHolidayDateRange.mockReturnValue([
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
    ]);
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(jest.fn(), bulkMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByTestId("datepicker-終了日 (任意)"), {
      target: { value: "2026-04-03" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見期間" },
    });
    await triggerValidation();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkMock).toHaveBeenCalledTimes(1);
      expect(bulkMock).toHaveBeenCalledWith([
        { eventDate: "2026-04-01", name: "花見期間", description: undefined },
        { eventDate: "2026-04-02", name: "花見期間", description: undefined },
        { eventDate: "2026-04-03", name: "花見期間", description: undefined },
      ]);
    });
  });

  it("期間登録成功時に件数入り success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    mockBuildHolidayDateRange.mockReturnValue(["2026-04-01", "2026-04-02"]);
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(jest.fn(), bulkMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByTestId("datepicker-終了日 (任意)"), {
      target: { value: "2026-04-02" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
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

  it("createEventCalendar が失敗した場合 error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
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
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "長期イベント" },
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

  it("登録失敗時はダイアログが開いたまま", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(createMock);
    await openDialog();
    fireEvent.change(screen.getByTestId("datepicker-開始日"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/イベント名/), {
      target: { value: "花見" },
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
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
