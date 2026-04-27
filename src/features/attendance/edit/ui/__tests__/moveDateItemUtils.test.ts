import dayjs from "dayjs";

import { applyWorkDateValue, buildAttendanceEditPath } from "../moveDateItemUtils";

describe("buildAttendanceEditPath", () => {
  const date = dayjs("2024-03-15");

  it("管理者のパスを返す", () => {
    const path = buildAttendanceEditPath({
      date,
      isAdmin: true,
      staffId: "staff-1",
      searchParams: new URLSearchParams(),
      queryParamFormat: "YYYY-MM-DD",
    });
    expect(path).toBe("/admin/attendances/edit/2024-03-15/staff-1");
  });

  it("スタッフのパスを月クエリパラメータ付きで返す", () => {
    const path = buildAttendanceEditPath({
      date,
      isAdmin: false,
      searchParams: new URLSearchParams(),
      queryParamFormat: "YYYY-MM-DD",
    });
    expect(path).toBe("/attendance/2024-03-15/edit?month=2024-03");
  });

  it("既存のクエリパラメータを保持する", () => {
    const params = new URLSearchParams({ foo: "bar" });
    const path = buildAttendanceEditPath({
      date,
      isAdmin: false,
      searchParams: params,
      queryParamFormat: "YYYY-MM-DD",
    });
    expect(path).toContain("foo=bar");
    expect(path).toContain("month=2024-03");
  });

  it("フォーマット文字列が適用される", () => {
    const path = buildAttendanceEditPath({
      date,
      isAdmin: true,
      staffId: "s1",
      searchParams: new URLSearchParams(),
      queryParamFormat: "YYYYMMDD",
    });
    expect(path).toBe("/admin/attendances/edit/20240315/s1");
  });
});

describe("applyWorkDateValue", () => {
  it("有効な日付で navigate を呼ぶ", () => {
    const navigate = jest.fn();
    const buildPath = jest.fn().mockReturnValue("/some/path");
    applyWorkDateValue({ value: "2024-03-15", navigate, buildPath });
    expect(navigate).toHaveBeenCalledWith("/some/path");
    expect(buildPath).toHaveBeenCalled();
  });

  it("空文字では navigate を呼ばない", () => {
    const navigate = jest.fn();
    applyWorkDateValue({ value: "", navigate, buildPath: jest.fn() });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("無効な日付文字列では navigate を呼ばない", () => {
    const navigate = jest.fn();
    applyWorkDateValue({ value: "invalid-date", navigate, buildPath: jest.fn() });
    expect(navigate).not.toHaveBeenCalled();
  });
});
