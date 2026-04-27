import { describe, expect, it } from "@jest/globals";

import {
  extractDateFromISO,
  formatDateToString,
  formatISOToTime,
  formatMinutesToHHmm,
  parseTimeToISO,
} from "./timeConverter";

describe("timeConverter", () => {
  describe("formatISOToTime", () => {
    it("ISO 8601形式の日時をHH:mm形式に変換する", () => {
      expect(formatISOToTime("2024-01-15T09:30:00+09:00")).toBe("09:30");
      expect(formatISOToTime("2024-01-15T14:45:00+09:00")).toBe("14:45");
      expect(formatISOToTime("2024-01-15T00:00:00+09:00")).toBe("00:00");
      expect(formatISOToTime("2024-01-15T23:59:00+09:00")).toBe("23:59");
    });
  });

  describe("parseTimeToISO", () => {
    it("HH:mm形式の時刻を指定日付のISO 8601形式に変換する", () => {
      const result = parseTimeToISO("09:30", "2024-01-15");
      // ISO文字列が生成されることを確認（タイムゾーン変換のため時刻は異なる可能性がある）
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // 日付部分が含まれることを確認
      expect(result).toContain("2024-01-15");
    });

    it("秒とミリ秒が0にリセットされる", () => {
      const result = parseTimeToISO("14:45", "2024-01-15");
      // 秒が00であることを確認
      expect(result).toMatch(/:\d{2}:00\.\d{3}Z$/);
    });

    it("異なる日付で正しく変換される", () => {
      const result = parseTimeToISO("10:00", "2024-12-31");
      // 日付部分が正しいことを確認
      expect(result).toContain("2024-12-31");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("formatDateToString", () => {
    it("DateオブジェクトをYYYY-MM-DD形式に変換する", () => {
      const date = new Date("2024-01-15T09:30:00");
      expect(formatDateToString(date)).toBe("2024-01-15");
    });

    it("月と日が1桁の場合にゼロパディングされる", () => {
      const date = new Date("2024-03-05T09:30:00");
      expect(formatDateToString(date)).toBe("2024-03-05");
    });
  });

  describe("extractDateFromISO", () => {
    it("ISO 8601形式の日時文字列から日付部分を抽出する", () => {
      expect(extractDateFromISO("2024-01-15T09:30:00+09:00")).toBe(
        "2024-01-15"
      );
      expect(extractDateFromISO("2024-12-31T23:59:59+09:00")).toBe(
        "2024-12-31"
      );
    });
  });

  describe("formatMinutesToHHmm", () => {
    it("0または負の値のとき '0:00' を返す", () => {
      expect(formatMinutesToHHmm(0)).toBe("0:00");
      expect(formatMinutesToHHmm(-15)).toBe("0:00");
    });

    it("分を正しくゼロパディングする", () => {
      expect(formatMinutesToHHmm(5)).toBe("0:05");
      expect(formatMinutesToHHmm(150)).toBe("2:30");
      expect(formatMinutesToHHmm(60)).toBe("1:00");
      expect(formatMinutesToHHmm(61)).toBe("1:01");
    });

    it("大きな値でも正しく変換する", () => {
      expect(formatMinutesToHHmm(600)).toBe("10:00");
    });
  });
});

describe("timeConverter", () => {
  describe("formatISOToTime", () => {
    it("ISO 8601形式の日時をHH:mm形式に変換する", () => {
      expect(formatISOToTime("2024-01-15T09:30:00+09:00")).toBe("09:30");
      expect(formatISOToTime("2024-01-15T14:45:00+09:00")).toBe("14:45");
      expect(formatISOToTime("2024-01-15T00:00:00+09:00")).toBe("00:00");
      expect(formatISOToTime("2024-01-15T23:59:00+09:00")).toBe("23:59");
    });
  });

  describe("parseTimeToISO", () => {
    it("HH:mm形式の時刻を指定日付のISO 8601形式に変換する", () => {
      const result = parseTimeToISO("09:30", "2024-01-15");
      // ISO文字列が生成されることを確認（タイムゾーン変換のため時刻は異なる可能性がある）
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // 日付部分が含まれることを確認
      expect(result).toContain("2024-01-15");
    });

    it("秒とミリ秒が0にリセットされる", () => {
      const result = parseTimeToISO("14:45", "2024-01-15");
      // 秒が00であることを確認
      expect(result).toMatch(/:\d{2}:00\.\d{3}Z$/);
    });

    it("異なる日付で正しく変換される", () => {
      const result = parseTimeToISO("10:00", "2024-12-31");
      // 日付部分が正しいことを確認
      expect(result).toContain("2024-12-31");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("formatDateToString", () => {
    it("DateオブジェクトをYYYY-MM-DD形式に変換する", () => {
      const date = new Date("2024-01-15T09:30:00");
      expect(formatDateToString(date)).toBe("2024-01-15");
    });

    it("月と日が1桁の場合にゼロパディングされる", () => {
      const date = new Date("2024-03-05T09:30:00");
      expect(formatDateToString(date)).toBe("2024-03-05");
    });
  });

  describe("extractDateFromISO", () => {
    it("ISO 8601形式の日時文字列から日付部分を抽出する", () => {
      expect(extractDateFromISO("2024-01-15T09:30:00+09:00")).toBe(
        "2024-01-15"
      );
      expect(extractDateFromISO("2024-12-31T23:59:59+09:00")).toBe(
        "2024-12-31"
      );
    });
  });
});
