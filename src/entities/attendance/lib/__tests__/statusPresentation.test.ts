import { AttendanceStatus } from "../AttendanceState";
import {
  attendanceStatusChipColorMap,
  attendanceStatusLabelMap,
  attendanceStatusTextColorMap,
  getAttendanceStatusBadgeMeta,
  getAttendanceStatusDayCellStyle,
} from "../statusPresentation";

describe("attendance status presentation", () => {
  it("ステータス表示ラベルを返す", () => {
    expect(attendanceStatusLabelMap[AttendanceStatus.Ok]).toBe("OK");
    expect(attendanceStatusLabelMap[AttendanceStatus.Error]).toBe("要確認");
    expect(attendanceStatusLabelMap[AttendanceStatus.Requesting]).toBe("申請中");
    expect(attendanceStatusLabelMap[AttendanceStatus.Late]).toBe("遅刻");
    expect(attendanceStatusLabelMap[AttendanceStatus.Working]).toBe("勤務中");
    expect(attendanceStatusLabelMap[AttendanceStatus.None]).toBe("");
  });

  it("Chip 用カラーを返す", () => {
    expect(attendanceStatusChipColorMap[AttendanceStatus.Ok]).toBe("success");
    expect(attendanceStatusChipColorMap[AttendanceStatus.Error]).toBe("danger");
    expect(attendanceStatusChipColorMap[AttendanceStatus.Requesting]).toBe(
      "warning",
    );
    expect(attendanceStatusChipColorMap[AttendanceStatus.Late]).toBe("danger");
    expect(attendanceStatusChipColorMap[AttendanceStatus.Working]).toBe("info");
  });

  it("一覧テキスト用カラーを返す", () => {
    expect(attendanceStatusTextColorMap[AttendanceStatus.Ok]).toBe(
      "var(--mui-palette-success-main)",
    );
    expect(attendanceStatusTextColorMap[AttendanceStatus.Error]).toBe(
      "var(--mui-palette-error-main)",
    );
    expect(attendanceStatusTextColorMap[AttendanceStatus.Late]).toBe(
      "var(--mui-palette-warning-main)",
    );
  });

  it("詳細ステータスバッジを返す", () => {
    expect(getAttendanceStatusBadgeMeta(AttendanceStatus.Error).label).toBe(
      "エラー",
    );
    expect(getAttendanceStatusBadgeMeta(AttendanceStatus.Late).label).toBe(
      "遅刻",
    );
    expect(getAttendanceStatusBadgeMeta(AttendanceStatus.Ok).label).toBe("正常");
    expect(getAttendanceStatusBadgeMeta(AttendanceStatus.None).label).toBe(
      "未入力",
    );
  });

  it("日セル表示を条件に応じて返す", () => {
    expect(
      getAttendanceStatusDayCellStyle({
        status: AttendanceStatus.Late,
        hasError: true,
      }).backgroundColor,
    ).toBe("rgba(211, 47, 47, 0.14)");
    expect(
      getAttendanceStatusDayCellStyle({
        status: AttendanceStatus.Requesting,
        hasError: false,
      }).backgroundColor,
    ).toBe("rgba(2, 136, 209, 0.12)");
    expect(
      getAttendanceStatusDayCellStyle({
        status: AttendanceStatus.None,
        hasError: false,
        isHolidayLike: true,
      }).backgroundColor,
    ).toBe("rgba(237, 108, 2, 0.1)");
  });
});
