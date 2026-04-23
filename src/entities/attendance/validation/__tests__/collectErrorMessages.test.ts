import type { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import type { FieldErrors } from "react-hook-form";

import { collectAttendanceErrorMessages } from "../collectErrorMessages";

describe("collectAttendanceErrorMessages", () => {
  describe("エラーが0件の場合", () => {
    it("空オブジェクトを渡した場合、空配列を返す", () => {
      const result = collectAttendanceErrorMessages({});
      expect(result).toEqual([]);
    });
  });

  describe("トップレベルの単一フィールドエラーの場合", () => {
    it("startTime にエラーがある場合、そのメッセージを返す", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: "開始時刻が不正です" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("開始時刻が不正です");
      expect(result).toHaveLength(1);
    });

    it("endTime にエラーがある場合、そのメッセージを返す", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        endTime: { type: "custom", message: "終了時刻は開始時刻より後にしてください" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("終了時刻は開始時刻より後にしてください");
      expect(result).toHaveLength(1);
    });

    it("workDate にエラーがある場合、そのメッセージを返す", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        workDate: { type: "custom", message: "勤務日が不正です" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("勤務日が不正です");
    });
  });

  describe("複数フィールドにエラーがある場合", () => {
    it("startTime と endTime の両方にエラーがある場合、両方のメッセージを返す", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: "開始時刻エラー" },
        endTime: { type: "custom", message: "終了時刻エラー" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("開始時刻エラー");
      expect(result).toContain("終了時刻エラー");
      expect(result).toHaveLength(2);
    });

    it("3つのフィールドにエラーがある場合、3つのメッセージを返す", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: "エラーA" },
        endTime: { type: "custom", message: "エラーB" },
        workDate: { type: "custom", message: "エラーC" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toHaveLength(3);
      expect(result).toContain("エラーA");
      expect(result).toContain("エラーB");
      expect(result).toContain("エラーC");
    });
  });

  describe("同一メッセージの重複排除", () => {
    it("同じメッセージが複数フィールドに存在する場合、1件のみ返す", () => {
      const sharedMessage = "入力内容を確認してください";
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: sharedMessage },
        endTime: { type: "custom", message: sharedMessage },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toEqual([sharedMessage]);
      expect(result).toHaveLength(1);
    });

    it("3フィールドが同じメッセージを持つ場合、1件のみ返す", () => {
      const sharedMessage = "重複エラー";
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: sharedMessage },
        endTime: { type: "custom", message: sharedMessage },
        workDate: { type: "custom", message: sharedMessage },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toHaveLength(1);
    });
  });

  describe("ネストされたエラー（rests）の場合", () => {
    it("rests[0].endTime にエラーがある場合、そのメッセージを収集する", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        rests: [
          {
            endTime: { type: "custom", message: "休憩終了時刻エラー" },
          },
        ],
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("休憩終了時刻エラー");
    });

    it("rests の複数要素にエラーがある場合、すべてのメッセージを収集する", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        rests: [
          { endTime: { type: "custom", message: "休憩1エラー" } },
          { endTime: { type: "custom", message: "休憩2エラー" } },
        ],
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("休憩1エラー");
      expect(result).toContain("休憩2エラー");
    });
  });

  describe("ネストされたエラー（hourlyPaidHolidayTimes）の場合", () => {
    it("hourlyPaidHolidayTimes[0].endTime にエラーがある場合、そのメッセージを収集する", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        hourlyPaidHolidayTimes: [
          {
            endTime: { type: "custom", message: "時間単位休暇終了エラー" },
          },
        ],
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("時間単位休暇終了エラー");
    });
  });

  describe("トップレベルとネストの混在", () => {
    it("トップレベルのエラーとネストされたエラーが混在する場合、すべて収集する", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        startTime: { type: "custom", message: "開始時刻エラー" },
        rests: [
          { endTime: { type: "custom", message: "休憩終了エラー" } },
        ],
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toContain("開始時刻エラー");
      expect(result).toContain("休憩終了エラー");
      expect(result).toHaveLength(2);
    });
  });

  describe("message プロパティがない・null・undefined の場合", () => {
    it("message が undefined のエラーオブジェクトは無視される", () => {
      // message プロパティなしの FieldError は収集しない
      const fieldErrors = {
        startTime: { type: "custom" } as FieldErrors<AttendanceEditInputs>["startTime"],
      } as FieldErrors<AttendanceEditInputs>;
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(result).toEqual([]);
    });
  });

  describe("戻り値の型", () => {
    it("戻り値は文字列の配列である", () => {
      const fieldErrors: FieldErrors<AttendanceEditInputs> = {
        endTime: { type: "custom", message: "テスト" },
      };
      const result = collectAttendanceErrorMessages(fieldErrors);
      expect(Array.isArray(result)).toBe(true);
      result.forEach((msg) => expect(typeof msg).toBe("string"));
    });
  });
});
