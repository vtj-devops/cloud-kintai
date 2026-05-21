import {
  buildPaidHolidayToggleValues,
  PAID_HOLIDAY_REMARK_TAG,
} from "@features/attendance/edit/lib/paidHolidayToggle";
import dayjs from "dayjs";

describe("buildPaidHolidayToggleValues", () => {
  const timeConfig = {
    startTime: dayjs("2024-04-01T09:00:00"),
    endTime: dayjs("2024-04-01T18:00:00"),
    restStartTime: dayjs("2024-04-01T12:00:00"),
    restEndTime: dayjs("2024-04-01T13:00:00"),
  };

  test("ON時は勤務時間・休憩・備考タグ・特別休暇フラグ解除を返す", () => {
    const result = buildPaidHolidayToggleValues({
      checked: true,
      setPaidHolidayTimes: true,
      workDate: "2024-05-10",
      remarkTags: [],
      specialHolidayFlag: true,
      timeConfig,
    });

    expect(result.timeValues).toBeDefined();
    expect(dayjs(result.timeValues?.startTime).format("YYYY-MM-DD HH:mm")).toBe(
      "2024-05-10 09:00"
    );
    expect(dayjs(result.timeValues?.endTime).format("YYYY-MM-DD HH:mm")).toBe(
      "2024-05-10 18:00"
    );
    expect(
      dayjs(result.timeValues?.rests[0]?.startTime).format("YYYY-MM-DD HH:mm")
    ).toBe("2024-05-10 12:00");
    expect(
      dayjs(result.timeValues?.rests[0]?.endTime).format("YYYY-MM-DD HH:mm")
    ).toBe("2024-05-10 13:00");
    expect(result.nextRemarkTags).toEqual([PAID_HOLIDAY_REMARK_TAG]);
    expect(result.shouldClearSpecialHolidayFlag).toBe(true);
  });

  test("OFF時は有給タグだけを取り除く", () => {
    const result = buildPaidHolidayToggleValues({
      checked: false,
      setPaidHolidayTimes: true,
      workDate: "2024-05-10",
      remarkTags: [PAID_HOLIDAY_REMARK_TAG, "その他"],
      specialHolidayFlag: true,
      timeConfig,
    });

    expect(result.timeValues).toBeUndefined();
    expect(result.nextRemarkTags).toEqual(["その他"]);
    expect(result.shouldClearSpecialHolidayFlag).toBe(false);
  });

  test("時刻自動設定条件を満たさないON時は追加更新を返さない", () => {
    const result = buildPaidHolidayToggleValues({
      checked: true,
      setPaidHolidayTimes: false,
      workDate: "2024-05-10",
      remarkTags: [],
      specialHolidayFlag: true,
      timeConfig,
    });

    expect(result.timeValues).toBeUndefined();
    expect(result.nextRemarkTags).toBeUndefined();
    expect(result.shouldClearSpecialHolidayFlag).toBe(false);
  });
});
