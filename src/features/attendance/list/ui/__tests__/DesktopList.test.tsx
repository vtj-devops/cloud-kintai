import {
  createMockAttendance,
  createMockStaff,
  renderWithProviders,
} from "@shared/test-utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";

import DesktopList from "../DesktopList";

const mockUseAttendanceListContext = jest.fn();
const mockUseErrorAttendances = jest.fn();

jest.mock("../AttendanceListContext", () => ({
  useAttendanceListContext: () => mockUseAttendanceListContext(),
}));

jest.mock("../useErrorAttendances", () => ({
  useErrorAttendances: (...args: unknown[]) => mockUseErrorAttendances(...args),
}));

jest.mock("../DesktopCalendarView", () => ({
  __esModule: true,
  default: () => <div data-testid="desktop-calendar-view" />,
}));

jest.mock("../AttendanceStatusTooltip", () => ({
  AttendanceStatusTooltip: () => <span>status</span>,
}));

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/WorkDateTableCell",
  () => ({
    WorkDateTableCell: ({ workDate }: { workDate: string }) => (
      <td>{workDate}</td>
    ),
  }),
);

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/WorkTimeTableCell",
  () => ({
    WorkTimeTableCell: () => <td>work time</td>,
  }),
);

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/RestTimeTableCell",
  () => ({
    RestTimeTableCell: () => <td>rest time</td>,
  }),
);

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/SummaryTableCell",
  () => ({
    SummaryTableCell: () => <td>summary</td>,
  }),
);

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/CreatedAtTableCell",
  () => ({
    CreatedAtTableCell: () => <td>created</td>,
  }),
);

jest.mock(
  "@entities/attendance/ui/adminStaffAttendance/UpdatedAtTableCell",
  () => ({
    UpdatedAtTableCell: () => <td>updated</td>,
  }),
);

jest.mock("@entities/attendance/ui/rowVariant", () => ({
  attendanceRowVariantStyles: { default: {} },
  getAttendanceRowVariant: jest.fn(() => "default"),
}));

const defaultContextValue = {
  attendances: [],
  staff: createMockStaff({ workType: "weekday" }),
  holidayCalendars: [],
  companyHolidayCalendars: [],
  navigate: jest.fn(),
  closeDates: [],
  closeDatesLoading: false,
  closeDatesError: null,
  currentMonth: dayjs("2024-06-01"),
  effectiveDateRange: {
    start: dayjs("2024-06-01"),
    end: dayjs("2024-06-30"),
  },
  onMonthChange: jest.fn(),
};

const buildAttendances = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    createMockAttendance({
      id: `attendance-${index + 1}`,
      workDate: dayjs("2024-06-01").add(index, "day").format("YYYY-MM-DD"),
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAttendanceListContext.mockReturnValue(defaultContextValue);
  mockUseErrorAttendances.mockReturnValue(buildAttendances(7));
});

describe("DesktopList", () => {
  it("打刻エラーが6件以上あるとき初期表示を5件に制限する", () => {
    renderWithProviders(<DesktopList />);

    expect(screen.getAllByRole("button", { name: "編集" })).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "残り2件を表示" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("展開ボタンで打刻エラー一覧の全件表示に切り替えられる", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DesktopList />);

    await user.click(screen.getByRole("button", { name: "残り2件を表示" }));

    expect(screen.getAllByRole("button", { name: "編集" })).toHaveLength(7);
    expect(
      screen.getByRole("button", { name: "5件表示に戻す" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("打刻エラーが5件以下なら展開ボタンを表示しない", () => {
    mockUseErrorAttendances.mockReturnValue(buildAttendances(5));

    renderWithProviders(<DesktopList />);

    expect(
      screen.queryByRole("button", { name: /件を表示|5件表示に戻す/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "編集" })).toHaveLength(5);
  });
});
