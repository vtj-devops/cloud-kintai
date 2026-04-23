import type { AuthContextProps } from "@app/providers/auth/AuthContext";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "@shared/lib/store/notificationSlice";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { createMockAppConfig, createMockUser } from "./mockFactories";

export type RenderWithProvidersOptions = {
  /** MemoryRouter でラップするか（デフォルト: true） */
  router?: boolean;
  /** MemoryRouter の initialEntries（デフォルト: ['/']） */
  initialEntries?: string[];
  /** AuthContext に渡す値（省略時: 認証済みスタッフユーザー） */
  authContext?: Partial<AuthContextProps>;
  /** AppConfigContext に渡す値（省略時: デフォルト AppConfig） */
  appConfigContext?: Parameters<typeof createMockAppConfig>[0];
  /** @testing-library/react の render オプション */
  renderOptions?: Omit<RenderOptions, "wrapper">;
};

export function createTestStore() {
  return configureStore({
    reducer: {
      notifications: notificationReducer,
    },
  });
}

const DEFAULT_COGNITO_USER = createMockUser();

const DEFAULT_AUTH_CONTEXT: AuthContextProps = {
  session: {
    roles: [StaffRole.STAFF],
    cognitoUser: DEFAULT_COGNITO_USER,
  },
  isAuthenticated: true,
  isLoading: false,
  authStatus: "authenticated",
  cognitoUser: DEFAULT_COGNITO_USER,
  roles: [StaffRole.STAFF],
  signOut: jest.fn(),
  signIn: jest.fn(),
  hasRole: (role: StaffRole) => role === StaffRole.STAFF,
  isCognitoUserRole: (role: StaffRole) => role === StaffRole.STAFF,
};

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions,
): RenderResult {
  const {
    router = true,
    initialEntries = ["/"],
    authContext,
    appConfigContext,
    renderOptions,
  } = options ?? {};

  const store = createTestStore();

  const authValue: AuthContextProps = {
    ...DEFAULT_AUTH_CONTEXT,
    ...authContext,
  };

  const appConfigValue = {
    ...createMockAppConfig(appConfigContext),
  };

  function Wrapper({ children }: PropsWithChildren) {
    const content = (
      <Provider store={store}>
        <AuthContext.Provider value={authValue}>
          <AppConfigContext.Provider value={appConfigValue}>
            {children}
          </AppConfigContext.Provider>
        </AuthContext.Provider>
      </Provider>
    );

    if (router) {
      return (
        <MemoryRouter initialEntries={initialEntries}>{content}</MemoryRouter>
      );
    }

    return content;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
