import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { createMockAttendance } from "@shared/test-utils";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import React from "react";

import DesktopCalendarView from "../DesktopCalendarView";

// ─── Module-level mock functions ──────────────────────────────────────────────
const mockBuildWeeks = jest.fn();
const mockGetStatus = jest.fn();
const mockGetNetWorkingHours = jest.fn();
const mockGetTotalRestHours = jest.fn();
const mockFormatTimeRange = jest.fn();
const mockGetCalendarDaySurfaceState = jest.fn();
const mockIsHolidayLike = jest.fn();
const mockGetHolidayNames = jest.fn();
const mockGetSubstituteHolidayLabel = jest.fn();
const mockBuildHolidayLabels = jest.fn();
const mockResolveMonthlyTerms = jest.fn();
const mockUseOptionalAttendanceListContext = jest.fn();

// ─── Module Mocks ─────────────────────────────────────────────────────────────
jest.mock("../../lib/attendanceStatusUtils", () => ({
  buildWeeks: (...args: unknown[]) => mockBuildWeeks(...args),
  getStatus: (...args: unknown[]) => mockGetStatus(...args),
  getNetWorkingHours: (...args: unknown[]) => mockGetNetWorkingHours(...args),
  getTotalRestHours: (...args: unknown[]) => mockGetTotalRestHours(...args),
  formatTimeRange: (...args: unknown[]) => mockFormatTimeRange(...args),
  getCalendarDaySurfaceState: (...args: unknown[]) =>
    mockGetCalendarDaySurfaceState(...args),
  isHolidayLike: (...args: unknown[]) => mockIsHolidayLike(...args),
  getHolidayNames: (...args: unknown[]) => mockGetHolidayNames(...args),
  getSubstituteHolidayLabel: (...args: unknown[]) =>
    mockGetSubstituteHolidayLabel(...args),
  buildHolidayLabels: (...args: unknown[]) => mockBuildHolidayLabels(...args),
}));

jest.mock("../../lib/monthlyTermUtils", () => ({
  resolveMonthlyTerms: (...args: unknown[]) => mockResolveMonthlyTerms(...args),
}));

jest.mock("../AttendanceListContext", () => ({
  useOptionalAttendanceListContext: () =>
    mockUseOptionalAttendanceListContext(),
}));

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    styled: (Component: React.ElementType) => () =>
      function StyledComponent(props: Record<string, unknown>) {
        return <Component {...props} />;
      },
  };
});

// ─── Test constants ───────────────────────────────────────────────────────────
const JUN_2024 = dayjs("2024-06-01");

/** A single week spanning Sun 2 Jun – Sat 8 Jun 2024 (all in the past). */
const WEEK_DAYS = [
  dayjs("2024-06-02"), // Sunday
  dayjs("2024-06-03"), // Monday
  dayjs("2024-06-04"), // Tuesday
  dayjs("2024-06-05"), // Wednesday
  dayjs("2024-06-06"), // Thursday
  dayjs("2024-06-07"), // Friday
  dayjs("2024-06-08"), // Saturday
];

const DEFAULT_TERM = {
  start: dayjs("2024-06-01"),
  end: dayjs("2024-06-30"),
  source: "closeDate" as const,
  label: "2024/06/01 〜 2024/06/30",
  color: "#2196f3",
};

const defaultProps = {
  currentMonth: JUN_2024,
  attendances: [] as ReturnType<typeof createMockAttendance>[],
  staff: null,
  holidayCalendars: [],
  companyHolidayCalendars: [],
  closeDates: [],
  closeDatesLoading: false,
  closeDatesError: null,
};

// ─── beforeEach defaults ──────────────────────────────────────────────────────
beforeEach(() => {
  jest.resetAllMocks();
  mockUseOptionalAttendanceListContext.mockReturnValue(null);
  mockBuildWeeks.mockReturnValue([WEEK_DAYS]);
  mockGetStatus.mockReturnValue(AttendanceStatus.None);
  mockGetNetWorkingHours.mockReturnValue(0);
  mockGetTotalRestHours.mockReturnValue(0);
  mockFormatTimeRange.mockReturnValue(undefined);
  mockGetCalendarDaySurfaceState.mockReturnValue({
    isToday: false,
    isWeekend: false,
    holidayLike: false,
  });
  mockIsHolidayLike.mockReturnValue(false);
  mockGetHolidayNames.mockReturnValue({
    holidayName: undefined,
    companyHolidayName: undefined,
  });
  mockGetSubstituteHolidayLabel.mockReturnValue(undefined);
  mockBuildHolidayLabels.mockImplementation(
    ({
      holidayName,
      companyHolidayName,
      attendance,
      includeCompanyHolidayPrefix = true,
    }: {
      holidayName?: string;
      companyHolidayName?: string;
      attendance?: unknown;
      includeCompanyHolidayPrefix?: boolean;
    }) => {
      const companyLabel = companyHolidayName
        ? includeCompanyHolidayPrefix
          ? `会社休日 ${companyHolidayName}`
          : companyHolidayName
        : undefined;
      return [
        holidayName,
        companyLabel,
        mockGetSubstituteHolidayLabel(attendance),
      ].filter(Boolean);
    },
  );
  mockResolveMonthlyTerms.mockReturnValue([DEFAULT_TERM]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("DesktopCalendarView", () => {
  // ── 基本表示 ──────────────────────────────────────────────────────────────
  describe("基本表示", () => {
    it("曜日ヘッダー (日〜土) を表示する", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      for (const label of ["日", "月", "火", "水", "木", "金", "土"]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });

    it("currentMonth の年月見出しを表示する", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      expect(screen.getByText("2024年6月")).toBeInTheDocument();
    });

    it("buildWeeks が返す各日の日付番号を表示する", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      for (const date of WEEK_DAYS) {
        expect(screen.getByText(String(date.date()))).toBeInTheDocument();
      }
    });

    it("集計期間チップのラベルを表示する", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      expect(screen.getByText(DEFAULT_TERM.label)).toBeInTheDocument();
    });

    it("複数の集計期間チップをすべて表示する", () => {
      const term2 = {
        ...DEFAULT_TERM,
        label: "2024/07/01 〜 2024/07/31",
        color: "#4caf50",
      };
      mockResolveMonthlyTerms.mockReturnValue([DEFAULT_TERM, term2]);
      render(<DesktopCalendarView {...defaultProps} />);
      expect(screen.getByText(DEFAULT_TERM.label)).toBeInTheDocument();
      expect(screen.getByText(term2.label)).toBeInTheDocument();
    });

    it("buildWeeks を currentMonth で呼び出す", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      expect(mockBuildWeeks).toHaveBeenCalledTimes(1);
      const arg = mockBuildWeeks.mock.calls[0][0];
      expect(arg.format("YYYY-MM")).toBe("2024-06");
    });
  });

  // ── 月ナビゲーション ─────────────────────────────────────────────────────
  describe("月ナビゲーション", () => {
    it("前月ボタンをクリックすると onMonthChange が前月で呼ばれる", async () => {
      const user = userEvent.setup();
      const onMonthChange = jest.fn();
      render(
        <DesktopCalendarView {...defaultProps} onMonthChange={onMonthChange} />,
      );

      await user.click(screen.getByRole("button", { name: "previous-month" }));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange.mock.calls[0][0].format("YYYY-MM")).toBe("2024-05");
    });

    it("次月ボタンをクリックすると onMonthChange が次月で呼ばれる", async () => {
      const user = userEvent.setup();
      const onMonthChange = jest.fn();
      render(
        <DesktopCalendarView {...defaultProps} onMonthChange={onMonthChange} />,
      );

      await user.click(screen.getByRole("button", { name: "next-month" }));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange.mock.calls[0][0].format("YYYY-MM")).toBe("2024-07");
    });

    it("今月ボタンをクリックすると onMonthChange が今月の月初で呼ばれる", async () => {
      const user = userEvent.setup();
      const onMonthChange = jest.fn();
      render(
        <DesktopCalendarView {...defaultProps} onMonthChange={onMonthChange} />,
      );

      await user.click(screen.getByRole("button", { name: "今月に戻る" }));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange.mock.calls[0][0].format("YYYY-MM-DD")).toBe(
        dayjs().startOf("month").format("YYYY-MM-DD"),
      );
    });

    it("onMonthChange が未設定でもナビゲーションボタンクリックでエラーにならない", async () => {
      const user = userEvent.setup();
      render(<DesktopCalendarView {...defaultProps} />);

      await expect(
        user.click(screen.getByRole("button", { name: "previous-month" })),
      ).resolves.not.toThrow();
    });
  });

  // ── 日付セルのクリック ────────────────────────────────────────────────────
  describe("日付セルのクリックによるナビゲーション", () => {
    it("日付セルをクリックするとデフォルトパス /attendance/YYYYMMDD/edit で navigate を呼ぶ", async () => {
      const user = userEvent.setup();
      const navigate = jest.fn();
      render(<DesktopCalendarView {...defaultProps} navigate={navigate} />);

      // June 3 → QueryParamFormat "20240603"
      await user.click(screen.getByText("3"));

      expect(navigate).toHaveBeenCalledWith("/attendance/20240603/edit");
    });

    it("buildNavigatePath が指定された場合、そのパスで navigate を呼ぶ", async () => {
      const user = userEvent.setup();
      const navigate = jest.fn();
      const buildNavigatePath = jest.fn((fmt: string) => `/custom/${fmt}`);
      render(
        <DesktopCalendarView
          {...defaultProps}
          navigate={navigate}
          buildNavigatePath={buildNavigatePath}
        />,
      );

      await user.click(screen.getByText("3"));

      expect(buildNavigatePath).toHaveBeenCalledWith("20240603");
      expect(navigate).toHaveBeenCalledWith("/custom/20240603");
    });

    it("navigate が未設定でも日付セルクリックでエラーにならない", async () => {
      const user = userEvent.setup();
      render(<DesktopCalendarView {...defaultProps} />);

      await expect(user.click(screen.getByText("3"))).resolves.not.toThrow();
    });
  });

  // ── フォールバック通知 / エラー表示 ──────────────────────────────────────
  describe("フォールバック通知とエラー", () => {
    it("monthlyTerms がひとつで source=fallback の場合、フォールバック通知を表示する", () => {
      mockResolveMonthlyTerms.mockReturnValue([
        { ...DEFAULT_TERM, source: "fallback" as const },
      ]);
      render(
        <DesktopCalendarView {...defaultProps} closeDatesLoading={false} />,
      );

      expect(
        screen.getByText(
          "集計対象月が未登録のため、暫定で月初〜月末を表示しています。",
        ),
      ).toBeInTheDocument();
    });

    it("closeDatesLoading=true の場合、フォールバック通知を表示しない", () => {
      mockResolveMonthlyTerms.mockReturnValue([
        { ...DEFAULT_TERM, source: "fallback" as const },
      ]);
      render(
        <DesktopCalendarView {...defaultProps} closeDatesLoading={true} />,
      );

      expect(
        screen.queryByText(
          "集計対象月が未登録のため、暫定で月初〜月末を表示しています。",
        ),
      ).not.toBeInTheDocument();
    });

    it("monthlyTerms が複数の場合、フォールバック通知を表示しない", () => {
      mockResolveMonthlyTerms.mockReturnValue([
        { ...DEFAULT_TERM, source: "fallback" as const },
        { ...DEFAULT_TERM, source: "fallback" as const },
      ]);
      render(<DesktopCalendarView {...defaultProps} />);

      expect(
        screen.queryByText(
          "集計対象月が未登録のため、暫定で月初〜月末を表示しています。",
        ),
      ).not.toBeInTheDocument();
    });

    it("closeDatesError がある場合、エラーメッセージを表示する", () => {
      render(
        <DesktopCalendarView
          {...defaultProps}
          closeDatesError={new Error("fetch failed")}
        />,
      );

      expect(
        screen.getByText(
          "集計対象月の取得に失敗したため、暫定の期間で表示しています。",
        ),
      ).toBeInTheDocument();
    });

    it("closeDatesError=null の場合、エラーメッセージを表示しない", () => {
      render(<DesktopCalendarView {...defaultProps} closeDatesError={null} />);

      expect(
        screen.queryByText(
          "集計対象月の取得に失敗したため、暫定の期間で表示しています。",
        ),
      ).not.toBeInTheDocument();
    });
  });

  // ── 勤怠データの表示 ──────────────────────────────────────────────────────
  describe("勤怠データの表示", () => {
    it("formatTimeRange が値を返す場合、時間帯ラベルを表示する", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      mockFormatTimeRange.mockReturnValue("09:00 - 18:00");

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.getByText("09:00 - 18:00")).toBeInTheDocument();
    });

    it("formatTimeRange が undefined の場合、時間帯ラベルを表示しない", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      mockFormatTimeRange.mockReturnValue(undefined);

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.queryByText(/-/)).not.toBeInTheDocument();
    });

    it("getNetWorkingHours が 8.0 を返す場合、実働時間 '8.0h' を表示する", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      // Return 8.0 only when an attendance object is passed; 0 for days without data
      mockGetNetWorkingHours.mockImplementation((att: unknown) =>
        att ? 8.0 : 0,
      );

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.getByText("8.0h")).toBeInTheDocument();
    });

    it("getNetWorkingHours が 0 の場合、実働時間を表示しない", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      mockGetNetWorkingHours.mockReturnValue(0);

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.queryByText(/\d+\.\dh/)).not.toBeInTheDocument();
    });

    it("paidHolidayFlag=true の場合、'有給休暇' を表示する", () => {
      const attendance = createMockAttendance({
        workDate: "2024-06-03",
        paidHolidayFlag: true,
      });

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.getByText("有給休暇")).toBeInTheDocument();
    });

    it("paidHolidayFlag=true の場合、実働時間を表示しない", () => {
      const attendance = createMockAttendance({
        workDate: "2024-06-03",
        paidHolidayFlag: true,
      });
      // Even though 8.0 would be returned for this attendance, paidHolidayFlag hides it.
      // Days without attendance return 0, so no stray "8.0h" appears.
      mockGetNetWorkingHours.mockImplementation((att: unknown) =>
        att ? 8.0 : 0,
      );

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.queryByText("8.0h")).not.toBeInTheDocument();
      expect(screen.getByText("有給休暇")).toBeInTheDocument();
    });

    it("getTotalRestHours が 1.0 を返す場合、'休憩 1.0h' を表示する", () => {
      const attendance = createMockAttendance({
        workDate: "2024-06-03",
        paidHolidayFlag: false,
      });
      mockGetTotalRestHours.mockReturnValue(1.0);

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.getByText("休憩 1.0h")).toBeInTheDocument();
    });

    it("paidHolidayFlag=true の場合、休憩時間を表示しない", () => {
      const attendance = createMockAttendance({
        workDate: "2024-06-03",
        paidHolidayFlag: true,
      });
      mockGetTotalRestHours.mockReturnValue(1.0);

      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(screen.queryByText(/休憩/)).not.toBeInTheDocument();
    });
  });

  // ── ステータスチップ ──────────────────────────────────────────────────────
  describe("ステータスチップ", () => {
    const renderWithStatus = (status: AttendanceStatus) => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      // Only return the target status for cells that have attendance data;
      // other cells get None so no extra chips appear.
      mockGetStatus.mockImplementation((att: unknown) =>
        att ? status : AttendanceStatus.None,
      );
      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );
    };

    it("Ok ステータスの場合、'OK' チップを表示する", () => {
      renderWithStatus(AttendanceStatus.Ok);
      expect(screen.getByText("OK")).toBeInTheDocument();
    });

    it("Error ステータスの場合、'要確認' チップを表示する", () => {
      renderWithStatus(AttendanceStatus.Error);
      expect(screen.getByText("要確認")).toBeInTheDocument();
    });

    it("Requesting ステータスの場合、'申請中' チップを表示する", () => {
      renderWithStatus(AttendanceStatus.Requesting);
      expect(screen.getByText("申請中")).toBeInTheDocument();
    });

    it("Late ステータスの場合、'遅刻' チップを表示する", () => {
      renderWithStatus(AttendanceStatus.Late);
      expect(screen.getByText("遅刻")).toBeInTheDocument();
    });

    it("Working ステータスの場合、'勤務中' チップを表示する", () => {
      renderWithStatus(AttendanceStatus.Working);
      expect(screen.getByText("勤務中")).toBeInTheDocument();
    });

    it("None ステータスの場合、ステータスチップを表示しない", () => {
      render(<DesktopCalendarView {...defaultProps} />);
      expect(screen.queryByText("OK")).not.toBeInTheDocument();
      expect(screen.queryByText("要確認")).not.toBeInTheDocument();
      expect(screen.queryByText("申請中")).not.toBeInTheDocument();
    });
  });

  // ── 祝日ラベル ────────────────────────────────────────────────────────────
  describe("祝日ラベルの表示", () => {
    it("holidayName がある場合、祝日名を表示する", () => {
      mockGetHolidayNames.mockReturnValue({
        holidayName: "元日",
        companyHolidayName: undefined,
      });
      render(<DesktopCalendarView {...defaultProps} />);

      expect(screen.getAllByText("元日").length).toBeGreaterThan(0);
    });

    it("companyHolidayName がある場合、'会社休日 XXX' を表示する", () => {
      mockGetHolidayNames.mockReturnValue({
        holidayName: undefined,
        companyHolidayName: "創立記念日",
      });
      render(<DesktopCalendarView {...defaultProps} />);

      expect(screen.getAllByText("会社休日 創立記念日").length).toBeGreaterThan(
        0,
      );
    });

    it("holidayName と companyHolidayName が両方ある場合、両方を表示する", () => {
      mockGetHolidayNames.mockReturnValue({
        holidayName: "元日",
        companyHolidayName: "特別休暇",
      });
      render(<DesktopCalendarView {...defaultProps} />);

      expect(screen.getAllByText("元日").length).toBeGreaterThan(0);
      expect(screen.getAllByText("会社休日 特別休暇").length).toBeGreaterThan(
        0,
      );
    });

    it("振替休日ラベルがある場合、表示する", () => {
      mockGetSubstituteHolidayLabel.mockReturnValue("振替休日");
      render(<DesktopCalendarView {...defaultProps} />);

      expect(screen.getAllByText("振替休日").length).toBeGreaterThan(0);
    });
  });

  // ── 右パネルボタン ────────────────────────────────────────────────────────
  describe("右パネルで開くボタン", () => {
    it("onOpenInRightPanel と attendance が両方ある場合、'右側で開く' ボタンを表示する", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      render(
        <DesktopCalendarView
          {...defaultProps}
          attendances={[attendance]}
          onOpenInRightPanel={jest.fn()}
        />,
      );

      expect(
        screen.getByRole("button", { name: "右側で開く" }),
      ).toBeInTheDocument();
    });

    it("'右側で開く' ボタンをクリックすると onOpenInRightPanel が attendance と date で呼ばれる", async () => {
      const user = userEvent.setup();
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      const onOpenInRightPanel = jest.fn();
      render(
        <DesktopCalendarView
          {...defaultProps}
          attendances={[attendance]}
          onOpenInRightPanel={onOpenInRightPanel}
        />,
      );

      await user.click(screen.getByRole("button", { name: "右側で開く" }));

      expect(onOpenInRightPanel).toHaveBeenCalledTimes(1);
      const [calledAttendance, calledDate] = onOpenInRightPanel.mock.calls[0];
      expect(calledAttendance).toEqual(attendance);
      expect(calledDate.format("YYYY-MM-DD")).toBe("2024-06-03");
    });

    it("'右側で開く' ボタンクリック時は navigate を呼ばない (stopPropagation)", async () => {
      const user = userEvent.setup();
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      const navigate = jest.fn();
      const onOpenInRightPanel = jest.fn();
      render(
        <DesktopCalendarView
          {...defaultProps}
          attendances={[attendance]}
          navigate={navigate}
          onOpenInRightPanel={onOpenInRightPanel}
        />,
      );

      await user.click(screen.getByRole("button", { name: "右側で開く" }));

      expect(navigate).not.toHaveBeenCalled();
    });

    it("attendance がない日には '右側で開く' ボタンを表示しない", () => {
      render(
        <DesktopCalendarView
          {...defaultProps}
          attendances={[]}
          onOpenInRightPanel={jest.fn()}
        />,
      );

      expect(
        screen.queryByRole("button", { name: "右側で開く" }),
      ).not.toBeInTheDocument();
    });

    it("onOpenInRightPanel が未設定の場合、'右側で開く' ボタンを表示しない", () => {
      const attendance = createMockAttendance({ workDate: "2024-06-03" });
      render(
        <DesktopCalendarView {...defaultProps} attendances={[attendance]} />,
      );

      expect(
        screen.queryByRole("button", { name: "右側で開く" }),
      ).not.toBeInTheDocument();
    });
  });

  // ── コンテキストのフォールバック ─────────────────────────────────────────
  describe("コンテキストからの値の取得", () => {
    it("props を渡さない場合、コンテキストの currentMonth を使用する", () => {
      mockUseOptionalAttendanceListContext.mockReturnValue({
        currentMonth: JUN_2024,
        attendances: [],
        staff: null,
        holidayCalendars: [],
        companyHolidayCalendars: [],
        navigate: jest.fn(),
        closeDates: [],
        closeDatesLoading: false,
        closeDatesError: null,
        onMonthChange: jest.fn(),
        effectiveDateRange: { start: JUN_2024, end: JUN_2024 },
      });

      render(<DesktopCalendarView />);

      expect(screen.getByText("2024年6月")).toBeInTheDocument();
    });

    it("props を渡さない場合、コンテキストの onMonthChange が呼ばれる", async () => {
      const user = userEvent.setup();
      const onMonthChange = jest.fn();
      mockUseOptionalAttendanceListContext.mockReturnValue({
        currentMonth: JUN_2024,
        attendances: [],
        staff: null,
        holidayCalendars: [],
        companyHolidayCalendars: [],
        navigate: jest.fn(),
        closeDates: [],
        closeDatesLoading: false,
        closeDatesError: null,
        onMonthChange,
        effectiveDateRange: { start: JUN_2024, end: JUN_2024 },
      });

      render(<DesktopCalendarView />);
      await user.click(screen.getByRole("button", { name: "next-month" }));

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange.mock.calls[0][0].format("YYYY-MM")).toBe("2024-07");
    });

    it("props の値はコンテキストの値より優先される", async () => {
      const user = userEvent.setup();
      const contextMonthChange = jest.fn();
      const propMonthChange = jest.fn();
      mockUseOptionalAttendanceListContext.mockReturnValue({
        currentMonth: dayjs("2024-01-01"),
        attendances: [],
        staff: null,
        holidayCalendars: [],
        companyHolidayCalendars: [],
        navigate: jest.fn(),
        closeDates: [],
        closeDatesLoading: false,
        closeDatesError: null,
        onMonthChange: contextMonthChange,
        effectiveDateRange: { start: JUN_2024, end: JUN_2024 },
      });

      render(
        <DesktopCalendarView
          currentMonth={JUN_2024}
          onMonthChange={propMonthChange}
        />,
      );

      // prop の currentMonth が使われる
      expect(screen.getByText("2024年6月")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "next-month" }));
      expect(propMonthChange).toHaveBeenCalledTimes(1);
      expect(contextMonthChange).not.toHaveBeenCalled();
    });
  });
});
