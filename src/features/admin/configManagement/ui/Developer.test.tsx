import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { getDesignTokens } from "@shared/designSystem";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";

import Developer from "./Developer";

jest.mock("@/app/hooks", () => ({
  useAppDispatchV2: () => jest.fn(),
}));

const contextValue: React.ContextType<typeof AppConfigContext> = {
  fetchConfig: jest.fn(),
  saveConfig: jest.fn(),
  getStartTime: () => dayjs("09:00", "HH:mm"),
  getEndTime: () => dayjs("18:00", "HH:mm"),
  getStandardWorkHours: () => 8,
  getConfigId: () => "config-id",
  getLinks: () => [],
  getReasons: () => [],
  getOfficeMode: () => false,
  getAttendanceStatisticsEnabled: () => false,
  getWorkflowNotificationEnabled: () => true,
  getTimeRecorderAnnouncement: () => ({ enabled: false, message: "" }),
  getShiftCollaborativeEnabled: () => true,
  getShiftDefaultMode: () => "normal",
  getQuickInputStartTimes: () => [],
  getQuickInputEndTimes: () => [],
  getShiftGroups: () => [],
  getLunchRestStartTime: () => dayjs("12:00", "HH:mm"),
  getLunchRestEndTime: () => dayjs("13:00", "HH:mm"),
  getHourlyPaidHolidayEnabled: () => false,
  getAmHolidayStartTime: () => dayjs("09:00", "HH:mm"),
  getAmHolidayEndTime: () => dayjs("12:00", "HH:mm"),
  getPmHolidayStartTime: () => dayjs("13:00", "HH:mm"),
  getPmHolidayEndTime: () => dayjs("18:00", "HH:mm"),
  getAmPmHolidayEnabled: () => false,
  getSpecialHolidayEnabled: () => false,
  getAbsentEnabled: () => false,
  getOverTimeCheckEnabled: () => false,
  getWorkflowCategoryOrder: () => [],
  getThemeColor: () => "",
  getThemeTokens: () => getDesignTokens(),
};

describe("Developer", () => {
  it("renders developer settings as a scalable settings list", () => {
    render(
      <AppConfigContext.Provider value={contextValue}>
        <Developer />
      </AppConfigContext.Provider>,
    );

    expect(screen.getByText("開発者")).toBeInTheDocument();
    expect(screen.getByText("通知機能(開発中)")).toBeInTheDocument();
    expect(screen.getByText("有効")).toBeInTheDocument();
    expect(
      screen.getByText(
        "実験中または内部向けの設定をまとめて管理します。項目の追加や削除があっても、この画面内で一覧できます。",
      ),
    ).toBeInTheDocument();
  });
});
