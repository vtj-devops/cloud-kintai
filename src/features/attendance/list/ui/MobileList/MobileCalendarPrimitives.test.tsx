import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { render, screen } from "@testing-library/react";

import { CalendarDayCell } from "./MobileCalendarPrimitives";

describe("CalendarDayCell", () => {
  it("要確認日は赤系の背景と枠線で表示する", () => {
    render(
      <CalendarDayCell isCurrentMonth hasError status={AttendanceStatus.Error}>
        <span>1</span>
      </CalendarDayCell>,
    );

    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: "rgba(211, 47, 47, 0.14)",
      borderColor: "var(--mui-palette-error-main)",
      color: "#8f1d1d",
    });
  });

  it("OK日は成功系の色味を持つ", () => {
    render(
      <CalendarDayCell
        isCurrentMonth
        hasError={false}
        status={AttendanceStatus.Ok}
      >
        <span>2</span>
      </CalendarDayCell>,
    );

    expect(screen.getByRole("button")).toHaveStyle({
      color: "#1f5f24",
    });
    expect(screen.getByRole("button").getAttribute("style")).toContain(
      "rgba(46, 125, 50, 0.14)",
    );
  });

  it("当月外の日付はグレー系で無効化する", () => {
    render(
      <CalendarDayCell
        isCurrentMonth={false}
        hasError={false}
        status={AttendanceStatus.None}
      >
        <span>31</span>
      </CalendarDayCell>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({
      backgroundColor: "var(--mui-palette-grey-100)",
      color: "var(--mui-palette-text-secondary)",
    });
  });

  it("土日祝日相当日は警告系の背景色で表示する", () => {
    render(
      <CalendarDayCell
        isCurrentMonth
        hasError={false}
        status={AttendanceStatus.None}
        isHolidayLike
      >
        <span>7</span>
      </CalendarDayCell>,
    );

    expect(screen.getByRole("button").getAttribute("style")).toContain(
      "rgba(237, 108, 2, 0.1)",
    );
  });
});
