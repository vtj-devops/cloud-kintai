import "./MobileCalendar.scss";

import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
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
  let backgroundColor = isCurrentMonth
    ? "var(--mui-palette-background-paper)"
    : "var(--mui-palette-grey-50)";
  let borderColor = "var(--mui-palette-divider)";
  let color = isCurrentMonth
    ? "var(--mui-palette-text-primary)"
    : "var(--mui-palette-text-secondary)";

  if (!isCurrentMonth) {
    backgroundColor = "var(--mui-palette-grey-100)";
    borderColor = "rgba(156, 163, 175, 0.4)";
    color = "var(--mui-palette-text-secondary)";
  } else if (status === AttendanceStatus.Error || hasError) {
    backgroundColor = "rgba(211, 47, 47, 0.14)";
    borderColor = "var(--mui-palette-error-main)";
    color = "#8f1d1d";
  } else if (status === AttendanceStatus.Late) {
    backgroundColor = "rgba(237, 108, 2, 0.18)";
    borderColor = "var(--mui-palette-warning-main)";
    color = "#8a3b00";
  } else if (status === AttendanceStatus.Ok) {
    backgroundColor = "rgba(46, 125, 50, 0.14)";
    borderColor = "rgba(46, 125, 50, 0.32)";
    color = "#1f5f24";
  } else if (
    status === AttendanceStatus.Requesting ||
    status === AttendanceStatus.Working
  ) {
    backgroundColor = "rgba(2, 136, 209, 0.12)";
    borderColor = "rgba(2, 136, 209, 0.34)";
    color = "#0b5f8a";
  } else if (isHolidayLike) {
    backgroundColor = "rgba(237, 108, 2, 0.1)";
    borderColor = "rgba(237, 108, 2, 0.28)";
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
