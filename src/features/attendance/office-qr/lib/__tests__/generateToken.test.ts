import { webcrypto } from "node:crypto";

import { generateOfficeQrToken } from "../generateToken";

// jsdom 環境では crypto.subtle が未定義のため Node.js の WebCrypto API を差し込む
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  writable: true,
  configurable: true,
});

describe("generateOfficeQrToken", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // VITE_TOKEN_SECRET を未設定にして DEFAULT_SECRET("default_secret") を使用
    process.env = { ...ORIGINAL_ENV };
    delete process.env.VITE_TOKEN_SECRET;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // ----------------------------------------------------------------
  // 正常系
  // ----------------------------------------------------------------
  it("タイムスタンプを受け取り、base64 文字列のトークンを返す", async () => {
    const token = await generateOfficeQrToken(1700000000);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("デコードするとタイムスタンプが先頭部分に含まれる", async () => {
    const timestamp = 1700000000;
    const token = await generateOfficeQrToken(timestamp);
    const decoded = atob(token); // "${timestamp}:${signature}"
    expect(decoded.startsWith(`${timestamp}:`)).toBe(true);
  });

  it("同じタイムスタンプで常に同じトークンを生成する（決定論的）", async () => {
    const timestamp = 1700000000;
    const token1 = await generateOfficeQrToken(timestamp);
    const token2 = await generateOfficeQrToken(timestamp);
    expect(token1).toBe(token2);
  });

  // ----------------------------------------------------------------
  // 境界値
  // ----------------------------------------------------------------
  it("タイムスタンプ 0 でもトークンを生成できる", async () => {
    const token = await generateOfficeQrToken(0);
    expect(typeof token).toBe("string");
    const decoded = atob(token);
    expect(decoded.startsWith("0:")).toBe(true);
  });

  it("異なるタイムスタンプで異なるトークンを生成する", async () => {
    const token1 = await generateOfficeQrToken(1700000000);
    const token2 = await generateOfficeQrToken(1700000001);
    expect(token1).not.toBe(token2);
  });

  // ----------------------------------------------------------------
  // VITE_TOKEN_SECRET による切り替え
  // ----------------------------------------------------------------
  it("VITE_TOKEN_SECRET を変えると異なるトークンを生成する", async () => {
    const timestamp = 1700000000;

    // デフォルトシークレット（"default_secret"）で生成
    const tokenDefault = await generateOfficeQrToken(timestamp);

    // カスタムシークレットで生成
    process.env.VITE_TOKEN_SECRET = "custom_secret";
    const tokenCustom = await generateOfficeQrToken(timestamp);

    expect(tokenDefault).not.toBe(tokenCustom);
  });
});
