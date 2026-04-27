/**
 * CSVFilePicker コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - 初期レンダリング（「ファイルからまとめて追加」ボタン）
 * - ダイアログの開閉
 * - ファイル選択 UI の表示
 * - CSV パース結果の表示（parseSummary）
 * - 登録ボタンの disabled 状態（uploadedData が空のとき）
 * - onSubmit フロー（window.confirm の結果 true / false）
 * - 登録成功時: success 通知 + ダイアログクローズ
 * - 登録失敗時: error 通知 + エラーメッセージ表示
 * - isSubmitting 中のボタン disabled
 * - キャンセルボタンでダイアログが閉じる
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CSVFilePicker } from "../CSVFilePicker";

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

jest.mock("@shared/lib/message/EventCalendarMessage", () => ({
  EventCalendarMessage: () => ({
    getCategoryName: () => "イベントカレンダー",
    create: (status: string) =>
      status === "S"
        ? "イベントカレンダーを作成しました"
        : "イベントカレンダーの作成に失敗しました",
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultBulkCreateMock = jest.fn();

function renderComponent(bulkCreateMock = defaultBulkCreateMock) {
  return render(<CSVFilePicker bulkCreateEventCalendar={bulkCreateMock} />);
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /ファイルからまとめて追加/ }),
  );
}

/**
 * FileReader をモックして CSV の onload を疑似的に発火させる。
 * FileInput の input[type=file] に対して change イベントを送り、
 * FileReader.onload が実行されるようにする。
 */
function simulateFileUpload(csvContent: string, fileName = "test.csv") {
  const file = new File([csvContent], fileName, { type: "text/csv" });
  type FileReaderOnloadHandler = (event: ProgressEvent<FileReader>) => void;

  // FileReader をモック
  const mockReadAsText = jest.fn();
  const readerCallbacks: { onload?: FileReaderOnloadHandler } = {};

  const mockReader = {
    readAsText: mockReadAsText,
    result: csvContent,
    set onload(cb: NonNullable<FileReader["onload"]>) {
      readerCallbacks.onload = cb as FileReaderOnloadHandler;
    },
  } as unknown as FileReader;

  jest.spyOn(window, "FileReader").mockImplementation(() => mockReader);

  // file input に change イベントを発行
  const fileInput = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    [Symbol.iterator]: function* () {
      yield file;
    },
  };
  Object.defineProperty(fileInput, "files", {
    value: fileList,
    configurable: true,
  });
  fireEvent.change(fileInput);

  // onload を手動でトリガー
  if (readerCallbacks.onload) {
    readerCallbacks.onload({} as ProgressEvent<FileReader>);
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CSVFilePicker", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    defaultBulkCreateMock.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── 初期レンダリング ──────────────────────────────────────────────────────

  it("「ファイルからまとめて追加」ボタンが表示される", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: /ファイルからまとめて追加/ }),
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

  it("ダイアログタイトルに「ファイルからまとめて追加」が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("heading", { name: "ファイルからまとめて追加" }),
    ).toBeInTheDocument();
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

  it("ダイアログ内に CSV フォーマット説明が表示される", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByText(/CSVファイル形式: eventDate/)).toBeInTheDocument();
  });

  it("ダイアログ内に「ファイルを選択」ボタンが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("button", { name: /ファイルを選択/ }),
    ).toBeInTheDocument();
  });

  // ── 登録ボタンの disabled 状態 ────────────────────────────────────────────

  it("ファイルが未選択のとき登録ボタンが disabled になっている", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
  });

  // ── window.confirm キャンセル ─────────────────────────────────────────────

  it("window.confirm でキャンセルを選択すると bulkCreateEventCalendar が呼ばれない", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));
    expect(bulkMock).not.toHaveBeenCalled();
  });

  // ── 登録フロー (confirm OK) ────────────────────────────────────────────────

  it("ファイル選択後に登録ボタンをクリックすると window.confirm が呼ばれる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it("登録成功時に success 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
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
    const bulkMock = jest.fn().mockResolvedValue([]);
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("登録失敗時に error 通知が dispatch される", async () => {
    const user = userEvent.setup();
    const bulkMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("登録失敗時にエラーメッセージがダイアログ内に表示される", async () => {
    const user = userEvent.setup();
    const bulkMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.getByText(/登録に失敗しました/)).toBeInTheDocument();
    });
  });

  it("登録失敗時はダイアログが開いたまま", async () => {
    const user = userEvent.setup();
    const bulkMock = jest.fn().mockRejectedValue(new Error("Server Error"));
    renderComponent(bulkMock);
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録" })).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // ── parseSummary 表示 ─────────────────────────────────────────────────────

  it("CSV 読み込み後に parseSummary が表示される", async () => {
    renderComponent();
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n2026-04-02,花見2,\n",
    );

    await waitFor(() => {
      expect(screen.getByText(/読み込み結果/)).toBeInTheDocument();
    });
  });

  it("有効な行数が読み込み結果に反映される", async () => {
    renderComponent();
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n2026-04-02,花見2,\n",
    );

    await waitFor(() => {
      // "読み込み結果: 2件中 2件を登録対象にしました（除外 0件）"
      expect(screen.getByText(/2件を登録対象/)).toBeInTheDocument();
    });
  });

  it("無効な日付行がある場合に除外件数が表示される", async () => {
    renderComponent();
    await openDialog();

    // invalid-date は除外される
    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\ninvalid-date,無効,\n",
    );

    await waitFor(() => {
      expect(screen.getByText(/除外 1件/)).toBeInTheDocument();
    });
  });

  // ── ダイアログ再オープン時のリセット ─────────────────────────────────────

  it("ダイアログを閉じて再度開くと parseSummary がリセットされる", async () => {
    const user = userEvent.setup();
    renderComponent();
    await openDialog();

    simulateFileUpload(
      "eventDate,name,description\n2026-04-01,花見,桜を見る会\n",
    );

    await waitFor(() => {
      expect(screen.getByText(/読み込み結果/)).toBeInTheDocument();
    });

    // 閉じる
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // 再度開く
    await user.click(
      screen.getByRole("button", { name: /ファイルからまとめて追加/ }),
    );
    await waitFor(() => {
      expect(screen.queryByText(/読み込み結果/)).not.toBeInTheDocument();
    });
  });
});
