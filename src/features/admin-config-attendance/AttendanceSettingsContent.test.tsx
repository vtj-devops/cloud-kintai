import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { getDesignTokens } from "@shared/designSystem";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";

import AttendanceSettingsContent from "./AttendanceSettingsContent";

const mockDispatch = jest.fn();
const mockFetchConfig = jest.fn();
const mockSaveConfig = jest.fn();
let consoleErrorSpy: jest.SpyInstance;
const originalConsoleError = console.error.bind(console);

const buildTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);

  return dayjs()
    .hour(hour ?? 0)
    .minute(minute ?? 0)
    .second(0)
    .millisecond(0);
};

jest.mock("@/app/hooks", () => ({
  useAppDispatchV2: () => mockDispatch,
}));

describe("AttendanceSettingsContent", () => {
  const contextValue: React.ContextType<typeof AppConfigContext> = {
    fetchConfig: mockFetchConfig,
    saveConfig: mockSaveConfig,
    getStartTime: () => buildTime("09:00"),
    getEndTime: () => buildTime("18:00"),
    getStandardWorkHours: () => 8,
    getConfigId: () => "config-id",
    getLinks: () => [],
    getReasons: () => [],
    getOfficeMode: () => true,
    getAttendanceStatisticsEnabled: () => false,
    getWorkflowNotificationEnabled: () => false,
    getTimeRecorderAnnouncement: () => ({ enabled: false, message: "" }),
    getShiftCollaborativeEnabled: () => false,
    getShiftDefaultMode: () => "normal",
    getQuickInputStartTimes: () => [
      { time: "09:00", enabled: true },
      { time: "10:00", enabled: false },
    ],
    getQuickInputEndTimes: () => [{ time: "18:00", enabled: true }],
    getShiftGroups: () => [],
    getLunchRestStartTime: () => buildTime("12:00"),
    getLunchRestEndTime: () => buildTime("13:00"),
    getHourlyPaidHolidayEnabled: () => true,
    getAmHolidayStartTime: () => buildTime("09:00"),
    getAmHolidayEndTime: () => buildTime("12:00"),
    getPmHolidayStartTime: () => buildTime("13:00"),
    getPmHolidayEndTime: () => buildTime("18:00"),
    getAmPmHolidayEnabled: () => true,
    getSpecialHolidayEnabled: () => true,
    getAbsentEnabled: () => false,
    getOverTimeCheckEnabled: () => false,
    getWorkflowCategoryOrder: () => [],
    getThemeColor: () => "",
    getThemeTokens: () => getDesignTokens(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((message?: unknown, ...args: unknown[]) => {
        if (
          typeof message === "string" &&
          message.includes("not wrapped in act")
        ) {
          return;
        }

        originalConsoleError(message, ...args);
      });
    mockDispatch.mockReset();
    mockFetchConfig.mockReset();
    mockSaveConfig.mockReset();
    mockFetchConfig.mockResolvedValue(undefined);
    mockSaveConfig.mockResolvedValue(undefined);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it("カテゴリ別タブを切り替えながら勤怠設定を保存できる", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(
      <AppConfigContext.Provider value={contextValue}>
        <AttendanceSettingsContent />
      </AppConfigContext.Provider>,
    );

    expect(
      screen.getByRole("tab", { name: "勤務ルール" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "勤務時間" })).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("09:00").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "保存" }),
    ).not.toBeInTheDocument();

    const absentSection = screen
      .getByRole("heading", { name: "欠勤" })
      .closest("section");
    if (!absentSection) {
      throw new Error("欠勤セクションが見つかりません。");
    }

    await user.click(within(absentSection).getByRole("checkbox", { name: "無効" }));

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockSaveConfig).toHaveBeenCalledWith({
        id: "config-id",
        absentEnabled: true,
      });
    });
    await waitFor(() => {
      expect(mockFetchConfig).toHaveBeenCalled();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await user.click(screen.getByRole("tab", { name: "申請・入力" }));

    expect(
      screen.getByRole("tab", { name: "申請・入力" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "残業確認" })).toBeInTheDocument();
    const quickInputSection = screen
      .getByRole("heading", { name: "クイック入力" })
      .closest("section");
    if (!quickInputSection) {
      throw new Error("クイック入力セクションが見つかりません。");
    }
    expect(within(quickInputSection).getByText("出勤時間")).toBeInTheDocument();
  });
});
