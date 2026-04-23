/**
 * CompanyHolidayCalendarCopy コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - コピーボタンのレンダリング
 * - ダイアログ開閉
 * - フォーム初期値（コピー元データが pre-populate される）
 * - フォームバリデーション（登録ボタンの disabled 状態）
 * - 登録成功・失敗時の通知
 * - 成功後のダイアログクローズ
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import CompanyHolidayCalendarCopy from "../CompanyHolidayCalendarCopy";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD", DisplayFormat: "YYYY/MM/DD" },
}));

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
    onChange: (val: { format: (f: string) => string; toISOString: () => string } | null) => void;
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
        onChange({
          format: () => v,
          toISOString: () => `${v}T00:00:00.000Z`,
        });
      }}
    />
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseHoliday = {
  id: "holiday-1",
  holidayDate: "2024-01-01",
  name: "元日",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  version: 1,
  owner: "owner-1",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderComponent(
  createMock = jest.fn().mockResolvedValue(undefined),
  holiday = baseHoliday,
) {
  return render(
    <CompanyHolidayCalendarCopy
      companyHolidayCalendar={holiday}
      createCompanyHolidayCalendar={createMock}
    />,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "コピー" }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CompanyHolidayCalendarCopy", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── 初期レンダリング ──────────────────────────────────────────────────────

  it("aria-label=\"コピー\" のボタンが表示される", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "コピー" })).toBeInTheDocument();
  });

  it("初期状態ではダイアログが表示されない", () => {
    renderComponent();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── ダイアログ開閉 ────────────────────────────────────────────────────────

  it("コピーボタンをクリックするとダイアログが開く", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ダイアログタイトルに「会社休日をコピーして新規作成」が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("heading", { name: "会社休日をコピーして新規作成" }),
    ).toBeInTheDocument();
  });

  it("「日付」「休日名」のフィールドが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByTestId("datepicker-日付")).toBeInTheDocument();
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

  // ── コピー元データの pre-populate ────────────────────────────────────────

  it("ダイアログを開くと休日名フィールドにコピー元の名前が入力されている", async () => {
    renderComponent(jest.fn(), { ...baseHoliday, name: "建国記念日" });
    await openDialog();
    await waitFor(() => {
      expect(screen.getByLabelText(/休日名/)).toHaveValue("建国記念日");
    });
  });

  // ── フォームバリデーション ────────────────────────────────────────────────

  it("コピー元データが設定された状態では登録ボタンが有効になる（isDirty=false→disabled）", async () => {
    // useEffect でセットされた初期値は defaultValues と異なるため isDirty=true になるが
    // isValid もチェックされるので入力後に有効になることを確認
    const user = userEvent.setup();
    renderComponent();
    await openDialog();
    // 休日名をクリアして再入力することで isValid=true, isDirty=true を保証
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "コピー元日");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-03-20");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
  });

  // ── 登録フロー ────────────────────────────────────────────────────────────

  it("登録ボタンをクリックすると createCompanyHolidayCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockResolvedValue(undefined);
    renderComponent(createMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "元日");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-01-01");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });
  });

  it("登録成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockResolvedValue(undefined);
    renderComponent(createMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "元日コピー");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-01-01");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success" }),
      );
    });
  });

  it("登録成功後にダイアログが閉じる", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockResolvedValue(undefined);
    renderComponent(createMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "元日コピー");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-01-01");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("登録失敗時に error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(createMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "失敗テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-01-01");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("登録失敗時はダイアログが開いたまま", async () => {
    const user = userEvent.setup();
    const createMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(createMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "失敗テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-01-01");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "登録" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "登録" }));

    // エラー通知が出た後もダイアログは表示されていることを確認
    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
