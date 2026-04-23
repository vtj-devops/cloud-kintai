import { webcrypto } from "node:crypto";

import { generateOfficeQrToken } from "@features/attendance/office-qr/lib/generateToken";
import dayjs from "dayjs";

import { validateOfficeQrToken } from "../validateToken";

// jsdom 環境では crypto.subtle が未定義のため Node.js の WebCrypto API を差し込む
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  writable: true,
  configurable: true,
});

// validateOfficeQrToken は VITE_TOKEN_SECRET が必須。
// generateOfficeQrToken は VITE_TOKEN_SECRET があればそれを使い、なければ DEFAULT_SECRET を使う。
// 両方に同じシークレットを設定して整合性を取る。
const TEST_SECRET = "test_secret_for_validate";

describe("validateOfficeQrToken", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, VITE_TOKEN_SECRET: TEST_SECRET };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // ----------------------------------------------------------------
  // null / 欠損チェック
  // ----------------------------------------------------------------
  it("timestamp が null のとき false を返す", async () => {
    const result = await validateOfficeQrToken(null, "sometoken");
    expect(result).toBe(false);
  });

  it("token が null のとき false を返す", async () => {
    const result = await validateOfficeQrToken("1700000000", null);
    expect(result).toBe(false);
  });

  it("両方 null のとき false を返す", async () => {
    const result = await validateOfficeQrToken(null, null);
    expect(result).toBe(false);
  });

  // ----------------------------------------------------------------
  // VITE_TOKEN_SECRET 未設定
  // ----------------------------------------------------------------
  it("VITE_TOKEN_SECRET が未設定のとき false を返す", async () => {
    delete process.env.VITE_TOKEN_SECRET;
    const result = await validateOfficeQrToken("1700000000", btoa("1700000000:dummy"));
    expect(result).toBe(false);
  });

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------
  it("有効なトークンに対して true を返す", async () => {
    const timestamp = dayjs().unix();
    const token = await generateOfficeQrToken(timestamp);
    const result = await validateOfficeQrToken(String(timestamp), token);
    expect(result).toBe(true);
  });

  // ----------------------------------------------------------------
  // 境界値: TTL
  // ----------------------------------------------------------------
  it("TOKEN_TTL_SECONDS(30秒) 以上古いトークンは false を返す", async () => {
    const expiredTimestamp = dayjs().unix() - 31; // 31秒前
    const token = await generateOfficeQrToken(expiredTimestamp);
    const result = await validateOfficeQrToken(String(expiredTimestamp), token);
    expect(result).toBe(false);
  });

  it("29 秒前のトークンは有効で true を返す", async () => {
    const recentTimestamp = dayjs().unix() - 29;
    const token = await generateOfficeQrToken(recentTimestamp);
    const result = await validateOfficeQrToken(String(recentTimestamp), token);
    expect(result).toBe(true);
  });

  // ----------------------------------------------------------------
  // エラー系
  // ----------------------------------------------------------------
  it("タイムスタンプ文字列とトークン内タイムスタンプが不一致なら false を返す", async () => {
    const timestamp = dayjs().unix();
    const token = await generateOfficeQrToken(timestamp);
    // 異なるタイムスタンプ文字列を渡す
    const result = await validateOfficeQrToken(String(timestamp + 1), token);
    expect(result).toBe(false);
  });

  it("改ざんされた署名を含むトークンで false を返す", async () => {
    const timestamp = dayjs().unix();
    const tamperedToken = btoa(`${timestamp}:invalidsignature`);
    const result = await validateOfficeQrToken(String(timestamp), tamperedToken);
    expect(result).toBe(false);
  });

  it("数値でないタイムスタンプで false を返す", async () => {
    const token = btoa("notanumber:invalidsignature");
    const result = await validateOfficeQrToken("notanumber", token);
    expect(result).toBe(false);
  });
});
