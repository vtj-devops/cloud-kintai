import {
  buildChangeRequestPayload,
  normalizeTimeRanges,
  splitRemarks,
} from "../attendanceEditUtils";

describe("buildChangeRequestPayload", () => {
  const base = {
    startTime: "09:00",
    endTime: "18:00",
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    remarks: "メモ",
    specialHolidayFlag: false,
    paidHolidayFlag: false,
    substituteHolidayDate: null,
    staffComment: "コメント",
    rests: [{ startTime: "12:00", endTime: "13:00" }],
    hourlyPaidHolidayTimes: [{ startTime: "14:00", endTime: "15:00" }],
  };

  it("基本フィールドをそのままペイロードに含める", () => {
    const result = buildChangeRequestPayload(base as never);
    expect(result.startTime).toBe("09:00");
    expect(result.endTime).toBe("18:00");
    expect(result.staffComment).toBe("コメント");
  });

  it("rests を startTime/endTime だけに整形する", () => {
    const result = buildChangeRequestPayload(base as never);
    expect(result.rests).toEqual([{ startTime: "12:00", endTime: "13:00" }]);
  });

  it("hourlyPaidHolidayTimes を整形する", () => {
    const result = buildChangeRequestPayload(base as never);
    expect(result.hourlyPaidHolidayTimes).toEqual([
      { startTime: "14:00", endTime: "15:00" },
    ]);
  });

  it("rests が undefined のとき空配列を返す", () => {
    const result = buildChangeRequestPayload({ ...base, rests: undefined } as never);
    expect(result.rests).toEqual([]);
  });

  it("hourlyPaidHolidayTimes が undefined のとき空配列を返す", () => {
    const result = buildChangeRequestPayload({
      ...base,
      hourlyPaidHolidayTimes: undefined,
    } as never);
    expect(result.hourlyPaidHolidayTimes).toEqual([]);
  });

  it("hourlyPaidHolidayTimes の null フィールドを空文字に変換する", () => {
    const result = buildChangeRequestPayload({
      ...base,
      hourlyPaidHolidayTimes: [{ startTime: null, endTime: null }],
    } as never);
    expect(result.hourlyPaidHolidayTimes).toEqual([
      { startTime: "", endTime: "" },
    ]);
  });
});

describe("normalizeTimeRanges", () => {
  it("null 要素を除外する", () => {
    const input = [
      { startTime: "09:00", endTime: "10:00" },
      null,
      { startTime: "11:00", endTime: "12:00" },
    ];
    const result = normalizeTimeRanges(input);
    expect(result).toHaveLength(2);
  });

  it("undefined フィールドを null に変換する", () => {
    const result = normalizeTimeRanges([{ startTime: undefined, endTime: undefined }]);
    expect(result[0]).toEqual({ startTime: null, endTime: null });
  });

  it("null を渡すと空配列を返す", () => {
    expect(normalizeTimeRanges(null)).toEqual([]);
  });

  it("undefined を渡すと空配列を返す", () => {
    expect(normalizeTimeRanges(undefined)).toEqual([]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(normalizeTimeRanges([])).toEqual([]);
  });
});

describe("splitRemarks", () => {
  it("既知タグと一般テキストを分離する", () => {
    const result = splitRemarks("有給休暇\n打ち合わせ対応");
    expect(result.tags).toEqual(["有給休暇"]);
    expect(result.remarks).toBe("打ち合わせ対応");
  });

  it("複数タグを認識する", () => {
    const result = splitRemarks("有給休暇\n特別休暇");
    expect(result.tags).toEqual(["有給休暇", "特別休暇"]);
    expect(result.remarks).toBe("");
  });

  it("null を渡すと空を返す", () => {
    expect(splitRemarks(null)).toEqual({ tags: [], remarks: "" });
  });

  it("undefined を渡すと空を返す", () => {
    expect(splitRemarks(undefined)).toEqual({ tags: [], remarks: "" });
  });

  it("空文字を渡すと空を返す", () => {
    expect(splitRemarks("")).toEqual({ tags: [], remarks: "" });
  });

  it("一般テキストのみ remarks に含める", () => {
    const result = splitRemarks("朝礼\n夕礼");
    expect(result.tags).toEqual([]);
    expect(result.remarks).toBe("朝礼\n夕礼");
  });

  it("空白行を無視する", () => {
    const result = splitRemarks("有給休暇\n\n  \n作業");
    expect(result.tags).toEqual(["有給休暇"]);
    expect(result.remarks).toBe("作業");
  });

  it("欠勤タグを認識する", () => {
    const result = splitRemarks("欠勤\n理由あり");
    expect(result.tags).toEqual(["欠勤"]);
    expect(result.remarks).toBe("理由あり");
  });
});
