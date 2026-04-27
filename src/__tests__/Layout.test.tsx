import { useSession } from "@app/providers/session/useSession";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import { render, screen } from "@testing-library/react";
import { Hub } from "aws-amplify/utils";
import React from "react";
import { MemoryRouter , useLocation,useNavigate } from "react-router-dom";

import Layout from "../Layout";

// --- mocks ---
jest.mock("@app/providers/session/useSession");
jest.mock("@entities/attendance/model/useCloseDates");
jest.mock("@entities/app-config/model/AppConfigContext", () => ({
  AppConfigContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    _currentValue: {},
  },
}));
jest.mock("aws-amplify/utils", () => ({
  Hub: { listen: jest.fn(() => jest.fn()) },
}));
jest.mock("@/router/routePreloaders", () => ({
  scheduleIdleRoutePreload: jest.fn(),
}));
jest.mock("@/widgets/feedback/notification/NotificationViewport", () => ({
  __esModule: true,
  default: () => <div data-testid="notification-viewport" />,
}));
jest.mock("@/widgets/layout/header/Header", () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));
jest.mock("@/widgets/layout/footer/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <main data-testid="outlet" />,
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));
jest.mock("@shared/ui/feedback/AppDialog", () => ({
  __esModule: true,
  default: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div data-testid="app-dialog">{title}</div> : null,
}));
jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), debug: jest.fn() }),
}));
jest.mock("@shared/ui/layout", () => ({
  AppShell: ({
    header,
    main,
    footer,
    slotProps,
  }: {
    header: React.ReactNode;
    main: React.ReactNode;
    footer: React.ReactNode;
    slotProps?: Record<string, Record<string, string>>;
  }) => (
    <div {...(slotProps?.root ?? {})}>
      <div {...(slotProps?.header ?? {})}>{header}</div>
      <div {...(slotProps?.main ?? {})}>{main}</div>
      <div {...(slotProps?.footer ?? {})}>{footer}</div>
    </div>
  ),
}));
jest.mock("@shared/ui/feedback/LoadingPrimitives", () => ({
  FullPageLoading: ({ message }: { message: string }) => (
    <div data-testid="full-page-loading">{message}</div>
  ),
}));

const mockUseSession = useSession as jest.Mock;
const mockUseCloseDates = useCloseDates as jest.Mock;
const mockUseNavigate = useNavigate as jest.Mock;
const mockUseLocation = useLocation as jest.Mock;

const makeSession = (overrides = {}) => ({
  signOut: jest.fn(),
  authStatus: "authenticated",
  cognitoUser: { emailVerified: true, username: "user1" },
  isLoading: false,
  hasRole: jest.fn().mockReturnValue(false),
  ...overrides,
});

function renderLayout(path = "/register") {
  mockUseLocation.mockReturnValue({ pathname: path, search: "", hash: "" });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout />
    </MemoryRouter>
  );
}

describe("Layout", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({ pathname: "/register", search: "", hash: "" });
    mockUseCloseDates.mockReturnValue({ closeDates: [], loading: false, error: null });
    // Use real useContext for AppConfigContext
    jest.spyOn(React, "useContext").mockImplementation((ctx) => {
      if (ctx === AppConfigContext) {
        return { config: { id: "cfg1" }, isConfigLoading: false };
      }
      return {};
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("認証済みのときアプリシェルを表示する", () => {
    mockUseSession.mockReturnValue(makeSession());
    renderLayout();
    expect(screen.getByTestId("layout-header")).toBeInTheDocument();
    expect(screen.getByTestId("layout-main")).toBeInTheDocument();
    expect(screen.getByTestId("layout-footer")).toBeInTheDocument();
  });

  it("configuringのときローディング画面を表示する", () => {
    mockUseSession.mockReturnValue(makeSession({ authStatus: "configuring" }));
    renderLayout();
    expect(screen.getByTestId("full-page-loading")).toBeInTheDocument();
  });

  it("セッションローディング中はローディング画面を表示する", () => {
    mockUseSession.mockReturnValue(makeSession({ isLoading: true }));
    renderLayout();
    expect(screen.getByTestId("full-page-loading")).toBeInTheDocument();
  });

  it("未認証でログイン以外のルートなら/loginにリダイレクトする", () => {
    mockUseSession.mockReturnValue(makeSession({ authStatus: "unauthenticated" }));
    renderLayout("/register");
    expect(mockNavigate).toHaveBeenCalledWith("/login", expect.objectContaining({ replace: true }));
  });

  it("/loginルートでは認証チェックしない", () => {
    mockUseSession.mockReturnValue(makeSession({ authStatus: "unauthenticated" }));
    renderLayout("/login");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("AppConfig読み込み中かつ設定未取得の場合はローディングを表示", () => {
    jest.spyOn(React, "useContext").mockImplementation((ctx) => {
      if (ctx === AppConfigContext) {
        return { config: null, isConfigLoading: true };
      }
      return {};
    });
    mockUseSession.mockReturnValue(makeSession());
    renderLayout();
    expect(screen.getByTestId("full-page-loading")).toBeInTheDocument();
  });

  it("管理者ユーザーにはNotificationViewportが表示される", () => {
    mockUseSession.mockReturnValue(makeSession({ hasRole: jest.fn().mockReturnValue(true) }));
    renderLayout();
    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();
  });

  it("Hub.listenが登録されクリーンアップで解除される", () => {
    const unsubscribe = jest.fn();
    (Hub.listen as jest.Mock).mockReturnValue(unsubscribe);
    mockUseSession.mockReturnValue(makeSession());
    const { unmount } = renderLayout();
    expect(Hub.listen).toHaveBeenCalledWith("auth", expect.any(Function));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
