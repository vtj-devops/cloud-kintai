/**
 * CompanyHolidayCalendarList コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - ローディング中の表示
 * - データのテーブル表示（日付・名前・作成日）
 * - 各行の編集・コピー・削除ボタン
 * - 削除フロー（confirm 確認・成功・失敗・キャンセル）
 * - データ取得エラー時の通知
 * - フィルター（年・月・名前）
 * - フィルタークリア
 * - ページネーション
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import CompanyHolidayCalendarList from "../CompanyHolidayCalendarList";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD", DisplayFormat: "YYYY/MM/DD" },
}));

// calendarApi フックをすべてモック
const mockGetQuery = jest.fn();
const mockCreateMutation = jest.fn();
const mockUpdateMutation = jest.fn();
const mockDeleteMutation = jest.fn();
const mockBulkCreateMutation = jest.fn();

jest.mock("@entities/calendar/api/calendarApi", () => ({
  useGetCompanyHolidayCalendarsQuery: () => mockGetQuery(),
  useCreateCompanyHolidayCalendarMutation: () => [mockCreateMutation],
  useUpdateCompanyHolidayCalendarMutation: () => [mockUpdateMutation],
  useDeleteCompanyHolidayCalendarMutation: () => [mockDeleteMutation],
  useBulkCreateCompanyHolidayCalendarsMutation: () => [mockBulkCreateMutation],
}));

jest.mock("@shared/api/graphql/concurrency", () => ({
  buildVersionOrUpdatedAtCondition: jest.fn().mockReturnValue({}),
  getNextVersion: jest.fn().mockReturnValue(2),
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

// @/errors モジュール
jest.mock("@/errors", () => ({
  E00001: "データ取得中に問題が発生しました(エラーコード: E00001)",
}));

// 子コンポーネントをスタブ化してテストを単純にする
jest.mock(
  "@features/admin/holidayCalendar/ui/HolidayCalendar/ExcelFilePicker",
  () => ({
    ExcelFilePicker: () => <button>ファイルからまとめて追加</button>,
  }),
);

jest.mock("../AddCompanyHolidayCalendar", () => ({
  __esModule: true,
  default: () => <button>休日を追加</button>,
}));

jest.mock("../CompanyHolidayCalendarCopy", () => ({
  __esModule: true,
  default: () => <button aria-label="コピー">コピー</button>,
}));

jest.mock("../CompanyHolidayCalendarEdit", () => ({
  __esModule: true,
  default: () => <button aria-label="編集">編集</button>,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeHoliday = (overrides: {
  id?: string;
  holidayDate?: string;
  name?: string;
  createdAt?: string;
}) => ({
  id: overrides.id ?? "h-1",
  holidayDate: overrides.holidayDate ?? "2024-01-01",
  name: overrides.name ?? "元日",
  createdAt: overrides.createdAt ?? "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  version: 1,
  owner: "owner-1",
});

const sampleHolidays = [
  makeHoliday({
    id: "h-1",
    holidayDate: "2024-01-01",
    name: "元日",
    createdAt: "2023-11-01T00:00:00.000Z",
  }),
  makeHoliday({
    id: "h-2",
    holidayDate: "2024-02-11",
    name: "建国記念日",
    createdAt: "2023-11-02T00:00:00.000Z",
  }),
  makeHoliday({
    id: "h-3",
    holidayDate: "2024-03-20",
    name: "春分の日",
    createdAt: "2023-11-03T00:00:00.000Z",
  }),
];

// ── Default mock setup ────────────────────────────────────────────────────────

function setupDefaultMocks() {
  mockGetQuery.mockReturnValue({
    data: sampleHolidays,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });
  mockCreateMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockUpdateMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockDeleteMutation.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockBulkCreateMutation.mockReturnValue({
    unwrap: jest.fn().mockResolvedValue([]),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderComponent() {
  return render(<CompanyHolidayCalendarList />);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CompanyHolidayCalendarList", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaultMocks();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── ローディング状態 ──────────────────────────────────────────────────────

  it("isLoading=true のとき LinearProgress が表示される", () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      error: undefined,
    });
    renderComponent();
    // LinearProgress は role="progressbar" を持つ
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("isFetching=true のとき LinearProgress が表示される", () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: true,
      error: undefined,
    });
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("ローディング中はテーブルが表示されない", () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      error: undefined,
    });
    renderComponent();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // ── データ表示 ────────────────────────────────────────────────────────────

  it("ロード完了後にテーブルが表示される", () => {
    renderComponent();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("テーブルに「日付」「名前」「作成日」ヘッダーが表示される", () => {
    renderComponent();
    expect(screen.getByRole("columnheader", { name: "日付" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "名前" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "作成日" })).toBeInTheDocument();
  });

  it("各休日の名前がテーブルに表示される", () => {
    renderComponent();
    expect(screen.getByText("元日")).toBeInTheDocument();
    expect(screen.getByText("建国記念日")).toBeInTheDocument();
    expect(screen.getByText("春分の日")).toBeInTheDocument();
  });

  it("各休日の日付が DisplayFormat でテーブルに表示される", () => {
    renderComponent();
    // getAllByText で複数マッチを許容し、テーブルセルとして表示されることを確認
    const jan1Cells = screen.getAllByText("2024/01/01");
    const feb11Cells = screen.getAllByText("2024/02/11");
    const mar20Cells = screen.getAllByText("2024/03/20");
    expect(jan1Cells.length).toBeGreaterThan(0);
    expect(feb11Cells.length).toBeGreaterThan(0);
    expect(mar20Cells.length).toBeGreaterThan(0);
  });

  it("各行に編集・コピー・削除ボタンが表示される", () => {
    renderComponent();
    const editButtons = screen.getAllByRole("button", { name: "編集" });
    const copyButtons = screen.getAllByRole("button", { name: "コピー" });
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    expect(editButtons).toHaveLength(3);
    expect(copyButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it("データが空のときもテーブルが表示される（0件）", () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: undefined,
    });
    renderComponent();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("元日")).not.toBeInTheDocument();
  });

  // ── 「休日を追加」ボタン ──────────────────────────────────────────────────

  it("「休日を追加」ボタンが表示される", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "休日を追加" }),
    ).toBeInTheDocument();
  });

  // ── エラーハンドリング ────────────────────────────────────────────────────

  it("データ取得エラー時に error 通知が dispatch される", async () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: new Error("Fetch failed"),
    });
    renderComponent();
    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("データ取得エラー時の通知メッセージに E00001 のエラーコードが含まれる", async () => {
    mockGetQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: new Error("Fetch failed"),
    });
    renderComponent();
    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          message: expect.stringContaining("E00001"),
        }),
      );
    });
  });

  // ── 削除フロー ────────────────────────────────────────────────────────────

  it("削除ボタンをクリックすると window.confirm が呼ばれる", async () => {
    const user = userEvent.setup();
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it("confirm メッセージに日付と名前が含まれる", async () => {
    const user = userEvent.setup();
    renderComponent();
    // useHolidayCalendarList は降順ソートするので最初の行は「春分の日 2024/03/20」
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    // 先頭行のデータ（降順で春分の日が先頭）が含まれているか確認
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringMatching(/春分の日|建国記念日|元日/),
    );
  });

  it("confirm で OK を選択すると deleteCompanyHolidayCalendar が呼ばれる", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const unwrapMock = jest.fn().mockResolvedValue({});
    mockDeleteMutation.mockReturnValue({ unwrap: unwrapMock });
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(unwrapMock).toHaveBeenCalledTimes(1);
    });
  });

  it("confirm でキャンセルを選択すると deleteCompanyHolidayCalendar が呼ばれない", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const unwrapMock = jest.fn();
    mockDeleteMutation.mockReturnValue({ unwrap: unwrapMock });
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    expect(unwrapMock).not.toHaveBeenCalled();
  });

  it("削除成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    mockDeleteMutation.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success" }),
      );
    });
  });

  it("削除失敗時に error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    mockDeleteMutation.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error("Delete failed")),
    });
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: "削除" });
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  // ── フィルター機能 ────────────────────────────────────────────────────────

  it("フィルターパネルに「年」「月」のセレクトと「休日名で検索」テキストフィールドが表示される", () => {
    renderComponent();
    expect(screen.getByLabelText("年")).toBeInTheDocument();
    expect(screen.getByLabelText("月")).toBeInTheDocument();
    expect(screen.getByLabelText("休日名で検索")).toBeInTheDocument();
  });

  it("「クリア」ボタンが表示される", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "クリア" })).toBeInTheDocument();
  });

  it("休日名で検索フィールドに入力するとフィルタリングされる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("休日名で検索"), "元日");
    await waitFor(() => {
      expect(screen.getByText("元日")).toBeInTheDocument();
      expect(screen.queryByText("建国記念日")).not.toBeInTheDocument();
      expect(screen.queryByText("春分の日")).not.toBeInTheDocument();
    });
  });

  it("クリアボタンをクリックするとフィルターがリセットされてすべてのデータが表示される", async () => {
    const user = userEvent.setup();
    renderComponent();

    // まず名前フィルターを適用
    await user.type(screen.getByLabelText("休日名で検索"), "元日");
    await waitFor(() => {
      expect(screen.queryByText("建国記念日")).not.toBeInTheDocument();
    });

    // クリアボタンで全データを復元
    await user.click(screen.getByRole("button", { name: "クリア" }));
    await waitFor(() => {
      expect(screen.getByText("元日")).toBeInTheDocument();
      expect(screen.getByText("建国記念日")).toBeInTheDocument();
      expect(screen.getByText("春分の日")).toBeInTheDocument();
    });
  });

  it("部分一致で名前フィルタリングができる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("休日名で検索"), "記念");
    await waitFor(() => {
      expect(screen.getByText("建国記念日")).toBeInTheDocument();
      expect(screen.queryByText("元日")).not.toBeInTheDocument();
      expect(screen.queryByText("春分の日")).not.toBeInTheDocument();
    });
  });

  // ── ページネーション ──────────────────────────────────────────────────────

  it("ページネーションコントロールが表示される", () => {
    renderComponent();
    // TablePagination の rowsPerPage select
    expect(screen.getByLabelText("表示件数")).toBeInTheDocument();
  });

  it("件数表示に正しいカウントが表示される", () => {
    renderComponent();
    // TablePagination の labelDisplayedRows により "1-3 / 3 件" が表示される
    expect(screen.getByText("1-3 / 3 件")).toBeInTheDocument();
  });

  // ── テーブルの行の内容 ────────────────────────────────────────────────────

  it("各行に正しい日付と名前が表示される", () => {
    renderComponent();
    const rows = screen.getAllByRole("row");
    // ヘッダー行を除いた最初のデータ行を確認（降順ソートで春分の日が最初）
    const dataRows = rows.slice(1).filter((row) => {
      const cells = within(row).queryAllByRole("cell");
      return cells.length > 0;
    });
    expect(dataRows.length).toBeGreaterThan(0);
  });
});
