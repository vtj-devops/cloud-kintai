/**
 * WorkflowDetail ページ インテグレーションテスト
 *
 * WorkflowDetailProvider は useLoaderData・useSession・useStaffs などを持つ
 * 複雑な Provider のため、丸ごとスタブ化してコンテキストを直接注入する。
 * 子コンポーネント（Header / MetadataPanel / CommentThread）も UI に集中するためスタブ化。
 */

// ---- 子コンポーネントのスタブ ----
import { renderWithProviders } from "@shared/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import WorkflowDetail from "../WorkflowDetail";

jest.mock(
  "@features/workflow/detail-panel/ui/WorkflowDetailHeader",
  () => ({
    __esModule: true,
    default: () => <div data-testid="workflow-detail-header" />,
  }),
);

jest.mock(
  "@features/workflow/detail-panel/ui/WorkflowMetadataPanel",
  () => ({
    __esModule: true,
    default: () => <div data-testid="workflow-metadata-panel" />,
  }),
);

jest.mock(
  "@features/workflow/comment-thread/ui/WorkflowCommentThread",
  () => ({
    __esModule: true,
    default: () => <div data-testid="workflow-comment-thread" />,
  }),
);

// ---- useWorkflowDetailContext をモック関数にする ----
// babel-jest の hoisting は "mock" プレフィックスの変数を認識してくれるため
// このパターンで factory 内から参照できる
const mockUseWorkflowDetailContext = jest.fn();

jest.mock(
  "@features/workflow/detail-panel/model/WorkflowDetailContext",
  () => ({
    ...jest.requireActual(
      "@features/workflow/detail-panel/model/WorkflowDetailContext",
    ),
    useWorkflowDetailContext: mockUseWorkflowDetailContext,
  }),
);

// WorkflowDetailProvider は子を素通りするだけにする
// (中で useLoaderData 等を呼ぶのを回避)
jest.mock(
  "@features/workflow/detail-panel/model/WorkflowDetailProvider",
  () => ({
    WorkflowDetailProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  }),
);

/** useWorkflowDetailContext が返すベースモック値 */
const baseMockContext = {
  data: {
    workflow: null,
    id: undefined,
    staffs: [],
    staffName: "",
    applicationDate: "",
    categoryLabel: "",
    approvalSteps: [],
    currentStaff: undefined,
    messages: [],
  },
  ui: { expandedMessages: {}, input: "", sending: false },
  actions: {
    permissions: {
      isSubmittedOrLater: false,
      isFinalized: false,
      editDisabled: true,
      withdrawDisabled: true,
    },
    onBack: jest.fn(),
    onWithdraw: jest.fn(),
    onEdit: jest.fn(),
    toggleExpanded: jest.fn(),
    setInput: jest.fn(),
    formatSender: jest.fn(),
    sendMessage: jest.fn(),
  },
  // flat fields (後方互換)
  workflow: null,
  id: undefined,
  staffs: [],
  staffName: "",
  applicationDate: "",
  categoryLabel: "",
  approvalSteps: [],
  permissions: {
    isSubmittedOrLater: false,
    isFinalized: false,
    editDisabled: true,
    withdrawDisabled: true,
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
  formatSender: jest.fn(),
  sendMessage: jest.fn(),
};

describe("WorkflowDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkflowDetailContext.mockReturnValue(baseMockContext);
  });

  it("クラッシュせずにレンダリングされる", () => {
    renderWithProviders(<WorkflowDetail />);
    // WorkflowDetailHeader スタブが表示されれば正常にマウントされている
    expect(screen.getByTestId("workflow-detail-header")).toBeInTheDocument();
  });

  it("WorkflowDetailHeader が常に表示される", () => {
    renderWithProviders(<WorkflowDetail />);
    expect(screen.getByTestId("workflow-detail-header")).toBeInTheDocument();
  });

  it("workflow が null のとき、読み込みエラーメッセージを表示する", () => {
    mockUseWorkflowDetailContext.mockReturnValue({
      ...baseMockContext,
      workflow: null,
      data: { ...baseMockContext.data, workflow: null },
    });
    renderWithProviders(<WorkflowDetail />);
    expect(
      screen.getByText("ワークフローの読み込みに失敗しました。"),
    ).toBeInTheDocument();
  });

  it("workflow が null のとき、メタデータパネルとコメントスレッドを表示しない", () => {
    mockUseWorkflowDetailContext.mockReturnValue({
      ...baseMockContext,
      workflow: null,
      data: { ...baseMockContext.data, workflow: null },
    });
    renderWithProviders(<WorkflowDetail />);
    expect(
      screen.queryByTestId("workflow-metadata-panel"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("workflow-comment-thread"),
    ).not.toBeInTheDocument();
  });

  it("workflow が存在するとき、メタデータパネルとコメントスレッドを表示する", () => {
    mockUseWorkflowDetailContext.mockReturnValue({
      ...baseMockContext,
      workflow: { id: "wf-1", status: "SUBMITTED" } as never,
      data: {
        ...baseMockContext.data,
        workflow: { id: "wf-1", status: "SUBMITTED" } as never,
      },
    });
    renderWithProviders(<WorkflowDetail />);
    expect(screen.getByTestId("workflow-metadata-panel")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-comment-thread")).toBeInTheDocument();
  });
});
