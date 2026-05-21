import "./MobileCalendar.scss";

import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { getAttendanceStatusDayCellStyle } from "@entities/attendance/lib/statusPresentation";
import { CSSProperties, ReactNode } from "react";

type CalendarDayCellProps = {
  isCurrentMonth: boolean;
  hasError: boolean;
  status?: AttendanceStatus;
  isSelected?: boolean;
  isHolidayLike?: boolean;
  termColor?: string;
  children: ReactNode;
  onClick?: () => void;
};

export const CalendarContainer = ({ children }: { children: ReactNode }) => (
  <div className="mobile-calendar">{children}</div>
);

export const DayOfWeekHeader = ({ children }: { children: ReactNode }) => (
  <div className="mobile-calendar__dow-header">{children}</div>
);

export const DayOfWeekCell = ({ children }: { children: ReactNode }) => (
  <p className="mobile-calendar__dow-cell">{children}</p>
);

export const CalendarGrid = ({ children }: { children: ReactNode }) => (
  <div className="mobile-calendar__grid">{children}</div>
);

export const CalendarDayCell = ({
  isCurrentMonth,
  hasError,
  status,
  isSelected,
  isHolidayLike,
  termColor,
  children,
  onClick,
}: CalendarDayCellProps) => {
  let backgroundColor = "var(--mui-palette-background-paper)";
  let borderColor = "var(--mui-palette-divider)";
  let color = "var(--mui-palette-text-primary)";

  if (!isCurrentMonth) {
    backgroundColor = "var(--mui-palette-grey-100)";
    borderColor = "rgba(156, 163, 175, 0.4)";
    color = "var(--mui-palette-text-secondary)";
  } else {
    const statusStyle = getAttendanceStatusDayCellStyle({
      status,
      hasError,
      isHolidayLike,
    });
    backgroundColor = statusStyle.backgroundColor;
    borderColor = statusStyle.borderColor;
    color = statusStyle.color;
  }

  const classNames = ["mobile-calendar__day-cell"];
  if (isCurrentMonth) classNames.push("is-clickable");
  if (isSelected) classNames.push("is-selected");
  if (termColor) classNames.push("has-term");

  const style = {
    backgroundColor,
    borderColor,
    color,
    "--term-color": termColor ?? "transparent",
    "--day-hover-shadow": "0px 1px 3px rgba(0, 0, 0, 0.2)",
    "--selected-ring-color": "var(--mui-palette-primary-main)",
  } as CSSProperties;

  return (
    <button
      type="button"
      className={classNames.join(" ")}
      onClick={onClick}
      style={style}
      disabled={!isCurrentMonth}
    >
      {children}
    </button>
  );
};

export const DayNumber = ({ children }: { children: ReactNode }) => (
  <p className="mobile-calendar__day-number">{children}</p>
);

export const HolidayName = ({ children }: { children: ReactNode }) => (
  <p className="mobile-calendar__holiday-name">{children}</p>
);
