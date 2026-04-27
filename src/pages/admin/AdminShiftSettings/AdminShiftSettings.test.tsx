import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { getDesignTokens } from "@shared/designSystem";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import AdminShiftSettings from "./AdminShiftSettings";

jest.mock("@/app/hooks", () => ({
  useAppDispatchV2: () => jest.fn(),
}));

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: jest.fn(),
}));

jest.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (callback: (values: { shiftGroups: [] }) => void) => () =>
      callback({ shiftGroups: [] }),
    reset: jest.fn(),
    trigger: jest.fn(),
    formState: { errors: {} },
  }),
  useFieldArray: () => ({
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
  }),
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
  getWorkflowNotificationEnabled: () => false,
  getTimeRecorderAnnouncement: () => ({ enabled: false, message: "" }),
  getShiftGroups: () => [],
  getShiftCollaborativeEnabled: () => false,
  getShiftDefaultMode: () => "normal" as const,
  getQuickInputStartTimes: () => [],
  getQuickInputEndTimes: () => [],
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

describe("AdminShiftSettings", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: ui,
        },
      ],
      { initialEntries: ["/"] },
    );

    return render(<RouterProvider router={router} />);
  };

  it("switches between shift group and shift display tabs", async () => {
    const user = userEvent.setup();
    const shiftGroupTab = "シフトグループ";
    const shiftDisplayTab = "シフト表示";

    renderWithRouter(
      <AppConfigContext.Provider value={contextValue}>
        <AdminShiftSettings />
      </AppConfigContext.Provider>,
    );

    expect(screen.getByRole("tab", { name: shiftGroupTab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: shiftGroupTab }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: shiftDisplayTab }));

    expect(screen.getByRole("tab", { name: shiftDisplayTab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText("共同編集モードを無効")).not.toBeInTheDocument();
    expect(screen.getByText("表示モード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "共同編集モード" }),
    ).toBeEnabled();
  });
});
