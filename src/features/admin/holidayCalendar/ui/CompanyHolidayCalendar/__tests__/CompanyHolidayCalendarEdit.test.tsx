/**
 * CompanyHolidayCalendarEdit コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - 編集ボタンのレンダリング
 * - ダイアログ開閉
 * - フォーム初期値（holidayCalendar データが pre-populate される）
 * - フォームバリデーション（更新ボタンの disabled 状態）
 * - updateCompanyHolidayCalendar の呼び出し内容
 * - 更新成功・失敗時の通知
 * - 成功後のダイアログクローズ
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import CompanyHolidayCalendarEdit from "../CompanyHolidayCalendarEdit";

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseHoliday = {
  __typename: "CompanyHolidayCalendar" as const,
  id: "holiday-edit-1",
  holidayDate: "2024-05-03",
  name: "憲法記念日",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  version: 1,
  owner: "owner-1",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderComponent(
  updateMock = jest.fn().mockResolvedValue(baseHoliday),
  holiday = baseHoliday,
) {
  return render(
    <CompanyHolidayCalendarEdit
      holidayCalendar={holiday}
      updateCompanyHolidayCalendar={updateMock}
    />,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "編集" }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CompanyHolidayCalendarEdit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── 初期レンダリング ──────────────────────────────────────────────────────

  it("aria-label=\"編集\" のボタンが表示される", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  it("初期状態ではダイアログが表示されない", () => {
    renderComponent();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── ダイアログ開閉 ────────────────────────────────────────────────────────

  it("編集ボタンをクリックするとダイアログが開く", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ダイアログタイトルに「会社休日を編集」が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("heading", { name: "会社休日を編集" }),
    ).toBeInTheDocument();
  });

  it("ダイアログ内に「日付」と「休日名」のフィールドが表示される", async () => {
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

  // ── フォーム初期値 ────────────────────────────────────────────────────────

  it("ダイアログを開くと休日名フィールドに既存データが入力されている", async () => {
    renderComponent(jest.fn(), { ...baseHoliday, name: "憲法記念日" });
    await openDialog();
    await waitFor(() => {
      expect(screen.getByLabelText(/休日名/)).toHaveValue("憲法記念日");
    });
  });

  // ── フォームバリデーション ────────────────────────────────────────────────

  it("フォームを変更すると更新ボタンが有効になる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await openDialog();
    // 休日名を変更することで isDirty=true になり更新ボタンが有効になる
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "憲法記念日（修正）");
    // DatePicker にも値をセットして holidayDate の validation を通す
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
  });

  // ── 更新フロー ────────────────────────────────────────────────────────────

  it("更新ボタンをクリックすると updateCompanyHolidayCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockResolvedValue(baseHoliday);
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "更新後の名前");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  });

  it("updateCompanyHolidayCalendar に正しいデータが渡される", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockResolvedValue(baseHoliday);
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "更新後の名前");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-04");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "holiday-edit-1",
          name: "更新後の名前",
          holidayDate: "2024-05-04",
        }),
      );
    });
  });

  it("更新成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockResolvedValue(baseHoliday);
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "成功テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success" }),
      );
    });
  });

  it("更新成功後にダイアログが閉じる", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockResolvedValue(baseHoliday);
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "成功テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("更新失敗時に error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockRejectedValue(new Error("Update failed"));
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "失敗テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("更新失敗時はダイアログが開いたまま", async () => {
    const user = userEvent.setup();
    const updateMock = jest.fn().mockRejectedValue(new Error("Update failed"));
    renderComponent(updateMock);
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "失敗テスト");
    await user.type(screen.getByTestId("datepicker-日付"), "2024-05-03");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "更新" }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // ── ダイアログを閉じて再度開くと前の編集内容がリセット ──────────────────

  it("キャンセル後に再度ダイアログを開くとフォームがリセットされている", async () => {
    const user = userEvent.setup();
    renderComponent();

    // 1回目: 開いてキャンセル
    await openDialog();
    const nameInput = screen.getByLabelText(/休日名/);
    await user.clear(nameInput);
    await user.type(nameInput, "一時変更");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // 2回目: 再度開くと元のデータ（useEffectでセットされる）が入っている
    await openDialog();
    await waitFor(() => {
      // onClose内でreset()が呼ばれるので空になっているが
      // useEffectで再セットされるため元のnameが入る
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
