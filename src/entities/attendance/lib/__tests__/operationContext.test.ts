import {
  buildAttendanceIdempotencyKey,
  resolveAppVersion,
  resolveClientTimeZone,
} from "../operationContext";

describe("resolveClientTimeZone", () => {
  test("タイムゾーン文字列（空でない）を返すこと", () => {
    const tz = resolveClientTimeZone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  test("Intl が利用可能な環境では 'unknown' 以外の値を返すこと", () => {
    // jsdom 環境では Intl.DateTimeFormat が利用可能
    const tz = resolveClientTimeZone();
    expect(tz).not.toBe("unknown");
  });
});

describe("resolveAppVersion", () => {
  const origAppVersion = process.env.VITE_APP_VERSION;
  const origCommitSha = process.env.VITE_COMMIT_SHA;

  afterEach(() => {
    // 各テスト後に元の値へ戻す
    process.env.VITE_APP_VERSION = origAppVersion;
    process.env.VITE_COMMIT_SHA = origCommitSha;
  });

  test("VITE_APP_VERSION / VITE_COMMIT_SHA が未設定の場合 'unknown' を返すこと", () => {
    delete process.env.VITE_APP_VERSION;
    delete process.env.VITE_COMMIT_SHA;

    expect(resolveAppVersion()).toBe("unknown");
  });

  test("VITE_APP_VERSION が設定されている場合、その値を返すこと", () => {
    process.env.VITE_APP_VERSION = "1.2.3";
    delete process.env.VITE_COMMIT_SHA;

    expect(resolveAppVersion()).toBe("1.2.3");
  });

  test("VITE_APP_VERSION が未設定で VITE_COMMIT_SHA が設定されている場合、VITE_COMMIT_SHA を返すこと", () => {
    delete process.env.VITE_APP_VERSION;
    process.env.VITE_COMMIT_SHA = "abc1234";

    expect(resolveAppVersion()).toBe("abc1234");
  });

  test("VITE_APP_VERSION が優先され VITE_COMMIT_SHA より先に使われること", () => {
    process.env.VITE_APP_VERSION = "2.0.0";
    process.env.VITE_COMMIT_SHA = "abc1234";

    expect(resolveAppVersion()).toBe("2.0.0");
  });
});

describe("buildAttendanceIdempotencyKey", () => {
  const params = {
    action: "clock_in" as const,
    staffId: "staff-123",
    occurredAt: "2024-06-15T09:00:00.000Z",
  };

  test("'action:staffId:occurredAt:suffix' 形式のキーを返すこと", () => {
    const key = buildAttendanceIdempotencyKey(params);
    expect(key).toMatch(/^clock_in:staff-123:2024-06-15T09:00:00\.000Z:.+$/);
  });

  test("同じ引数でも呼び出しごとに異なるキーを返すこと（ランダムサフィックス）", () => {
    const key1 = buildAttendanceIdempotencyKey(params);
    const key2 = buildAttendanceIdempotencyKey(params);
    expect(key1).not.toBe(key2);
  });

  test("異なる action を指定した場合、キーの先頭が対応する action になること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "clock_out" });
    expect(key.startsWith("clock_out:")).toBe(true);
  });

  test("go_directly アクションのキーが正しい形式であること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "go_directly" });
    expect(key).toMatch(/^go_directly:staff-123:.+:.+$/);
  });

  test("return_directly アクションのキーが正しい形式であること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "return_directly" });
    expect(key).toMatch(/^return_directly:staff-123:.+:.+$/);
  });

  test("rest_start アクションのキーが正しい形式であること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "rest_start" });
    expect(key).toMatch(/^rest_start:staff-123:.+:.+$/);
  });

  test("rest_end アクションのキーが正しい形式であること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "rest_end" });
    expect(key).toMatch(/^rest_end:staff-123:.+:.+$/);
  });

  test("manual アクションのキーが正しい形式であること", () => {
    const key = buildAttendanceIdempotencyKey({ ...params, action: "manual" });
    expect(key).toMatch(/^manual:staff-123:.+:.+$/);
  });

  test("staffId と occurredAt がコロン区切りでキーに埋め込まれること", () => {
    const key = buildAttendanceIdempotencyKey({
      action: "clock_in",
      staffId: "user-999",
      occurredAt: "2025-01-01T00:00:00.000Z",
    });
    expect(key).toContain(":user-999:");
    expect(key).toContain(":2025-01-01T00:00:00.000Z:");
  });
});
