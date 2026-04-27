import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NavigationMenu from "./NavigationMenu";

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => {
  const actual = jest.requireActual(
    "@entities/staff/model/useStaffs/useStaffs",
  );
  return {
    ...actual,
    useStaffs: jest.fn(),
  };
});

jest.mock("@shared/ui/header/DesktopMenu", () => ({
  __esModule: true,
  default: ({
    menuItems,
    showAdminMenu,
    adminLink,
  }: {
    menuItems: Array<{ label: string; href: string }>;
    showAdminMenu: boolean;
    adminLink?: { label: string; href: string } | null;
  }) => (
    <div data-testid="desktop-menu">
      {menuItems.map((item) => (
        <span key={item.href}>{item.label}</span>
      ))}
      {showAdminMenu && adminLink ? <span>{adminLink.label}</span> : null}
    </div>
  ),
}));

jest.mock("@shared/ui/header/MobileMenu", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/widgets/layout/header/useMobileDrawer", () => ({
  useMobileDrawer: () => ({
    isOpen: false,
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

jest.mock("@/router/routePreloaders", () => ({
  preloadRoute: jest.fn(),
}));

const mockedUseStaffs = jest.mocked(useStaffs);

function renderMenu({
  roles,
  workType,
}: {
  roles: StaffRole[];
  workType: "shift" | "weekday";
}) {
  mockedUseStaffs.mockReturnValue({
    staffs: [
      {
        id: "staff-1",
        cognitoUserId: "cognito-1",
        familyName: "田中",
        givenName: "太郎",
        mailAddress: "tanaka@example.com",
        owner: false,
        role: roles[0] ?? StaffRole.STAFF,
        enabled: true,
        status: "CONFIRMED",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        workType,
      },
    ],
    loading: false,
    error: null,
    refreshStaff: jest.fn(),
    createStaff: jest.fn(),
    updateStaff: jest.fn(),
    deleteStaff: jest.fn(),
  } as never);

  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: (role: StaffRole) => roles.includes(role),
          authStatus: "authenticated",
          cognitoUser: {
            id: "cognito-1",
            givenName: "太郎",
            familyName: "田中",
            mailAddress: "tanaka@example.com",
            owner: false,
            roles,
            emailVerified: true,
          },
        }}
      >
        <AppConfigContext.Provider
          value={{
            fetchConfig: jest.fn(),
            saveConfig: jest.fn(),
            getStartTime: jest.fn(),
            getEndTime: jest.fn(),
            getStandardWorkHours: jest.fn(),
            getConfigId: jest.fn(),
            getLinks: jest.fn(() => []),
            getReasons: jest.fn(() => []),
            getOfficeMode: jest.fn(() => false),
            getAttendanceStatisticsEnabled: jest.fn(() => true),
            getWorkflowNotificationEnabled: jest.fn(() => false),
            getTimeRecorderAnnouncement: jest.fn(() => ({
              enabled: false,
              message: "",
            })),
            getShiftCollaborativeEnabled: jest.fn(() => false),
            getShiftDefaultMode: jest.fn(() => "normal"),
            getQuickInputStartTimes: jest.fn(() => []),
            getQuickInputEndTimes: jest.fn(() => []),
            getShiftGroups: jest.fn(() => []),
            getLunchRestStartTime: jest.fn(),
            getLunchRestEndTime: jest.fn(),
            getHourlyPaidHolidayEnabled: jest.fn(() => false),
            getAmHolidayStartTime: jest.fn(),
            getAmHolidayEndTime: jest.fn(),
            getPmHolidayStartTime: jest.fn(),
            getPmHolidayEndTime: jest.fn(),
            getAmPmHolidayEnabled: jest.fn(() => false),
            getSpecialHolidayEnabled: jest.fn(() => false),
            getAbsentEnabled: jest.fn(() => false),
            getOverTimeCheckEnabled: jest.fn(() => false),
            getWorkflowCategoryOrder: jest.fn(() => []),
            getThemeColor: jest.fn(() => ""),
            getThemeTokens: jest.fn(),
          }}
        >
          <NavigationMenu />
        </AppConfigContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("NavigationMenu", () => {
  beforeEach(() => {
    mockedUseStaffs.mockReset();
  });

  it("shows shift menu for shift staff", () => {
    renderMenu({ roles: [StaffRole.STAFF], workType: "shift" });

    expect(screen.getByTestId("desktop-menu")).toHaveTextContent("シフト");
  });

  it("hides shift menu for weekday staff", () => {
    renderMenu({ roles: [StaffRole.STAFF], workType: "weekday" });

    expect(screen.getByTestId("desktop-menu")).not.toHaveTextContent("シフト");
  });

  it("shows both shift and admin menu for shift admin", () => {
    renderMenu({ roles: [StaffRole.ADMIN], workType: "shift" });

    expect(screen.getByTestId("desktop-menu")).toHaveTextContent("シフト");
    expect(screen.getByTestId("desktop-menu")).toHaveTextContent("管理");
  });

  it("keeps admin menu but hides shift menu for weekday admin", () => {
    renderMenu({ roles: [StaffRole.ADMIN], workType: "weekday" });

    expect(screen.getByTestId("desktop-menu")).not.toHaveTextContent("シフト");
    expect(screen.getByTestId("desktop-menu")).toHaveTextContent("管理");
  });
});
