import { AuthContext } from "@app/providers/auth/AuthContext";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import NewWorkflow from "./NewWorkflow";

jest.mock("@entities/app-config/model/useAppConfig", () => ({
  __esModule: true,
  default: () => ({
    config: {},
    getStartTime: () => dayjs("09:00", "HH:mm"),
    getEndTime: () => dayjs("18:00", "HH:mm"),
    getAbsentEnabled: () => true,
  }),
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => ({
    staffs: [
      {
        id: "staff-1",
        cognitoUserId: "user-1",
        familyName: "山田",
        givenName: "太郎",
      },
    ],
  }),
}));

jest.mock("@entities/workflow/model/useWorkflows", () => ({
  __esModule: true,
  default: () => ({
    create: jest.fn(),
  }),
}));

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({
    notify: jest.fn(),
  }),
}));

jest.mock(
  "@/features/workflow/application-form/model/DynamicWorkflowFormContext",
  () => ({
    DynamicWorkflowFormProvider: function MockDynamicWorkflowFormProvider({
      children,
    }: {
      children: ReactNode;
    }) {
      return <>{children}</>;
    },
  }),
);

jest.mock(
  "@/features/workflow/application-form/ui/DynamicWorkflowTypeFields",
  () => {
    function MockDynamicWorkflowTypeFields() {
      return <div>workflow-type-fields</div>;
    }
    return MockDynamicWorkflowTypeFields;
  },
);

jest.mock(
  "@/features/workflow/notifications/sendWorkflowSubmissionNotification",
  () => ({
    sendWorkflowSubmissionNotification: jest.fn(),
  }),
);

// YAML import mock
jest.mock("@features/workflow/config/workflow-types.yaml", () => ({ types: [] }));

describe("NewWorkflow page layout", () => {
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

  it("renders inside the form width preset", () => {
    const { container } = renderWithRouter(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: () => false,
          authStatus: "authenticated",
          cognitoUser: { id: "user-1" } as never,
        }}
      >
        <NewWorkflow />
      </AuthContext.Provider>,
    );

    expect(screen.getAllByText("新規作成")[0]).toBeInTheDocument();
    expect(screen.getByText("workflow-type-fields")).toBeInTheDocument();
    expect(
      container.querySelector('div[style*="component-page-widths-form"]'),
    ).toBeTruthy();
  });
});
