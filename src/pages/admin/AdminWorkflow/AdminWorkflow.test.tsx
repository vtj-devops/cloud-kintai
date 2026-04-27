import { AuthContext } from "@app/providers/auth/AuthContext";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { fireEvent, render, screen } from "@testing-library/react";

import AdminWorkflow from "./AdminWorkflow";

const mockNavigate = jest.fn();
const mockUseAppConfig = jest.fn();
const mockUseWorkflows = jest.fn();
const mockUseStaffs = jest.fn();
const mockUseSplitView = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("@entities/app-config/model/useAppConfig", () => ({
  __esModule: true,
  default: () => mockUseAppConfig(),
}));

jest.mock("@entities/workflow/model/useWorkflows", () => ({
  __esModule: true,
  default: () => mockUseWorkflows(),
}));

jest.mock("@entities/staff/model/useStaffs/useStaffs", () => ({
  useStaffs: () => mockUseStaffs(),
}));

jest.mock("@/features/splitView", () => ({
  useSplitView: () => mockUseSplitView(),
}));

jest.mock("./components/WorkflowDetailPanel", () => () => null);
jest.mock("./components/WorkflowCarouselDialog", () => () => null);
jest.mock("@features/admin-config-workflow/AdminWorkflowSettingsDialog", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div>workflow-settings-dialog</div> : null,
}));

describe("AdminWorkflow", () => {
  const renderPage = () =>
    render(
      <AuthContext.Provider
        value={{
          signOut: jest.fn(),
          signIn: jest.fn(),
          isCognitoUserRole: jest.fn(),
          authStatus: "authenticated",
        }}
      >
        <AdminWorkflow />
      </AuthContext.Provider>,
    );

  beforeEach(() => {
    mockNavigate.mockReset();

    mockUseAppConfig.mockReturnValue({
      config: {},
      getAbsentEnabled: () => false,
      getWorkflowCategoryOrder: () => [
        {
          category: WorkflowCategory.OVERTIME,
          enabled: true,
          label: "残業",
        },
        {
          category: WorkflowCategory.PAID_LEAVE,
          enabled: true,
          label: "有給",
        },
      ],
    });

    const workflows = Array.from({ length: 12 }, (_, index) => ({
      __typename: "Workflow" as const,
      id: `wf-${index + 1}`,
      category:
        index % 2 === 0 ? WorkflowCategory.OVERTIME : WorkflowCategory.PAID_LEAVE,
      staffId: index % 2 === 0 ? "staff-1" : "staff-2",
      status: WorkflowStatus.PENDING,
      createdAt: `2026-03-${String(index + 1).padStart(2, "0")}T09:00:00.000Z`,
      updatedAt: `2026-03-${String(index + 1).padStart(2, "0")}T09:30:00.000Z`,
      comments: [],
      approvalSteps: [],
    }));

    mockUseWorkflows.mockReturnValue({
      workflows,
      loading: false,
      error: null,
    });

    mockUseStaffs.mockReturnValue({
      staffs: [
        {
          id: "staff-1",
          familyName: "申請",
          givenName: "太郎",
          cognitoUserId: "c1",
        },
        {
          id: "staff-2",
          familyName: "申請",
          givenName: "花子",
          cognitoUserId: "c2",
        },
      ],
      loading: false,
      error: null,
    });

    mockUseSplitView.mockReturnValue({
      enableSplitMode: jest.fn(),
      setRightPanel: jest.fn(),
    });
  });

  it("カテゴリ絞り込みとページネーションが機能する", () => {
    renderPage();

    expect(screen.getByText("12 件の申請")).toBeInTheDocument();
    expect(screen.getByText("ページ 1 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText("ページ 2 / 2")).toBeInTheDocument();

    const categorySelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(categorySelect, {
      target: { value: WorkflowCategory.PAID_LEAVE },
    });

    expect(screen.getByText("6 件の申請")).toBeInTheDocument();
    expect(screen.getByText("ページ 1 / 1")).toBeInTheDocument();
  });

  it("一覧行クリックで詳細画面へ遷移する", () => {
    renderPage();

    fireEvent.click(screen.getByText("2026-03-12"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/workflow/wf-12");
  });

  it("設定ボタンから設定ダイアログを開ける", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "ワークフロー設定を開く" }));

    expect(screen.getByText("workflow-settings-dialog")).toBeInTheDocument();
  });
});
