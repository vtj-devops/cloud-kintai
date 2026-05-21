import dayjs from "dayjs";

import { attendanceEditSchema } from "../attendanceEditSchema";

describe("attendanceEditSchema", () => {
  const baseValidData = {
    workDate: "2024-01-15",
    startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
    endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
    isDeemedHoliday: false,
    specialHolidayFlag: false,
    paidHolidayFlag: false,
    absentFlag: false,
    hourlyPaidHolidayTimes: [],
    substituteHolidayDate: null,
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    remarks: null,
    remarkTags: [],
    rests: [],
    staffComment: "",
    revision: 1,
  };

  describe("勤務時間のバリデーション", () => {
    it("開始時間のみ入力した場合、バリデーションエラーにならない", () => {
      const data = {
        ...baseValidData,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("終了時間のみ入力した場合、バリデーションエラーにならない", () => {
      const data = {
        ...baseValidData,
        startTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("両方未入力の場合、バリデーションエラーにならない", () => {
      const data = {
        ...baseValidData,
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("開始時間が終了時間より後の場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        startTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["endTime"]);
        expect(result.error.issues[0].message).toContain("後");
      }
    });

    it("開始時間と終了時間が同じ場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["endTime"]);
      }
    });

    it("正常な勤務時間の場合、バリデーションを通過する", () => {
      const result = attendanceEditSchema.safeParse(baseValidData);
      expect(result.success).toBe(true);
    });
  });

  describe("休暇フラグとの組み合わせ", () => {
    it("有給フラグがtrueで勤務時間が未入力の場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        paidHolidayFlag: true,
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("欠勤フラグがtrueで勤務時間が未入力の場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        absentFlag: true,
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("振替休日が設定されている場合、勤務時間があるとエラーになる", () => {
      const data = {
        ...baseValidData,
        substituteHolidayDate: "2024-01-20",
        startTime: dayjs("2024-01-15T09:00:00+09:00").toISOString(),
        endTime: dayjs("2024-01-15T18:00:00+09:00").toISOString(),
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("振替休日");
      }
    });

    it("振替休日が設定され、勤務時間が未入力の場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        substituteHolidayDate: "2024-01-20",
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("休憩時間のバリデーション", () => {
    it("休憩時間の開始のみ入力した場合、エラーにならない（休憩中の状態）", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: null,
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("休憩時間の終了のみ入力した場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: null,
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("休憩時間の開始が終了より後の場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("後");
      }
    });

    it("正常な休憩時間の場合、バリデーションを通過する", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("時間単位休暇のバリデーション", () => {
    it("時間単位休暇の開始のみ入力した場合、エラーにならない（利用中の状態）", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
            endTime: null,
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("時間単位休暇の終了のみ入力した場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: null,
            endTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("時間単位休暇の開始が終了より後の場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("後");
      }
    });

    it("時間単位休暇の開始と終了が同じ場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("後");
      }
    });

    it("正常な時間単位休暇の場合、バリデーションを通過する", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("複数の時間単位休暇を設定できる", () => {
      const data = {
        ...baseValidData,
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T10:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T11:00:00+09:00").toISOString(),
          },
          {
            startTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("複数の休憩時間のバリデーション", () => {
    it("複数の休憩時間を設定できる", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
          {
            startTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T15:30:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("複数の休憩時間のうち1つが不正な場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
          {
            startTime: dayjs("2024-01-15T16:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T15:30:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("後");
      }
    });

    it("休憩時間の開始と終了が同じ場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("後");
      }
    });
  });

  describe("振替休日のバリデーション", () => {
    it("振替休日が設定されている場合、休憩時間があるとエラーになる", () => {
      const data = {
        ...baseValidData,
        substituteHolidayDate: "2024-01-20",
        startTime: null,
        endTime: null,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("振替休日");
      }
    });

    it("振替休日の日付が無効な形式の場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        substituteHolidayDate: "invalid-date",
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("日付");
      }
    });

    it("振替休日が正しく設定されている場合、バリデーションを通過する", () => {
      const data = {
        ...baseValidData,
        substituteHolidayDate: "2024-01-20",
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("複合的なバリデーション", () => {
    it("有給フラグがtrueの場合、休憩時間と時間単位休暇があってもエラーにならない", () => {
      const data = {
        ...baseValidData,
        paidHolidayFlag: true,
        rests: [
          {
            startTime: dayjs("2024-01-15T12:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T13:00:00+09:00").toISOString(),
          },
        ],
        hourlyPaidHolidayTimes: [
          {
            startTime: dayjs("2024-01-15T14:00:00+09:00").toISOString(),
            endTime: dayjs("2024-01-15T15:00:00+09:00").toISOString(),
          },
        ],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("特別休暇フラグがtrueで勤務時間が未入力の場合、エラーにならない", () => {
      const data = {
        ...baseValidData,
        specialHolidayFlag: true,
        startTime: null,
        endTime: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("直行・直帰フラグが設定されている場合もバリデーションを通過する", () => {
      const data = {
        ...baseValidData,
        goDirectlyFlag: true,
        returnDirectlyFlag: true,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("日時形式のバリデーション", () => {
    it("不正なISO 8601形式の日時はエラーになる", () => {
      const data = {
        ...baseValidData,
        startTime: "2024-01-15 09:00:00", // オフセットなし
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("日時");
      }
    });

    it("勤務日が不正な日付形式の場合、エラーになる", () => {
      const data = {
        ...baseValidData,
        workDate: "not-a-date",
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("日付");
      }
    });

    it("勤務日が正しい形式の場合、バリデーションを通過する", () => {
      const data = {
        ...baseValidData,
        workDate: "2024-01-15",
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("備考とタグのバリデーション", () => {
    it("備考にnullを設定できる", () => {
      const data = {
        ...baseValidData,
        remarks: null,
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("備考に文字列を設定できる", () => {
      const data = {
        ...baseValidData,
        remarks: "テスト備考",
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("備考タグを複数設定できる", () => {
      const data = {
        ...baseValidData,
        remarkTags: ["タグ1", "タグ2", "タグ3"],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("備考タグが空配列でもエラーにならない", () => {
      const data = {
        ...baseValidData,
        remarkTags: [],
      };

      const result = attendanceEditSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
