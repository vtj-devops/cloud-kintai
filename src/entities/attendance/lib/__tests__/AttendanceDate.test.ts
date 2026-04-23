import dayjs from "dayjs";

import { AttendanceDate } from "../AttendanceDate";

describe("AttendanceDate", () => {
  test("DataFormat が 'YYYY-MM-DD' であること", () => {
    expect(AttendanceDate.DataFormat).toBe("YYYY-MM-DD");
  });

  test("DisplayFormat が 'YYYY/MM/DD' であること", () => {
    expect(AttendanceDate.DisplayFormat).toBe("YYYY/MM/DD");
  });

  test("DatePickerFormat が 'YYYY/MM/DD(ddd)' であること", () => {
    expect(AttendanceDate.DatePickerFormat).toBe("YYYY/MM/DD(ddd)");
  });

  test("QueryParamFormat が 'YYYYMMDD' であること", () => {
    expect(AttendanceDate.QueryParamFormat).toBe("YYYYMMDD");
  });

  describe("dayjs との組み合わせ", () => {
    const date = dayjs("2024-06-15");

    test("DataFormat で dayjs の format() を使うと 'YYYY-MM-DD' 形式の文字列を返すこと", () => {
      expect(date.format(AttendanceDate.DataFormat)).toBe("2024-06-15");
    });

    test("DisplayFormat で dayjs の format() を使うと 'YYYY/MM/DD' 形式の文字列を返すこと", () => {
      expect(date.format(AttendanceDate.DisplayFormat)).toBe("2024/06/15");
    });

    test("QueryParamFormat はセパレータなしの 8 桁数字文字列を返すこと", () => {
      const result = date.format(AttendanceDate.QueryParamFormat);
      expect(result).toBe("20240615");
      expect(result).toHaveLength(8);
      expect(/^\d{8}$/.test(result)).toBe(true);
    });

    test("DatePickerFormat は曜日の略称を含む文字列を返すこと", () => {
      // 2024-06-15 は土曜日 (Sat)
      const result = date.format(AttendanceDate.DatePickerFormat);
      expect(result).toMatch(/^2024\/06\/15\(.+\)$/);
    });
  });
});
