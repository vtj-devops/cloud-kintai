import dayjs from "dayjs";
import { z } from "zod";

import { createTimeRangeValidator, TimeRangeMessages } from "../validators";

const messages: TimeRangeMessages = {
  incomplete: "開始または終了時刻を入力してください",
  range: "終了時刻は開始時刻より後にしてください",
};

/** createTimeRangeValidator をテストするための最小スキーマを生成するヘルパー */
const buildSchema = () => {
  const base = z.object({
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
  });
  return createTimeRangeValidator(base, messages);
};

describe("createTimeRangeValidator", () => {
  describe("両方未入力の場合", () => {
    it("startTime・endTime が両方 null の場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({ startTime: null, endTime: null });
      expect(result.success).toBe(true);
    });

    it("startTime・endTime が両方 undefined の場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("片方のみ入力の場合", () => {
    it("startTime のみ入力されている場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: null,
      });
      expect(result.success).toBe(true);
    });

    it("endTime のみ入力されている場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: null,
        endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("startTime が空文字の場合は未入力とみなし、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: "",
        endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("endTime が空文字の場合は未入力とみなし、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("両方入力されている場合（正常系）", () => {
    it("endTime が startTime より後の場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("1分差（境界値: ちょうどOK）の場合、バリデーションを通過する", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:01:00+09:00").toISOString(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("両方入力されている場合（異常系）", () => {
    it("endTime が startTime より前の場合、エラーになる", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(["endTime"]);
        expect(result.error.issues[0].message).toBe(messages.range);
      }
    });

    it("endTime と startTime が同じ（境界値: ちょうどNG）の場合、エラーになる", () => {
      const schema = buildSchema();
      const sameTime = dayjs("2024-01-15T09:00:00+09:00").toISOString();
      const result = schema.safeParse({
        startTime: sameTime,
        endTime: sameTime,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["endTime"]);
        expect(result.error.issues[0].message).toBe(messages.range);
      }
    });

    it("エラー時のメッセージは messages.range に指定した文字列になる", () => {
      const customMessages: TimeRangeMessages = {
        incomplete: "カスタム片方メッセージ",
        range: "カスタム範囲エラー",
      };
      const base = z.object({
        startTime: z.string().nullable().optional(),
        endTime: z.string().nullable().optional(),
      });
      const schema = createTimeRangeValidator(base, customMessages);
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("カスタム範囲エラー");
      }
    });

    it("エラー時は endTime パスにのみ issue が追加される（startTime には追加されない）", () => {
      const schema = buildSchema();
      const result = schema.safeParse({
        startTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path);
        expect(paths.every((p) => p.includes("endTime"))).toBe(true);
        expect(paths.some((p) => p.includes("startTime"))).toBe(false);
      }
    });
  });

  describe("スキーマ拡張との組み合わせ", () => {
    it("追加フィールドを持つスキーマに適用しても正常に動作する", () => {
      const base = z.object({
        label: z.string(),
        startTime: z.string().nullable().optional(),
        endTime: z.string().nullable().optional(),
      });
      const schema = createTimeRangeValidator(base, messages);
      const result = schema.safeParse({
        label: "テスト",
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("追加フィールドを持つスキーマでも時刻不正時にエラーになる", () => {
      const base = z.object({
        label: z.string(),
        startTime: z.string().nullable().optional(),
        endTime: z.string().nullable().optional(),
      });
      const schema = createTimeRangeValidator(base, messages);
      const result = schema.safeParse({
        label: "テスト",
        startTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["endTime"]);
      }
    });
  });
});
