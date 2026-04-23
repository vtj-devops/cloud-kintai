import { fireEvent,render, screen } from "@testing-library/react";

import { WorkflowDetailContext } from "../../model/WorkflowDetailContext";
import WorkflowDetailActions from "../WorkflowDetailActions";
import WorkflowDetailHeader from "../WorkflowDetailHeader";
import { WorkflowMetadataPanelBase } from "../WorkflowMetadataPanel";

jest.mock("./WorkflowDetailActions.module.scss", () => ({
  actions: "actions",
  backButton: "backButton",
  actionsRight: "actionsRight",
  dangerPillButton: "dangerPillButton",
  pillButton: "pillButton",
}));

jest.mock("./WorkflowDetailHeader.module.scss", () => ({
  header: "header",
  inner: "inner",
  titleBlock: "titleBlock",
  title: "title",
  description: "description",
}));

jest.mock("@mui/icons-material/ArrowBackRounded", () => ({
  __esModule: true,
  default: () => <span data-testid="back-icon" />,
}));

jest.mock("@shared/ui/typography", () => ({
  PageTitle: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  SubsectionTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}));

jest.mock("@shared/ui/chips/StatusChip", () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => (
    <span data-testid="status-chip">{status}</span>
  ),
}));

jest.mock("@features/workflow/approval-flow/ui/WorkflowApprovalTimeline", () => ({
  __esModule: true,
  default: () => <div data-testid="approval-timeline" />,
}));

jest.mock("@shared/lib/time", () => ({
  formatDateSlash: (date: string | null | undefined) => date ?? "-",
}));

const makeDefaultContext = (overrides = {}) => ({
  data: {
    workflow: null,
    id: "wf-001",
    staffs: [],
    staffName: "山田 太郎",
    applicationDate: "2024-01-15",
    categoryLabel: "残業申請",
    approvalSteps: [],
    currentStaff: undefined,
    messages: [],
  },
  ui: { expandedMessages: {}, input: "", sending: false },
  actions: {
    permissions: {
      withdrawDisabled: false,
      withdrawTooltip: "",
      editDisabled: false,
      editTooltip: "",
      canApprove: false,
      canReject: false,
    },
    onBack: jest.fn(),
    onWithdraw: jest.fn(),
    onEdit: jest.fn(),
    toggleExpanded: jest.fn(),
    setInput: jest.fn(),
    formatSender: (s?: string) => s ?? "不明",
    sendMessage: jest.fn(),
  },
  workflow: null,
  id: "wf-001",
  staffs: [],
  staffName: "山田 太郎",
  applicationDate: "2024-01-15",
  categoryLabel: "残業申請",
  approvalSteps: [],
  permissions: {
    withdrawDisabled: false,
    withdrawTooltip: "",
    editDisabled: false,
    editTooltip: "",
    canApprove: false,
    canReject: false,
  },
  onBack: jest.fn(),
  onWithdraw: jest.fn(),
  onEdit: jest.fn(),
  currentStaff: undefined,
  messages: [],
  expandedMessages: {},
  toggleExpanded: jest.fn(),
  input: "",
  setInput: jest.fn(),
  sending: false,
  formatSender: (s?: string) => s ?? "不明",
  sendMessage: jest.fn(),
  ...overrides,
});

const renderWithContext = (ui: React.ReactElement, contextOverrides = {}) => {
  const ctx = makeDefaultContext(contextOverrides);
  return render(
    <WorkflowDetailContext.Provider value={ctx}>
      {ui}
    </WorkflowDetailContext.Provider>,
  );
};

// ─────────────────────────────────────────────
// WorkflowDetailActions
// ─────────────────────────────────────────────
describe("WorkflowDetailActions", () => {
  it("「一覧に戻る」ボタンを表示する", () => {
    renderWithContext(<WorkflowDetailActions />);
    expect(screen.getByText("一覧に戻る")).toBeInTheDocument();
  });

  it("「取り下げ」ボタンを表示する", () => {
    renderWithContext(<WorkflowDetailActions />);
    expect(screen.getByRole("button", { name: "取り下げ" })).toBeInTheDocument();
  });

  it("「編集」ボタンを表示する", () => {
    renderWithContext(<WorkflowDetailActions />);
    expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  it("「一覧に戻る」クリックで onBack を呼ぶ", () => {
    const onBack = jest.fn();
    renderWithContext(<WorkflowDetailActions />, { onBack });
    fireEvent.click(screen.getByText("一覧に戻る"));
    expect(onBack).toHaveBeenCalled();
  });

  it("「取り下げ」クリックで onWithdraw を呼ぶ", () => {
    const onWithdraw = jest.fn();
    renderWithContext(<WorkflowDetailActions />, { onWithdraw });
    fireEvent.click(screen.getByRole("button", { name: "取り下げ" }));
    expect(onWithdraw).toHaveBeenCalled();
  });

  it("「編集」クリックで onEdit を呼ぶ", () => {
    const onEdit = jest.fn();
    renderWithContext(<WorkflowDetailActions />, { onEdit });
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(onEdit).toHaveBeenCalled();
  });

  it("withdrawDisabled のとき取り下げボタンが disabled", () => {
    renderWithContext(<WorkflowDetailActions />, {
      permissions: {
        withdrawDisabled: true,
        withdrawTooltip: "取り下げ不可",
        editDisabled: false,
        editTooltip: "",
        canApprove: false,
        canReject: false,
      },
    });
    expect(screen.getByRole("button", { name: "取り下げ" })).toBeDisabled();
  });

  it("editDisabled のとき編集ボタンが disabled", () => {
    renderWithContext(<WorkflowDetailActions />, {
      permissions: {
        withdrawDisabled: false,
        withdrawTooltip: "",
        editDisabled: true,
        editTooltip: "編集不可",
        canApprove: false,
        canReject: false,
      },
    });
    expect(screen.getByRole("button", { name: "編集" })).toBeDisabled();
  });
});

// ─────────────────────────────────────────────
// WorkflowDetailHeader
// ─────────────────────────────────────────────
describe("WorkflowDetailHeader", () => {
  it("「申請内容」タイトルを表示する", () => {
    renderWithContext(<WorkflowDetailHeader />);
    expect(screen.getByText("申請内容")).toBeInTheDocument();
  });

  it("説明文を表示する", () => {
    renderWithContext(<WorkflowDetailHeader />);
    expect(
      screen.getByText(/申請内容の確認、コメントのやり取り/),
    ).toBeInTheDocument();
  });

  it("WorkflowDetailActions を内包する（一覧に戻るボタンが存在）", () => {
    renderWithContext(<WorkflowDetailHeader />);
    expect(screen.getByText("一覧に戻る")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// WorkflowMetadataPanelBase
// ─────────────────────────────────────────────
describe("WorkflowMetadataPanelBase", () => {
  const baseProps = {
    workflowId: "wf-001",
    categoryLabel: "残業申請",
    staffName: "田中 花子",
    applicationDate: "2024-01-15",
    approvalSteps: [],
  };

  it("ID を表示する", () => {
    render(<WorkflowMetadataPanelBase {...baseProps} />);
    expect(screen.getByText("wf-001")).toBeInTheDocument();
  });

  it("種別を表示する", () => {
    render(<WorkflowMetadataPanelBase {...baseProps} />);
    expect(screen.getByText("残業申請")).toBeInTheDocument();
  });

  it("申請者を表示する", () => {
    render(<WorkflowMetadataPanelBase {...baseProps} />);
    expect(screen.getByText("田中 花子")).toBeInTheDocument();
  });

  it("申請日を表示する", () => {
    render(<WorkflowMetadataPanelBase {...baseProps} />);
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });

  it("workflowId が null のとき fallbackId を表示する", () => {
    render(
      <WorkflowMetadataPanelBase
        {...baseProps}
        workflowId={null}
        fallbackId="fb-999"
      />,
    );
    expect(screen.getByText("fb-999")).toBeInTheDocument();
  });

  it("ApprovalTimeline を表示する", () => {
    render(<WorkflowMetadataPanelBase {...baseProps} />);
    expect(screen.getByTestId("approval-timeline")).toBeInTheDocument();
  });

  it("StatusChip を表示する", () => {
    render(
      <WorkflowMetadataPanelBase
        {...baseProps}
        status={"PENDING" as import("@shared/api/graphql/types").WorkflowStatus}
      />,
    );
    expect(screen.getByTestId("status-chip")).toBeInTheDocument();
  });
});
