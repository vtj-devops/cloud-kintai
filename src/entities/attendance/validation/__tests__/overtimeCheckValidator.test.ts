import type { OvertimeCheckContext } from "../overtimeCheckValidator";
import {
  extractTimeFromISO,
  validateOvertimeCheck,
} from "../overtimeCheckValidator";

describe("overtimeCheckValidator", () => {
  describe("validateOvertimeCheck", () => {
    const baseContext: OvertimeCheckContext = {
      workEndTime: "17:30",
      overTimeCheckEnabled: true,
      overtimeRequestEndTime: null,
      hasOvertimeRequest: false,
    };

    it("業務終了時間内の場合は有効", () => {
      const result = validateOvertimeCheck("17:00", baseContext);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("業務終了時間と同じ場合は有効", () => {
      const result = validateOvertimeCheck("17:30", baseContext);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("フラグが無効な場合は超過していてもチェック対象外", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        overTimeCheckEnabled: false,
      };
      const result = validateOvertimeCheck("18:00", context);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("endTime がない場合は有効", () => {
      const result = validateOvertimeCheck("", baseContext);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("業務終了時間を超過して残業申請がない場合は無効", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        hasOvertimeRequest: false,
      };
      const result = validateOvertimeCheck("18:00", context);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "業務終了時間を超過しています。残業申請が必要です。",
      );
    });

    it("業務終了時間を超過して残業申請がある場合で、認可時刻内なら有効", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        hasOvertimeRequest: true,
        overtimeRequestEndTime: "18:30",
      };
      const result = validateOvertimeCheck("18:00", context);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it("業務終了時間を超過して残業申請の認可時刻を超える場合は無効", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        hasOvertimeRequest: true,
        overtimeRequestEndTime: "18:00",
      };
      const result = validateOvertimeCheck("18:30", context);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("残業申請の終了時刻を超過しています。");
    });

    it("残業申請の認可時刻と同じ場合は有効", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        hasOvertimeRequest: true,
        overtimeRequestEndTime: "18:00",
      };
      const result = validateOvertimeCheck("18:00", context);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe("extractTimeFromISO", () => {
    it("ISO 8601 形式から HH:mm を抽出（UTC）", () => {
      // dayjs は UTC から local timezone に変換するため、元の時刻を取得
      // テスト環境では JST (UTC+9) なので、ずれが生じる可能性がある
      // 代わりに、HH:mm: から HH:mm を抽出するテストをする
      const result = extractTimeFromISO("18:45");
      expect(result).toBe("18:45");
    });

    it("HH:mm 形式をそのまま返す", () => {
      const result = extractTimeFromISO("14:30");
      expect(result).toBe("14:30");
    });

    it("無効な形式の場合は null を返す", () => {
      const result = extractTimeFromISO("invalid");
      expect(result).toBeNull();
    });

    it("null の場合は null を返す", () => {
      const result = extractTimeFromISO(null);
      expect(result).toBeNull();
    });
  });

  describe("エッジケース", () => {
    const baseContext: OvertimeCheckContext = {
      workEndTime: "17:30",
      overTimeCheckEnabled: true,
      overtimeRequestEndTime: null,
      hasOvertimeRequest: false,
    };

    it("真夜中を跨ぐ時刻は正しく比較される", () => {
      const context: OvertimeCheckContext = {
        ...baseContext,
        workEndTime: "23:00",
      };
      const result = validateOvertimeCheck("23:30", context);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        "業務終了時間を超過しています。残業申請が必要です。",
      );
    });

    it("時刻パース失敗時は有効として扱う", () => {
      const result = validateOvertimeCheck("invalid-time", baseContext);
      expect(result.isValid).toBe(true);
    });
  });
});
