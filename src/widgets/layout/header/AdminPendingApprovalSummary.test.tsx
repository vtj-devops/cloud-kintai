import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { listAttendances } from "@shared/api/graphql/documents/queries";
import {
  onCreateAttendance,
  onDeleteAttendance,
  onUpdateAttendance,
} from "@shared/api/graphql/documents/subscriptions";
import { WorkflowStatus } from "@shared/api/graphql/types";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AdminPendingApprovalSummary from "./AdminPendingApprovalSummary";

const mockUseWorkflows = jest.fn();
const mockGraphql = jest.fn();

jest.mock("@/entities/workflow/model/useWorkflows", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseWorkflows(...args),
}));

jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

const createSubscription = () => ({
  subscribe: () => ({
    unsubscribe: jest.fn(),
  }),
});

function renderSummary(
  isAdminUser: boolean,
  options?: {
    showAdminOnlyTag?: boolean;
    visualVariant?: "default" | "dashboard";
  },
) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          authStatus: "authenticated",
          isAuthenticated: true,
          isLoading: false,
          roles: isAdminUser ? [StaffRole.ADMIN] : [],
          isCognitoUserRole: (role: StaffRole) =>
            isAdminUser && role === StaffRole.ADMIN,
        }}
      >
        <AdminPendingApprovalSummary
          showAdminOnlyTag={options?.showAdminOnlyTag}
          visualVariant={options?.visualVariant}
        />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("AdminPendingApprovalSummary", () => {
  beforeEach(() => {
    mockUseWorkflows.mockReset();
    mockGraphql.mockReset();
    mockUseWorkflows.mockReturnValue({
      workflows: [],
      loading: false,
    });
  });

  it("管理者には勤怠申請カードと管理者のみタグを表示する", async () => {
    mockUseWorkflows.mockReturnValue({
      workflows: [
        { id: "wf-1", status: WorkflowStatus.SUBMITTED },
        { id: "wf-2", status: WorkflowStatus.PENDING },
        { id: "wf-3", status: WorkflowStatus.APPROVED },
      ],
    });

    mockGraphql.mockImplementation(({ query }: { query: unknown }) => {
      if (query === listAttendances) {
        return Promise.resolve({
          data: {
            listAttendances: {
              items: [
                {
                  staffId: "staff-1",
                  workDate: "2026-03-01",
                  changeRequests: [{ completed: false }],
                },
                {
                  staffId: "staff-2",
                  workDate: "2026-03-02",
                  changeRequests: [{ completed: true }],
                },
              ],
              nextToken: null,
            },
          },
        });
      }

      if (
        query === onCreateAttendance ||
        query === onUpdateAttendance ||
        query === onDeleteAttendance
      ) {
        return createSubscription();
      }

      return Promise.resolve({});
    });

    renderSummary(true);

    expect(
      screen.getByTestId("admin-pending-approval-summary"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "勤怠修正申請" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ワークフロー申請" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-pending-approval-summary")).toHaveClass(
      "grid-cols-1",
    );
    expect(screen.getByTestId("admin-pending-attendance-card")).toHaveClass(
      "rounded-[4px]",
    );
    expect(screen.getByTestId("admin-pending-workflow-card")).toHaveClass(
      "rounded-[4px]",
    );
    expect(screen.getAllByText("管理者のみ")).toHaveLength(2);
    expect(
      screen.getByTestId("admin-pending-attendance-card-description-tooltip"),
    ).toHaveAttribute("aria-label", "未承認の勤怠修正申請");
    expect(
      screen.getByTestId("admin-pending-workflow-card-description-tooltip"),
    ).toHaveAttribute("aria-label", "未承認のワークフロー申請");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(screen.getByTestId("admin-pending-attendance-card")).toHaveAttribute(
      "href",
      "/admin/attendances",
    );
    expect(screen.getByTestId("admin-pending-workflow-card")).toHaveAttribute(
      "href",
      "/admin/workflow",
    );
    expect(screen.getByText("集計中")).toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("1件")).toBeInTheDocument();
    });
  });

  it("非管理者には表示しない", () => {
    mockUseWorkflows.mockReturnValue({ workflows: [] });
    renderSummary(false);

    expect(
      screen.queryByTestId("admin-pending-approval-summary"),
    ).not.toBeInTheDocument();
  });

  it("showAdminOnlyTag=false の場合は管理者のみタグを表示しない", async () => {
    mockUseWorkflows.mockReturnValue({
      workflows: [{ id: "wf-1", status: WorkflowStatus.PENDING }],
    });

    mockGraphql.mockImplementation(({ query }: { query: unknown }) => {
      if (query === listAttendances) {
        return Promise.resolve({
          data: {
            listAttendances: {
              items: [],
              nextToken: null,
            },
          },
        });
      }

      if (
        query === onCreateAttendance ||
        query === onUpdateAttendance ||
        query === onDeleteAttendance
      ) {
        return createSubscription();
      }

      return Promise.resolve({});
    });

    renderSummary(true, { showAdminOnlyTag: false });

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-pending-approval-summary"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("管理者のみ")).not.toBeInTheDocument();
  });

  it("dashboard variant の場合はダッシュボードカード基準の見た目を適用する", async () => {
    mockUseWorkflows.mockReturnValue({
      workflows: [{ id: "wf-1", status: WorkflowStatus.PENDING }],
    });

    mockGraphql.mockImplementation(({ query }: { query: unknown }) => {
      if (query === listAttendances) {
        return Promise.resolve({
          data: {
            listAttendances: {
              items: [],
              nextToken: null,
            },
          },
        });
      }

      if (
        query === onCreateAttendance ||
        query === onUpdateAttendance ||
        query === onDeleteAttendance
      ) {
        return createSubscription();
      }

      return Promise.resolve({});
    });

    renderSummary(true, {
      showAdminOnlyTag: false,
      visualVariant: "dashboard",
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-pending-approval-summary"),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-pending-attendance-card")).toHaveClass(
      "rounded-[4px]",
    );
    expect(screen.getByTestId("admin-pending-attendance-card")).toHaveClass(
      "h-full",
    );
    expect(screen.getByTestId("admin-pending-workflow-card")).toHaveClass(
      "rounded-[4px]",
    );
    expect(screen.getByTestId("admin-pending-workflow-card")).toHaveClass(
      "h-full",
    );
    expect(
      screen.getByTestId("admin-pending-attendance-card-description-tooltip"),
    ).toHaveAttribute("aria-label", "未承認の勤怠修正申請");
    expect(
      screen.getByTestId("admin-pending-workflow-card-description-tooltip"),
    ).toHaveAttribute("aria-label", "未承認のワークフロー申請");
    expect(screen.queryByText("管理者のみ")).not.toBeInTheDocument();
  });

  it("layoutMode=two-columns の場合は2列で表示する", async () => {
    mockGraphql.mockImplementation(({ query }: { query: unknown }) => {
      if (query === listAttendances) {
        return Promise.resolve({
          data: {
            listAttendances: {
              items: [],
              nextToken: null,
            },
          },
        });
      }

      if (
        query === onCreateAttendance ||
        query === onUpdateAttendance ||
        query === onDeleteAttendance
      ) {
        return createSubscription();
      }

      return Promise.resolve({});
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            signOut: jest.fn(),
            signIn: jest.fn(),
            authStatus: "authenticated",
            isAuthenticated: true,
            isLoading: false,
            roles: [StaffRole.ADMIN],
            isCognitoUserRole: (role: StaffRole) => role === StaffRole.ADMIN,
          }}
        >
          <AdminPendingApprovalSummary layoutMode="two-columns" />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-pending-approval-summary"),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-pending-approval-summary")).toHaveClass(
      "grid-cols-2",
    );
  });
});
