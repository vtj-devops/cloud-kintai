import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { render, screen } from "@testing-library/react";

import ShiftCollaborativeRoutePage, {
  shouldRedirectFromCollaborativeRoute,
} from "./index";

jest.mock("@entities/app-config/model/useAppConfig", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => {
  const actual = jest.requireActual(
    "@entities/staff/model/useStaffs/useStaffs",
  );
  return {
    ...actual,
    useStaffs: jest.fn(),
  };
});

jest.mock("@/pages/shift/collaborative/ShiftCollaborative", () => ({
  __esModule: true,
  default: () => <div>shift-collaborative-page</div>,
}));

const useAppConfig = jest.requireMock(
  "@entities/app-config/model/useAppConfig",
).default as jest.Mock;
const mockedUseStaffs = jest.mocked(useStaffs);

function renderCollaborativeRoute(workType: "shift" | "weekday") {
  mockedUseStaffs.mockReturnValue({
    staffs: [
      {
        id: "staff-1",
        cognitoUserId: "cognito-1",
        familyName: "田中",
        givenName: "太郎",
        mailAddress: "tanaka@example.com",
        owner: false,
        role: StaffRole.STAFF,
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
    <AuthContext.Provider
      value={{
        signOut: jest.fn(),
        signIn: jest.fn(),
        isCognitoUserRole: () => false,
        authStatus: "authenticated",
        cognitoUser: {
          id: "cognito-1",
          givenName: "太郎",
          familyName: "田中",
          mailAddress: "tanaka@example.com",
          owner: false,
          roles: [StaffRole.STAFF],
          emailVerified: true,
        },
      }}
    >
      <ShiftCollaborativeRoutePage />
    </AuthContext.Provider>,
  );
}

describe("shouldRedirectFromCollaborativeRoute", () => {
  it("returns true when mode is normal", () => {
    expect(shouldRedirectFromCollaborativeRoute("normal")).toBe(true);
  });

  it("returns false when mode is collaborative", () => {
    expect(shouldRedirectFromCollaborativeRoute("collaborative")).toBe(false);
  });
});

describe("ShiftCollaborativeRoutePage", () => {
  beforeEach(() => {
    useAppConfig.mockReset();
    mockedUseStaffs.mockReset();
    useAppConfig.mockReturnValue({
      config: {},
      isConfigLoading: false,
      getShiftCollaborativeEnabled: () => true,
      getShiftDefaultMode: () => "collaborative",
    });
  });

  it("shows access denied message for weekday staff instead of redirecting", () => {
    renderCollaborativeRoute("weekday");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "シフト機能は勤務形態がシフト勤務のスタッフのみ利用できます。",
    );
    expect(screen.queryByText("shift-collaborative-page")).not.toBeInTheDocument();
  });

  it("renders collaborative page for shift staff when mode is collaborative", () => {
    renderCollaborativeRoute("shift");

    expect(screen.getByText("shift-collaborative-page")).toBeInTheDocument();
  });
});
