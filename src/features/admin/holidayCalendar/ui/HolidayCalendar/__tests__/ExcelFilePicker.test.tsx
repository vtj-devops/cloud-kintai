/**
 * ExcelFilePicker コンポーネントの Jest ユニットテスト
 *
 * カバー範囲:
 * - 初期レンダリング
 * - ダイアログの開閉
 * - テンプレートダウンロード
 * - ファイル選択 / CSV パース（正常・異常）
 * - 登録フロー（成功・失敗・キャンセル）
 * - エッジケース（BOM, CRLF, 無効日付, 空データ等）
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { ExcelFilePicker } from "../ExcelFilePicker";

// ── Module mocks ──────────────────────────────────────────────────────────────

// CSVテンプレートファイル（バイナリ/静的アセット）
jest.mock("@/templates/company_holiday.csv", () => "mock-csv-url");

// Redux dispatch
const mockDispatch = jest.fn();
jest.mock("@app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

// notificationSlice: pushNotification をキャプチャ可能なスパイにする
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

// AttendanceDate.DataFormat
jest.mock("@entities/attendance/lib/AttendanceDate", () => ({
  AttendanceDate: { DataFormat: "YYYY-MM-DD" },
}));

// ── FileReader mock ───────────────────────────────────────────────────────────

type MockReaderInstance = {
  readAsText: jest.Mock;
  onload: ((e: { target: { result: string | null } }) => void) | null;
  onerror: (() => void) | null;
};

const capturedReaders: MockReaderInstance[] = [];

class MockFileReader {
  readAsText = jest.fn();
  onload: MockReaderInstance["onload"] = null;
  onerror: MockReaderInstance["onerror"] = null;
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capturedReaders.push(this as any);
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, "FileReader", {
    value: MockFileReader,
    writable: true,
    configurable: true,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_CSV =
  "holiday_date,name\n2024-01-01,元日\n2024-02-11,建国記念の日";
const EMPTY_DATA_CSV = "holiday_date,name\n";
const MISSING_HEADER_CSV = "date,holiday_name\n2024-01-01,元日";
const BOM_CSV = "\uFEFFholiday_date,name\n2024-01-01,元日";
const CRLF_CSV =
  "holiday_date,name\r\n2024-01-01,元日\r\n2024-02-11,建国記念の日";
const INVALID_DATE_CSV =
  "holiday_date,name\nnot-a-date,無効な日付\n2024-01-01,元日";
const MISSING_FIELDS_CSV = "holiday_date,name\n,名前なし\n2024-01-01,";

/** テスト用 File オブジェクトを生成する */
function createFile(name: string, content: string): File {
  return new File([content], name, { type: "text/csv" });
}

/** ファイル入力に File を設定して change イベントを発火する */
function selectFile(file: File) {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  // files は読み取り専用なので Object.defineProperty で上書きする
  const fileList = {
    item: (i: number) => (i === 0 ? file : null),
    length: 1,
    0: file,
  };
  Object.defineProperty(input, "files", {
    value: fileList,
    configurable: true,
  });
  fireEvent.change(input);
}

/** 最後に生成された MockFileReader インスタンスを取得する */
function getLastReader(): MockReaderInstance {
  return capturedReaders[capturedReaders.length - 1];
}

/** FileReader.onload を指定した result で発火する */
function triggerLoad(result: string | null) {
  getLastReader().onload?.({ target: { result } });
}

/** FileReader.onerror を発火する */
function triggerError() {
  getLastReader().onerror?.();
}

/** コンポーネントをレンダリングし、bulkCreate モックと共に返す */
function renderComponent(
  bulkCreate: jest.Mock = jest.fn().mockResolvedValue([]),
) {
  render(<ExcelFilePicker bulkCreateCompanyHolidayCalendar={bulkCreate} />);
  return { bulkCreate };
}

/** 「ファイルからまとめて追加」ボタンをクリックしてダイアログを開く */
async function openDialog() {
  await userEvent.click(
    screen.getByRole("button", { name: /ファイルからまとめて追加/ }),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ExcelFilePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedReaders.length = 0;
    jest.spyOn(window, "confirm").mockReturnValue(true);
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

  // ── ダイアログの開閉 ─────────────────────────────────────────────────────

  it("ボタンをクリックするとダイアログが開く", async () => {
    renderComponent();
    await openDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ファイルからまとめて追加" }),
    ).toBeInTheDocument();
  });

  it("ダイアログ内に「ファイルを選択」ボタンが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByRole("button", { name: /ファイルを選択/ }),
    ).toBeInTheDocument();
  });

  it("キャンセルボタンをクリックするとダイアログが閉じる", async () => {
    renderComponent();
    await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("ダイアログ内のガイダンステキストが表示される", async () => {
    renderComponent();
    await openDialog();
    expect(
      screen.getByText(/専用のテンプレートファイルをダウンロードしてください/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/テンプレートに登録したい休日を入力し/),
    ).toBeInTheDocument();
  });

  // ── テンプレートダウンロード ──────────────────────────────────────────────

  it("テンプレートボタンをクリックするとアンカーがクリックされ CSV がダウンロードされる", async () => {
    renderComponent();
    await openDialog();

    const mockClick = jest.fn();
    const mockAnchor = { href: "", download: "", click: mockClick };

    // renderComponent の後にスパイを設定し、"a" タグだけをインターセプト
    const realCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return mockAnchor as unknown as HTMLElement;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return realCreateElement(tagName as any);
    });

    await userEvent.click(screen.getByRole("button", { name: /テンプレート/ }));

    expect(mockAnchor.href).toBe("mock-csv-url");
    expect(mockAnchor.download).toBe("company_holiday.csv");
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  // ── ファイル選択（正常系）────────────────────────────────────────────────

  it("有効な CSV ファイルを選択するとファイル名が表示される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await waitFor(() => {
      expect(screen.getByText("holidays.csv")).toBeInTheDocument();
    });
  });

  it("有効な CSV を選択して登録ボタンをクリックすると bulkCreate が呼ばれる", async () => {
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkCreate).toHaveBeenCalledTimes(1);
      expect(bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            holidayDate: "2024-01-01",
            name: "元日",
          }),
          expect.objectContaining({
            holidayDate: "2024-02-11",
            name: "建国記念の日",
          }),
        ]),
      );
    });
  });

  it("bulkCreate 成功時に success 通知が dispatch される", async () => {
    const { bulkCreate } = renderComponent(
      jest.fn().mockResolvedValue([]),
    );
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      const successCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "success",
      );
      expect(successCall).toBeDefined();
    });
    // 成功後にダイアログが閉じる
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    // bulkCreate が参照されていたことを確認（unused warning 回避）
    expect(bulkCreate).toHaveBeenCalled();
  });

  it("bulkCreate 失敗時に error 通知が dispatch される", async () => {
    renderComponent(jest.fn().mockRejectedValue(new Error("Server Error")));
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      const errorCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "error",
      );
      expect(errorCall).toBeDefined();
    });
  });

  it("CRLF 改行の CSV もパースできる", async () => {
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("crlf.csv", CRLF_CSV));
    triggerLoad(CRLF_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ holidayDate: "2024-01-01", name: "元日" }),
          expect.objectContaining({
            holidayDate: "2024-02-11",
            name: "建国記念の日",
          }),
        ]),
      );
    });
  });

  it("BOM 付き CSV ファイルを正しくパースできる", async () => {
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("bom.csv", BOM_CSV));
    triggerLoad(BOM_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({ holidayDate: "2024-01-01", name: "元日" }),
      ]);
    });
  });

  it("不正な日付を含む行はスキップされ有効なデータのみ登録される", async () => {
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("partial.csv", INVALID_DATE_CSV));
    triggerLoad(INVALID_DATE_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({ holidayDate: "2024-01-01", name: "元日" }),
      ]);
    });
  });

  it("登録ボタンクリック時の confirm メッセージにデータ件数が含まれる", async () => {
    const confirmSpy = jest
      .spyOn(window, "confirm")
      .mockReturnValue(false);
    renderComponent();
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    // VALID_CSV には 2 件のデータがある
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("2件"),
    );
  });

  // ── 登録フロー（キャンセル・空データ）──────────────────────────────────────

  it("データがない状態で登録ボタンをクリックしても bulkCreate は呼ばれない", async () => {
    const { bulkCreate } = renderComponent();
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    expect(bulkCreate).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("confirm でキャンセルすると bulkCreate は呼ばれない", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("holidays.csv", VALID_CSV));
    triggerLoad(VALID_CSV);

    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    expect(bulkCreate).not.toHaveBeenCalled();
  });

  // ── ファイル選択（異常系）────────────────────────────────────────────────

  it("データが空の CSV を選択すると error 通知が dispatch される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("empty.csv", EMPTY_DATA_CSV));
    triggerLoad(EMPTY_DATA_CSV);

    await waitFor(() => {
      const errorCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "error",
      );
      expect(errorCall).toBeDefined();
    });
  });

  it("ヘッダーが不正な CSV を選択すると error 通知が dispatch される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("bad_header.csv", MISSING_HEADER_CSV));
    triggerLoad(MISSING_HEADER_CSV);

    await waitFor(() => {
      const errorCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "error",
      );
      expect(errorCall).toBeDefined();
    });
  });

  it("FileReader の result が null のとき error 通知が dispatch される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("null.csv", ""));
    triggerLoad(null);

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("FileReader の result が空文字のとき error 通知が dispatch される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("empty_result.csv", ""));
    triggerLoad("");

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("FileReader の onerror が発生すると error 通知が dispatch される", async () => {
    renderComponent();
    await openDialog();

    selectFile(createFile("error.csv", "content"));
    triggerError();

    await waitFor(() => {
      expect(pushNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error" }),
      );
    });
  });

  it("ファイルが選択されない場合（files が空）は FileReader が生成されない", async () => {
    renderComponent();
    await openDialog();

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: { item: () => null, length: 0 },
      configurable: true,
    });
    fireEvent.change(input);

    expect(capturedReaders).toHaveLength(0);
  });

  it("必須フィールドが欠けている行はスキップされ残りのデータのみ登録される", async () => {
    // MISSING_FIELDS_CSV: date のみ・name のみの行 → すべてスキップ
    const { bulkCreate } = renderComponent();
    await openDialog();

    selectFile(createFile("missing_fields.csv", MISSING_FIELDS_CSV));
    triggerLoad(MISSING_FIELDS_CSV);

    // データが 0 件になるので error 通知が dispatch される
    await waitFor(() => {
      const errorCall = pushNotificationMock.mock.calls.find(
        ([payload]) => payload.tone === "error",
      );
      expect(errorCall).toBeDefined();
    });
    expect(bulkCreate).not.toHaveBeenCalled();
  });

  it("ダイアログの form onSubmit でダイアログが閉じる", async () => {
    renderComponent();
    await openDialog();

    // PaperProps.onSubmit をトリガーする（登録ボタンは type="submit"）
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
