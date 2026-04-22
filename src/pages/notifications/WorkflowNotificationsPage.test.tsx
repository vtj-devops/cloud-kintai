import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { render, screen } from "@testing-library/react";
import type {
  ButtonHTMLAttributes,
  ContextType,
  ReactNode,
} from "react";
import { MemoryRouter } from "react-router-dom";

import WorkflowNotificationsPage from "./WorkflowNotificationsPage";

const mockUseWorkflowNotificationInbox = jest.fn();

jest.mock("@/features/workflow/notification/model/useWorkflowNotificationInbox", () => ({
  useWorkflowNotificationInbox: () => mockUseWorkflowNotificationInbox(),
}));

jest.mock("@/shared/ui/button", () => ({
  AppButton: function MockAppButton({
    children,
    startIcon: _startIcon,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: ReactNode;
    startIcon?: ReactNode;
  }) {
    return <button {...props}>{children}</button>;
  },
}));

describe("WorkflowNotificationsPage", () => {
  it("renders inside the narrow page width preset", () => {
    mockUseWorkflowNotificationInbox.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      loadMoreNotifications: jest.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            signOut: jest.fn(),
            signIn: jest.fn(),
            isCognitoUserRole: () => false,
          }}
        >
          <AppConfigContext.Provider
            value={{
              getWorkflowNotificationEnabled: () => true,
            } as unknown as ContextType<typeof AppConfigContext>}
          >
            <WorkflowNotificationsPage />
          </AppConfigContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText("通知一覧")).toBeInTheDocument();
    expect(
      container.querySelector('div[style*="component-page-widths-narrow"]'),
    ).toBeTruthy();
  });
});
