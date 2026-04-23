import { render, screen } from "@testing-library/react";

import WorkflowApprovalTimeline from "../WorkflowApprovalTimeline";

jest.mock("@shared/ui/chips/StatusChip", () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => (
    <span data-testid="status-chip">{status}</span>
  ),
}));

jest.mock("@shared/ui/typography", () => ({
  SubsectionTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="subsection-title">{children}</h3>
  ),
}));

const makeStep = (
  overrides: Partial<{
    id: string;
    name: string;
    role: string;
    state: string;
    date: string;
  }> = {},
) => ({
  id: "step1",
  name: "田中 太郎",
  role: "承認者",
  state: "未承認",
  ...overrides,
});

describe("WorkflowApprovalTimeline", () => {
  describe("基本表示", () => {
    it("デフォルトタイトル「承認フロー」を表示する", () => {
      render(<WorkflowApprovalTimeline steps={[makeStep()]} />);
      expect(screen.getByTestId("subsection-title")).toHaveTextContent(
        "承認フロー",
      );
    });

    it("カスタムタイトルを表示する", () => {
      render(
        <WorkflowApprovalTimeline title="カスタムフロー" steps={[makeStep()]} />,
      );
      expect(screen.getByTestId("subsection-title")).toHaveTextContent(
        "カスタムフロー",
      );
    });

    it("ステップ名を表示する", () => {
      render(<WorkflowApprovalTimeline steps={[makeStep({ name: "鈴木 花子" })]} />);
      expect(screen.getByText("鈴木 花子")).toBeInTheDocument();
    });

    it("複数ステップを表示する", () => {
      const steps = [
        makeStep({ id: "s1", name: "山田 太郎", role: "申請者" }),
        makeStep({ id: "s2", name: "承認者A", role: "承認者" }),
        makeStep({ id: "s3", name: "承認者B", role: "承認者" }),
      ];
      render(<WorkflowApprovalTimeline steps={steps} />);
      expect(screen.getByText("山田 太郎")).toBeInTheDocument();
      expect(screen.getByText("承認者A")).toBeInTheDocument();
      expect(screen.getByText("承認者B")).toBeInTheDocument();
    });

    it("ステップが0件でもクラッシュしない", () => {
      render(<WorkflowApprovalTimeline steps={[]} />);
      expect(screen.getByTestId("subsection-title")).toBeInTheDocument();
    });
  });

  describe("申請者ステップ", () => {
    it("role が「申請者」のとき StatusChip を表示しない", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ role: "申請者" })]}
        />,
      );
      expect(screen.queryByTestId("status-chip")).not.toBeInTheDocument();
    });

    it("最初のステップに「申」バッジを表示する", () => {
      render(<WorkflowApprovalTimeline steps={[makeStep({ role: "申請者" })]} />);
      expect(screen.getByText("申")).toBeInTheDocument();
    });
  });

  describe("承認者ステップ", () => {
    it("role が「申請者」以外のとき StatusChip を表示する", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ role: "承認者", state: "未承認" })]}
        />,
      );
      expect(screen.getByTestId("status-chip")).toHaveTextContent("未承認");
    });

    it("承認済み状態の StatusChip を表示する", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ role: "承認者", state: "承認済み" })]}
        />,
      );
      expect(screen.getByTestId("status-chip")).toHaveTextContent("承認済み");
    });

    it("2番目のステップに数字バッジ「1」を表示する", () => {
      const steps = [
        makeStep({ id: "s1", role: "申請者" }),
        makeStep({ id: "s2", role: "承認者" }),
      ];
      render(<WorkflowApprovalTimeline steps={steps} />);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("日付表示", () => {
    it("date が設定されているとき表示する", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ date: "2024-01-15" })]}
        />,
      );
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });

    it("date が未設定のとき日付部分を表示しない", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ date: undefined })]}
        />,
      );
      expect(screen.queryByText(/・/)).not.toBeInTheDocument();
    });
  });

  describe("ロール表示", () => {
    it("ステップのロールを表示する", () => {
      render(
        <WorkflowApprovalTimeline
          steps={[makeStep({ role: "部長", name: "山田 次郎" })]}
        />,
      );
      expect(screen.getByText(/部長/)).toBeInTheDocument();
    });
  });
});
