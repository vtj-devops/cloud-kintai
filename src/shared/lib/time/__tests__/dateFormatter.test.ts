import dayjs from "dayjs";

import {
  formatDateSlash,
  formatDateTimeReadable,
  formatRelativeDateTime,
  isoDateFromTimestamp,
} from "../dateFormatter";

// ─────────────────────────────────────────────────────────────
// formatDateSlash
// ─────────────────────────────────────────────────────────────
describe("formatDateSlash", () => {
  it("ハイフン区切りの日付をスラッシュ区切りに変換する", () => {
    expect(formatDateSlash("2024-01-15")).toBe("2024/01/15");
    expect(formatDateSlash("2024-12-31")).toBe("2024/12/31");
  });

  it("月・日が 1 桁でも正しく変換する", () => {
    expect(formatDateSlash("2024-03-05")).toBe("2024/03/05");
  });

  it("undefined を渡すと空文字を返す", () => {
    expect(formatDateSlash(undefined)).toBe("");
  });

  it("null を渡すと空文字を返す", () => {
    expect(formatDateSlash(null)).toBe("");
  });

  it("空文字を渡すと空文字を返す", () => {
    expect(formatDateSlash("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// isoDateFromTimestamp
// ─────────────────────────────────────────────────────────────
describe("isoDateFromTimestamp", () => {
  it("ISO タイムスタンプから日付部分（YYYY-MM-DD）を取り出す", () => {
    expect(isoDateFromTimestamp("2024-05-06T12:34:56.000Z")).toBe("2024-05-06");
  });

  it("タイムゾーンオフセット付きタイムスタンプでも日付部分を取り出す", () => {
    expect(isoDateFromTimestamp("2024-01-01T00:00:00+09:00")).toBe("2024-01-01");
  });

  it("undefined を渡すと空文字を返す", () => {
    expect(isoDateFromTimestamp(undefined)).toBe("");
  });

  it("null を渡すと空文字を返す", () => {
    expect(isoDateFromTimestamp(null)).toBe("");
  });

  it("空文字を渡すと空文字を返す", () => {
    expect(isoDateFromTimestamp("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// formatDateTimeReadable
// ─────────────────────────────────────────────────────────────
describe("formatDateTimeReadable", () => {
  it("有効な ISO 日時を YYYY/MM/DD HH:mm 形式にフォーマットする", () => {
    const iso = "2024-05-06T12:34:56.000Z";
    expect(formatDateTimeReadable(iso)).toBe(dayjs(iso).format("YYYY/MM/DD HH:mm"));
  });

  it("不正な日時文字列はそのまま返す", () => {
    expect(formatDateTimeReadable("not-a-date")).toBe("not-a-date");
    expect(formatDateTimeReadable("foo-bar")).toBe("foo-bar");
  });

  it("undefined を渡すと空文字を返す", () => {
    expect(formatDateTimeReadable(undefined)).toBe("");
  });

  it("null を渡すと空文字を返す", () => {
    expect(formatDateTimeReadable(null)).toBe("");
  });

  it("空文字を渡すと空文字を返す", () => {
    expect(formatDateTimeReadable("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// formatRelativeDateTime
// ─────────────────────────────────────────────────────────────
describe("formatRelativeDateTime", () => {
  const now = dayjs("2026-03-26T12:00:00+09:00");

  it("elapsed が 0 秒のとき「今」を返す", () => {
    expect(formatRelativeDateTime("2026-03-26T12:00:00+09:00", now)).toBe("今");
  });

  it("未来日時（elapsedSeconds <= 0）でも「今」を返す", () => {
    // 1秒後 → elapsed = -1 → "今"
    expect(formatRelativeDateTime("2026-03-26T12:00:01+09:00", now)).toBe("今");
  });

  it("1 分未満の経過で「N秒前」を返す", () => {
    expect(formatRelativeDateTime("2026-03-26T11:59:40+09:00", now)).toBe("20秒前");
    expect(formatRelativeDateTime("2026-03-26T11:59:01+09:00", now)).toBe("59秒前");
  });

  it("1 時間未満の経過で「N分前」を返す", () => {
    expect(formatRelativeDateTime("2026-03-26T11:55:00+09:00", now)).toBe("5分前");
    expect(formatRelativeDateTime("2026-03-26T11:01:00+09:00", now)).toBe("59分前");
  });

  it("24 時間以内の経過で「N時間前」を返す（同日内）", () => {
    // 同日内 3 時間前：dayDiff=0 → 時間前ブランチ
    expect(formatRelativeDateTime("2026-03-26T09:00:00+09:00", now)).toBe("3時間前");
  });

  it("昨日の日付で「昨日」を返す（dayDiff=1）", () => {
    expect(formatRelativeDateTime("2026-03-25T20:00:00+09:00", now)).toBe("昨日");
  });

  it("2〜6 日前で「N日前」を返す", () => {
    expect(formatRelativeDateTime("2026-03-24T12:00:00+09:00", now)).toBe("2日前");
    expect(formatRelativeDateTime("2026-03-23T12:00:00+09:00", now)).toBe("3日前");
    expect(formatRelativeDateTime("2026-03-20T12:00:00+09:00", now)).toBe("6日前");
  });

  it("7 日以上前・同年で「M/D」形式を返す", () => {
    expect(formatRelativeDateTime("2026-03-19T12:00:00+09:00", now)).toBe("3/19");
    expect(formatRelativeDateTime("2026-03-01T12:00:00+09:00", now)).toBe("3/1");
  });

  it("7 日以上前・別年で「YYYY/MM/DD」形式を返す", () => {
    expect(formatRelativeDateTime("2025-12-31T12:00:00+09:00", now)).toBe(
      "2025/12/31",
    );
  });

  it("不正な日時文字列はそのまま返す", () => {
    expect(formatRelativeDateTime("not-a-date", now)).toBe("not-a-date");
  });

  it("undefined を渡すと空文字を返す", () => {
    expect(formatRelativeDateTime(undefined, now)).toBe("");
  });

  it("null を渡すと空文字を返す", () => {
    expect(formatRelativeDateTime(null, now)).toBe("");
  });

  it("now を省略した場合も正しく動作する（現在時刻基準）", () => {
    // 未来の日時を渡すと "今" になるはず
    const farFuture = dayjs().add(1, "year").toISOString();
    expect(formatRelativeDateTime(farFuture)).toBe("今");
  });
});
