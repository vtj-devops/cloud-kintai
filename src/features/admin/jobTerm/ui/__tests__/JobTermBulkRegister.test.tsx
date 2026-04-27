import { useAppDispatchV2 } from "@app/hooks";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import React from "react";

import JobTermBulkRegister from "../JobTermBulkRegister";

// ─── Mock: @app/hooks ─────────────────────────────────────────────────────────
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: jest.fn(),
}));

// ─── Mock: useCalendars ───────────────────────────────────────────────────────
jest.mock("@entities/calendar/model/useCalendars", () => ({
  useCalendars: jest.fn(),
}));

// ─── Mock: pushNotification ───────────────────────────────────────────────────
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({
    type: "notification/push",
    payload,
  })),
}));

// ─── Mock: AttendanceDate ─────────────────────────────────────────────────────
jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: {
    DataFormat: "YYYY-MM-DD",
    DisplayFormat: "YYYY/MM/DD",
  },
}));

// ─── Mock: DateField ──────────────────────────────────────────────────────────
// Render as a simple labeled input that calls onChange with a dayjs value
jest.mock("@shared/ui/form/DateField", () => {
  const MockDateField = ({
    label,
    value,
    onChange,
    errorText,
  }: {
    label?: string;
    value: dayjs.Dayjs | null;
    onChange: (v: dayjs.Dayjs | null) => void;
    errorText?: string;
  }) => (
    <div>
      {label && <span>{label}</span>}
      <input
        aria-label={label ?? "date-field"}
        type="text"
        value={value ? value.format("YYYY/MM") : ""}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) {
            onChange(null);
          } else {
            const d = dayjs(val, "YYYY/MM", true);
            if (d.isValid()) onChange(d.startOf("month"));
            else onChange(null);
          }
        }}
      />
      {errorText && <p role="alert">{errorText}</p>}
    </div>
  );
  MockDateField.displayName = "MockDateField";
  return { __esModule: true, default: MockDateField };
});

// ─── Mock: SubsectionTitle ────────────────────────────────────────────────────
jest.mock("@shared/ui/typography", () => ({
  SubsectionTitle: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <h2 className={className}>{children}</h2>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockDispatch = jest.fn();

const defaultCalendarsResult = {
  holidayCalendars: [],
  companyHolidayCalendars: [],
  isLoading: false,
  error: null,
};

const emptyExistingCloseDates: Parameters<
  typeof JobTermBulkRegister
>[0]["existingCloseDates"] = [];

function buildCloseDate(isoString: string) {
  return {
    __typename: "CloseDate" as const,
    id: isoString,
    closeDate: isoString,
    startDate: isoString,
    endDate: isoString,
    owner: "owner",
    createdAt: "",
    updatedAt: "",
  };
}

function renderComponent(
  props: Partial<Parameters<typeof JobTermBulkRegister>[0]> = {},
) {
  const createCloseDate = jest.fn().mockResolvedValue(undefined);
  render(
    <JobTermBulkRegister
      existingCloseDates={emptyExistingCloseDates}
      createCloseDate={createCloseDate}
      {...props}
    />,
  );
  return { createCloseDate };
}

// Helper: trigger form validation so isValid becomes true
async function triggerFormValid() {
  const closingDayInput = screen.getByLabelText("締め日");
  // change then restore to same value to trigger onChange validation
  fireEvent.change(closingDayInput, { target: { value: "30" } });
  fireEvent.change(closingDayInput, { target: { value: "31" } });
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "まとめて登録" }),
    ).not.toBeDisabled();
  });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  (useAppDispatchV2 as jest.Mock).mockReturnValue(mockDispatch);
  (useCalendars as jest.Mock).mockReturnValue(defaultCalendarsResult);
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("JobTermBulkRegister", () => {
  // ── 初期レンダリング ──────────────────────────────────────────────────────
  describe("初期レンダリング", () => {
    it("タイトルが表示される", () => {
      renderComponent();
      expect(
        screen.getByText("締め日指定でまとめて登録"),
      ).toBeInTheDocument();
    });

    it("説明テキストが表示される", () => {
      renderComponent();
      expect(
        screen.getByText(/締め日が存在しない月は月末を締め日として扱います/),
      ).toBeInTheDocument();
    });

    it("開始月フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByText("開始月")).toBeInTheDocument();
    });

    it("締め日フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByLabelText("締め日")).toBeInTheDocument();
    });

    it("登録月数フィールドが表示される", () => {
      renderComponent();
      expect(screen.getByLabelText("登録月数")).toBeInTheDocument();
    });

    it("前倒し・後ろ倒しラジオボタンが表示される", () => {
      renderComponent();
      expect(
        screen.getByRole("radio", { name: "前倒し（直近の稼働日）" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "後ろ倒し（次の稼働日）" }),
      ).toBeInTheDocument();
    });

    it("デフォルトで「前倒し」が選択されている", () => {
      renderComponent();
      expect(
        screen.getByRole("radio", { name: "前倒し（直近の稼働日）" }),
      ).toBeChecked();
      expect(
        screen.getByRole("radio", { name: "後ろ倒し（次の稼働日）" }),
      ).not.toBeChecked();
    });

    it("土日を考慮チェックボックスが初期チェック済み", () => {
      renderComponent();
      expect(screen.getByRole("checkbox", { name: "土日を考慮" })).toBeChecked();
    });

    it("休日カレンダーを考慮チェックボックスが初期チェック済み", () => {
      renderComponent();
      expect(
        screen.getByRole("checkbox", { name: "休日カレンダーを考慮" }),
      ).toBeChecked();
    });

    it("会社休日カレンダーを考慮チェックボックスが初期チェック済み", () => {
      renderComponent();
      expect(
        screen.getByRole("checkbox", { name: "会社休日カレンダーを考慮" }),
      ).toBeChecked();
    });

    it("「まとめて登録」ボタンが表示される", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: "まとめて登録" }),
      ).toBeInTheDocument();
    });
  });

  // ── プレビュー表示 ────────────────────────────────────────────────────────
  describe("プレビュー表示", () => {
    it("デフォルト値で6件のプレビューが表示される", async () => {
      renderComponent();
      // Default: monthCount=6, startMonth=current month
      const currentMonth = dayjs().startOf("month");
      for (let i = 0; i < 6; i++) {
        const label = currentMonth.add(i, "month").format("YYYY年M月");
        expect(await screen.findByText(new RegExp(label))).toBeInTheDocument();
      }
    });

    it("startMonth が null のときプレビューが表示されない", async () => {
      renderComponent();
      // Clear the startMonth field
      const startMonthInput = screen.getByRole("textbox", { name: "開始月" });
      fireEvent.change(startMonthInput, { target: { value: "" } });
      await waitFor(() => {
        expect(
          screen.getByText("条件を入力するとプレビューが表示されます。"),
        ).toBeInTheDocument();
      });
    });

    it("登録月数を3に変更するとプレビューが3件になる", async () => {
      renderComponent();
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "3" } });
      const currentMonth = dayjs().startOf("month");
      // 3件分のプレビューが表示される
      await waitFor(() => {
        expect(
          screen.getByText(
            new RegExp(currentMonth.add(2, "month").format("YYYY年M月")),
          ),
        ).toBeInTheDocument();
      });
      // 4件目は表示されない
      expect(
        screen.queryByText(
          new RegExp(currentMonth.add(3, "month").format("YYYY年M月")),
        ),
      ).not.toBeInTheDocument();
    });

    it("既存の登録済み月は「登録済み」として表示される", async () => {
      const thisMonthIso = dayjs().startOf("month").toISOString();
      renderComponent({
        existingCloseDates: [buildCloseDate(thisMonthIso)],
      });
      // "(登録済み)" はプレビュー内のみ（説明文には括弧なし）
      await waitFor(() => {
        const matches = screen.getAllByText(/\(登録済み\)/);
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    it("既存登録済み月はスキップ対象の背景色クラスで表示される", async () => {
      const thisMonthIso = dayjs().startOf("month").toISOString();
      renderComponent({
        existingCloseDates: [buildCloseDate(thisMonthIso)],
      });
      // The current month item has the sky (duplicate) style
      const currentMonthLabel = dayjs().format("YYYY年M月");
      const item = await screen.findByText(
        new RegExp(`${currentMonthLabel}.*\\(登録済み\\)`),
      );
      expect(item).toBeInTheDocument();
    });

    it("締め日の変更で開始日・終了日が更新される", async () => {
      renderComponent();
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "15" } });
      // The end date for this month should contain "15"
      await waitFor(() => {
        const thisMonth = dayjs().startOf("month");
        const expectedEnd = thisMonth.date(15).format("YYYY/MM/DD");
        expect(screen.getByText(new RegExp(expectedEnd))).toBeInTheDocument();
      });
    });
  });

  // ── フォームバリデーション ────────────────────────────────────────────────
  describe("フォームバリデーション", () => {
    it("締め日に無効な値を入力するとエラーが表示される", async () => {
      renderComponent();
      await triggerFormValid();
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "" } });
      // ラジオボタンは shouldValidate: true を持つため、全フィールドの
      // バリデーションを再実行させてエラーを表示させる
      fireEvent.click(
        screen.getByRole("radio", { name: "後ろ倒し（次の稼働日）" }),
      );
      await waitFor(() => {
        expect(
          screen.getByText("1〜31で入力してください"),
        ).toBeInTheDocument();
      });
    });

    it("登録月数に無効な値を入力するとエラーが表示される", async () => {
      renderComponent();
      await triggerFormValid();
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "" } });
      // ラジオボタンの shouldValidate: true でバリデーションを強制実行
      fireEvent.click(
        screen.getByRole("radio", { name: "後ろ倒し（次の稼働日）" }),
      );
      await waitFor(() => {
        expect(
          screen.getByText("1〜12で入力してください"),
        ).toBeInTheDocument();
      });
    });

    it("締め日を空にするとバリデーションエラー状態になりボタンが無効化される", async () => {
      renderComponent();
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "" } });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "まとめて登録" }),
        ).toBeDisabled();
      });
    });
  });

  // ── 非稼働日の調整 ────────────────────────────────────────────────────────
  describe("非稼働日の調整設定", () => {
    it("「後ろ倒し」ラジオを選択できる", async () => {
      const user = userEvent.setup();
      renderComponent();
      const nextRadio = screen.getByRole("radio", {
        name: "後ろ倒し（次の稼働日）",
      });
      await user.click(nextRadio);
      expect(nextRadio).toBeChecked();
      expect(
        screen.getByRole("radio", { name: "前倒し（直近の稼働日）" }),
      ).not.toBeChecked();
    });

    it("土日を考慮チェックボックスをオフにできる", async () => {
      const user = userEvent.setup();
      renderComponent();
      const checkbox = screen.getByRole("checkbox", { name: "土日を考慮" });
      expect(checkbox).toBeChecked();
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("休日カレンダーを考慮チェックボックスをオフにできる", async () => {
      const user = userEvent.setup();
      renderComponent();
      const checkbox = screen.getByRole("checkbox", {
        name: "休日カレンダーを考慮",
      });
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("会社休日カレンダーを考慮チェックボックスをオフにできる", async () => {
      const user = userEvent.setup();
      renderComponent();
      const checkbox = screen.getByRole("checkbox", {
        name: "会社休日カレンダーを考慮",
      });
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("休日カレンダーがある場合に締め日が調整される", async () => {
      // 2025-06-21 は土曜日 + 休日カレンダーに設定 → 前倒しで 2025-06-20 に調整
      const holidayDate = "2025-06-21";
      (useCalendars as jest.Mock).mockReturnValue({
        ...defaultCalendarsResult,
        holidayCalendars: [{ holidayDate, id: "h1" }],
      });
      renderComponent();
      const startMonthInput = screen.getByRole("textbox", { name: "開始月" });
      fireEvent.change(startMonthInput, { target: { value: "2025/06" } });
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "1" } });
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "21" } });
      // 土日 + 休日カレンダーのため前倒し
      await waitFor(() => {
        expect(
          screen.getByText("土日・休日カレンダーのため前倒し"),
        ).toBeInTheDocument();
      });
    });

    it("会社休日カレンダーがある場合に締め日が調整される", async () => {
      // 2025-06-30 は月曜日を会社休日に設定、土日考慮OFF → 前倒しで調整
      const companyHolidayDate = "2025-06-30";
      (useCalendars as jest.Mock).mockReturnValue({
        ...defaultCalendarsResult,
        companyHolidayCalendars: [{ holidayDate: companyHolidayDate, id: "c1" }],
      });
      renderComponent();
      const startMonthInput = screen.getByRole("textbox", { name: "開始月" });
      fireEvent.change(startMonthInput, { target: { value: "2025/06" } });
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "1" } });
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "30" } });
      // 土日を考慮 OFF にして会社休日のみが理由になるようにする
      const weekendCheckbox = screen.getByRole("checkbox", {
        name: "土日を考慮",
      });
      fireEvent.click(weekendCheckbox);
      await waitFor(() => {
        expect(
          screen.getByText("会社休日カレンダーのため前倒し"),
        ).toBeInTheDocument();
      });
    });
  });

  // ── カレンダー読み込み ────────────────────────────────────────────────────
  describe("カレンダー読み込み", () => {
    it("isLoading が true のときローディングメッセージが表示される", () => {
      (useCalendars as jest.Mock).mockReturnValue({
        ...defaultCalendarsResult,
        isLoading: true,
      });
      renderComponent();
      expect(
        screen.getByText("休日カレンダー情報を読み込み中です…"),
      ).toBeInTheDocument();
    });

    it("isLoading が false のときローディングメッセージが表示されない", () => {
      renderComponent();
      expect(
        screen.queryByText("休日カレンダー情報を読み込み中です…"),
      ).not.toBeInTheDocument();
    });
  });

  // ── 送信処理 ──────────────────────────────────────────────────────────────
  describe("送信処理", () => {
    it("フォームが有効な状態でまとめて登録ボタンを押すと createCloseDate が呼ばれる", async () => {
      const { createCloseDate } = renderComponent();
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(createCloseDate).toHaveBeenCalled();
      });
    });

    it("createCloseDate は各月ごとに呼ばれる（6件）", async () => {
      const { createCloseDate } = renderComponent();
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(createCloseDate).toHaveBeenCalledTimes(6);
      });
    });

    it("登録成功時に成功通知が dispatch される", async () => {
      renderComponent();
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({ tone: "success" }),
        );
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it("成功通知に登録件数が含まれる", async () => {
      renderComponent();
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("件の集計対象月を登録しました"),
          }),
        );
      });
    });

    it("createCloseDate が失敗した場合エラー通知が dispatch される", async () => {
      const createCloseDate = jest.fn().mockRejectedValue(new Error("API error"));
      render(
        <JobTermBulkRegister
          existingCloseDates={emptyExistingCloseDates}
          createCloseDate={createCloseDate}
        />,
      );
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            tone: "error",
            message: "集計対象月の登録に失敗しました",
          }),
        );
      });
    });

    it("1件のみ登録の場合サクセス通知が「1件」と表示される", async () => {
      // monthCount=1 で 1件のみ登録
      const createCloseDate = jest.fn().mockResolvedValue(undefined);
      render(
        <JobTermBulkRegister
          existingCloseDates={emptyExistingCloseDates}
          createCloseDate={createCloseDate}
        />,
      );
      // monthCount を 1 に変更して form valid にする
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "1" } });
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      await waitFor(() => {
        expect(pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            tone: "success",
            message: "1件の集計対象月を登録しました",
          }),
        );
      });
      expect(createCloseDate).toHaveBeenCalledTimes(1);
    });

    it("すべて登録済みの場合はまとめて登録ボタンが無効化される", async () => {
      const existingCloseDates = Array.from({ length: 6 }, (_, i) =>
        buildCloseDate(dayjs().add(i, "month").startOf("month").toISOString()),
      );
      renderComponent({ existingCloseDates });
      // Trigger validation to get isValid=true, but creatableItems=0 keeps button disabled
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "30" } });
      fireEvent.change(closingDayInput, { target: { value: "31" } });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "まとめて登録" }),
        ).toBeDisabled();
      });
    });

    it("送信中はまとめて登録ボタンが無効化される", async () => {
      let resolveCreate!: () => void;
      const createCloseDate = jest.fn(
        () =>
          new Promise<void>((res) => {
            resolveCreate = res;
          }),
      );
      render(
        <JobTermBulkRegister
          existingCloseDates={emptyExistingCloseDates}
          createCloseDate={createCloseDate}
        />,
      );
      await triggerFormValid();
      fireEvent.click(screen.getByRole("button", { name: "まとめて登録" }));
      // While submitting, button should become disabled
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "まとめて登録" }),
        ).toBeDisabled();
      });
      // Cleanup: resolve to avoid act() warnings
      resolveCreate();
      await waitFor(() => {
        expect(createCloseDate).toHaveBeenCalled();
      });
    });
  });

  // ── 隙間埋めロジック（前月前倒し分スライド）─────────────────────────────
  describe("前月前倒し分の開始日スライド", () => {
    it("前月の締め日が前倒しされた場合、次月の開始日がスライドされる", async () => {
      // Set a holiday on 2025-05-31 (Saturday) so it gets adjusted to 2025-05-30
      // and then 2025-06's start date should slide accordingly
      (useCalendars as jest.Mock).mockReturnValue({
        ...defaultCalendarsResult,
        holidayCalendars: [
          { holidayDate: "2025-05-31", id: "h1" },
          { holidayDate: "2025-05-30", id: "h2" }, // Also holiday so it goes further back
        ],
      });
      renderComponent();
      const startMonthInput = screen.getByRole("textbox", { name: "開始月" });
      fireEvent.change(startMonthInput, { target: { value: "2025/05" } });
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "2" } });
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "31" } });
      // Wait for preview to render both months
      await waitFor(() => {
        expect(screen.getByText(/2025年5月/)).toBeInTheDocument();
        expect(screen.getByText(/2025年6月/)).toBeInTheDocument();
      });
    });
  });

  // ── adjustDirection = next（後ろ倒し）─────────────────────────────────────
  describe("後ろ倒し調整", () => {
    it("後ろ倒し選択時に締め日が後ろにずれる", async () => {
      const user = userEvent.setup();
      // 2025-06-28 is a Saturday
      (useCalendars as jest.Mock).mockReturnValue(defaultCalendarsResult);
      renderComponent();
      // Switch to 後ろ倒し
      await user.click(
        screen.getByRole("radio", { name: "後ろ倒し（次の稼働日）" }),
      );
      const startMonthInput = screen.getByRole("textbox", { name: "開始月" });
      fireEvent.change(startMonthInput, { target: { value: "2025/06" } });
      const monthCountInput = screen.getByLabelText("登録月数");
      fireEvent.change(monthCountInput, { target: { value: "1" } });
      const closingDayInput = screen.getByLabelText("締め日");
      fireEvent.change(closingDayInput, { target: { value: "28" } });
      // 2025-06-28 is Saturday → 後ろ倒し → 2025-06-30 (Monday)
      await waitFor(() => {
        expect(screen.getByText(/2025年6月/)).toBeInTheDocument();
      });
    });
  });
});
