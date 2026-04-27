import type { ShiftPatternStorageRecord } from "../shiftPatternStorage";
import { loadShiftPatterns, saveShiftPatterns } from "../shiftPatternStorage";

// ─────────────────────────────────────────────────────────────
// モック定義（jest.mock は巻き上げられるため先頭に記述）
// ─────────────────────────────────────────────────────────────
const mockDownloadData = jest.fn();
const mockUploadData = jest.fn();

jest.mock("aws-amplify/storage", () => ({
  downloadData: (...args: unknown[]) => mockDownloadData(...args),
  uploadData: (...args: unknown[]) => mockUploadData(...args),
}));

jest.mock("@shared/lib/logger", () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// ─────────────────────────────────────────────────────────────
// テストデータ
// ─────────────────────────────────────────────────────────────
const samplePatterns: ShiftPatternStorageRecord[] = [
  { id: "1", name: "早番", mapping: { "2024-01-01": "early" } },
  { id: "2", name: "遅番", mapping: { "2024-01-02": "late" } },
];

/** downloadData の成功レスポンスを組み立てるヘルパー */
const mockDownloadSuccess = (body: unknown) => {
  mockDownloadData.mockReturnValue({
    result: Promise.resolve({ body }),
  });
};

/** downloadData がエラーを返すよう設定するヘルパー */
const mockDownloadError = (error: unknown) => {
  mockDownloadData.mockReturnValue({
    result: Promise.reject(error),
  });
};

// ─────────────────────────────────────────────────────────────
// loadShiftPatterns
// ─────────────────────────────────────────────────────────────
describe("loadShiftPatterns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系", () => {
    it("body が JSON 文字列のとき正しくパターン配列を返す", async () => {
      mockDownloadSuccess(JSON.stringify(samplePatterns));

      const result = await loadShiftPatterns();
      expect(result).toEqual(samplePatterns);
    });

    it("body が text() メソッドを持つオブジェクトのとき正しくパターン配列を返す", async () => {
      // jsdom 環境では Blob/Uint8Array の instanceof チェックが機能しないため、
      // text() メソッドを持つオブジェクト（フォールバックパス）でテストする
      const bodyWithText = {
        text: () => Promise.resolve(JSON.stringify(samplePatterns)),
      };
      mockDownloadSuccess(bodyWithText);

      const result = await loadShiftPatterns();
      expect(result).toEqual(samplePatterns);
    });

    it("空配列 JSON を返した場合は空配列になる", async () => {
      mockDownloadSuccess("[]");

      const result = await loadShiftPatterns();
      expect(result).toEqual([]);
    });

    it("downloadData に正しい key と accessLevel を渡す", async () => {
      mockDownloadSuccess(JSON.stringify(samplePatterns));
      await loadShiftPatterns();

      expect(mockDownloadData).toHaveBeenCalledWith({
        key: "shift-request/patterns.json",
        options: { accessLevel: "private" },
      });
    });
  });

  describe("Not Found エラー（空配列を返す）", () => {
    it.each([
      ["NoSuchKey（name）", { name: "NoSuchKey" }],
      ["NotFound（code）", { code: "NotFound" }],
      ["404（statusCode）", { statusCode: 404 }],
      ["404（$metadata.httpStatusCode）", { $metadata: { httpStatusCode: 404 } }],
    ])("%s エラーで空配列を返す", async (_label, error) => {
      mockDownloadError(error);

      const result = await loadShiftPatterns();
      expect(result).toEqual([]);
    });
  });

  describe("その他エラー（再スロー）", () => {
    it("ネットワークエラーは再スローする", async () => {
      const error = new Error("Network error");
      mockDownloadError(error);

      await expect(loadShiftPatterns()).rejects.toThrow("Network error");
    });

    it("500 系エラーは再スローする", async () => {
      const error = { statusCode: 500, message: "Internal Server Error" };
      mockDownloadError(error);

      await expect(loadShiftPatterns()).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe("ボディ異常系", () => {
    it("body が undefined のとき空配列を返す", async () => {
      mockDownloadSuccess(undefined);
      expect(await loadShiftPatterns()).toEqual([]);
    });

    it("body が空文字のとき空配列を返す", async () => {
      mockDownloadSuccess("");
      expect(await loadShiftPatterns()).toEqual([]);
    });

    it("body が不正 JSON のとき空配列を返す", async () => {
      mockDownloadSuccess("{ invalid json }");
      expect(await loadShiftPatterns()).toEqual([]);
    });

    it("body が JSON だが配列でないとき空配列を返す", async () => {
      mockDownloadSuccess(JSON.stringify({ key: "value" }));
      expect(await loadShiftPatterns()).toEqual([]);
    });

    it("body が JSON null のとき空配列を返す", async () => {
      mockDownloadSuccess(JSON.stringify(null));
      expect(await loadShiftPatterns()).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// saveShiftPatterns
// ─────────────────────────────────────────────────────────────
describe("saveShiftPatterns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadData.mockReturnValue({
      result: Promise.resolve({ key: "shift-request/patterns.json" }),
    });
  });

  it("uploadData を正しい引数で呼び出す", async () => {
    await saveShiftPatterns(samplePatterns);

    expect(mockUploadData).toHaveBeenCalledWith({
      key: "shift-request/patterns.json",
      data: JSON.stringify(samplePatterns),
      options: {
        accessLevel: "private",
        contentType: "application/json",
      },
    });
  });

  it("空配列を保存しても例外が発生しない", async () => {
    await expect(saveShiftPatterns([])).resolves.toBeUndefined();
    expect(mockUploadData).toHaveBeenCalledWith(
      expect.objectContaining({ data: "[]" }),
    );
  });

  it("単一パターンを保存できる", async () => {
    const single: ShiftPatternStorageRecord[] = [
      { id: "x", name: "テスト", mapping: {} },
    ];
    await expect(saveShiftPatterns(single)).resolves.toBeUndefined();
  });

  it("uploadData がエラーを投げた場合は再スローする", async () => {
    mockUploadData.mockReturnValue({
      result: Promise.reject(new Error("upload failed")),
    });
    await expect(saveShiftPatterns(samplePatterns)).rejects.toThrow(
      "upload failed",
    );
  });
});
