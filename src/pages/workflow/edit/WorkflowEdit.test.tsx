import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import WorkflowEdit from "./WorkflowEdit";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "workflow-1" }),
    useLoaderData: () => ({
      workflow: {
        staffId: "staff-1",
      },
    }),
  };
});

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => ({
    staffs: [],
  }),
}));

jest.mock("@entities/workflow/model/useWorkflows", () => ({
  __esModule: true,
  default: () => ({
    update: jest.fn(),
  }),
}));

jest.mock("@shared/lib/useAppNotification", () => ({
  useAppNotification: () => ({
    notify: jest.fn(),
  }),
}));

jest.mock("@/entities/workflow/model/loader", () => ({
  fetchWorkflowById: jest.fn(),
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

jest.mock("@/features/workflow/hooks/useWorkflowEditLoaderState", () => ({
  useWorkflowEditLoaderState: () => ({
    category: "有給休暇申請",
    setCategory: jest.fn(),
    applicationDate: "2026-03-31",
    fields: {},
    setFieldValue: jest.fn(),
    resetFields: jest.fn(),
    draftMode: false,
    setDraftMode: jest.fn(),
    applicant: {
      familyName: "山田",
      givenName: "太郎",
    },
    existingComments: [],
    setExistingComments: jest.fn(),
    isDirty: false,
  }),
}));

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

describe("WorkflowEdit page layout", () => {
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
    const { container } = renderWithRouter(<WorkflowEdit />);

    expect(screen.getByText("申請を編集")).toBeInTheDocument();
    expect(screen.getByText("workflow-type-fields")).toBeInTheDocument();
    expect(
      container.querySelector('div[style*="component-page-widths-form"]'),
    ).toBeTruthy();
  });
});
