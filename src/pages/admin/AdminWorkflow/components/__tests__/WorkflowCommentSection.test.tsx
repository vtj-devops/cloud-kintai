import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import WorkflowCommentSection from "../WorkflowCommentSection";

// ── mock declarations ────────────────────────────────────────────────────────

const mockSubmitWorkflowComment = jest.fn();
const mockWorkflowCommentThreadView = jest.fn();

jest.mock(
  "@features/workflow/comment-thread/model/submitWorkflowComment",
  () => ({
    submitWorkflowComment: (...args: unknown[]) =>
      mockSubmitWorkflowComment(...args),
  }),
);

// WorkflowCommentThread のスタブ: props をそのまま UI として描画
jest.mock(
  "@features/workflow/comment-thread/ui/WorkflowCommentThread",
  () => ({
    WorkflowCommentThreadView: (props: Record<string, unknown>) => {
      mockWorkflowCommentThreadView(props);
      return React.createElement(
        "div",
        { "data-testid": "comment-thread" },
        React.createElement("textarea", {
          "data-testid": "comment-input",
          value: props.input as string,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            (props.setInput as (v: string) => void)(e.target.value);
          },
          readOnly: false,
        }),
        React.createElement(
          "button",
          {
            "data-testid": "send-button",
            onClick: props.onSend as () => void,
            disabled: props.sending as boolean,
          },
          "送信",
        ),
        React.createElement(
          "div",
          { "data-testid": "messages" },
          ((props.messages as Array<{ id: string; text: string }>) ?? []).map(
            (m) =>
              React.createElement(
                "div",
                { key: m.id, "data-testid": `message-${m.id}` },
                m.text,
              ),
          ),
        ),
      );
    },
  }),
);

// ── helpers ──────────────────────────────────────────────────────────────────

const STAFF_A = {
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  role: "Staff",
};

const STAFF_B = {
  id: "staff-2",
  cognitoUserId: "cognito-2",
  familyName: "鈴木",
  givenName: "花子",
  role: "Admin",
};

const makeWorkflow = (overrides: Record<string, unknown> = {}) => ({
  __typename: "Workflow" as const,
  id: "wf-1",
  staffId: "staff-1",
  status: WorkflowStatus.PENDING,
  category: WorkflowCategory.PAID_LEAVE,
  comments: [],
  approvalSteps: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const makeComment = (overrides: Record<string, unknown> = {}) => ({
  __typename: "WorkflowComment" as const,
  id: "comment-1",
  staffId: "staff-1",
  text: "テストコメント",
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const defaultProps = {
  workflow: makeWorkflow(),
  staffs: [STAFF_A, STAFF_B],
  cognitoUser: { id: "cognito-1", familyName: "山田", givenName: "太郎" },
  onWorkflowUpdated: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
};

// ── tests ────────────────────────────────────────────────────────────────────

describe("WorkflowCommentSection", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("レンダリング", () => {
    it("comment-thread が描画される", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      expect(screen.getByTestId("comment-thread")).toBeInTheDocument();
    });

    it("WorkflowCommentThread に messages が渡される", () => {
      const comment = makeComment();
      const workflow = makeWorkflow({ comments: [comment] });
      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          workflow,
        }),
      );
      expect(screen.getByTestId("message-comment-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-comment-1").textContent).toBe(
        "テストコメント",
      );
    });

    it("workflow が null の場合は空のスレッドが描画される", () => {
      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          workflow: null,
        }),
      );
      expect(screen.getByTestId("comment-thread")).toBeInTheDocument();
    });

    it("スタッフ名が送信者として messages に反映される", () => {
      const comment = makeComment({ staffId: "staff-1" });
      const workflow = makeWorkflow({ comments: [comment] });
      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          workflow,
        }),
      );
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      const msg = lastCall.messages.find(
        (m: { id: string }) => m.id === "comment-1",
      );
      expect(msg?.sender).toBe("山田 太郎");
    });
  });

  describe("コメント送信 (handleSend)", () => {
    it("正常系: コメントを送信して onSuccess を呼ぶ", async () => {
      const user = userEvent.setup();
      const updatedWorkflow = makeWorkflow({
        comments: [makeComment({ text: "送信テスト" })],
      });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      const onSuccess = jest.fn();
      const onWorkflowUpdated = jest.fn();

      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          onSuccess,
          onWorkflowUpdated,
        }),
      );

      await user.type(screen.getByTestId("comment-input"), "送信テスト");
      await user.click(screen.getByTestId("send-button"));

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
      expect(onSuccess).toHaveBeenCalledWith("コメントを送信しました");
      expect(onWorkflowUpdated).toHaveBeenCalledWith(updatedWorkflow);
    });

    it("送信後は input が空になる", async () => {
      const user = userEvent.setup();
      const updatedWorkflow = makeWorkflow({ comments: [] });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      render(React.createElement(WorkflowCommentSection, defaultProps));

      const textarea = screen.getByTestId("comment-input");
      await user.type(textarea, "テスト");

      await user.click(screen.getByTestId("send-button"));

      await waitFor(() =>
        expect(mockSubmitWorkflowComment).toHaveBeenCalled(),
      );

      // input がクリアされた
      const lastCallProps =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(lastCallProps.input).toBe("");
    });

    it("エラー発生時は onError を呼ぶ", async () => {
      const user = userEvent.setup();
      mockSubmitWorkflowComment.mockRejectedValue(
        new Error("送信に失敗しました"),
      );

      const onError = jest.fn();

      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          onError,
        }),
      );

      await user.type(screen.getByTestId("comment-input"), "テスト");
      await user.click(screen.getByTestId("send-button"));

      await waitFor(() => expect(onError).toHaveBeenCalled());
      expect(onError).toHaveBeenCalledWith("送信に失敗しました");
    });

    it("空 input の場合は送信しない", async () => {
      const user = userEvent.setup();
      render(React.createElement(WorkflowCommentSection, defaultProps));

      await user.click(screen.getByTestId("send-button"));
      expect(mockSubmitWorkflowComment).not.toHaveBeenCalled();
    });

    it("workflow が null の場合は送信しない", async () => {
      const user = userEvent.setup();
      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          workflow: null,
        }),
      );

      await user.type(screen.getByTestId("comment-input"), "テスト");
      await user.click(screen.getByTestId("send-button"));

      expect(mockSubmitWorkflowComment).not.toHaveBeenCalled();
    });

    it("エラー時にオプティミスティックメッセージが削除される", async () => {
      const user = userEvent.setup();

      let rejectSubmit!: (error: unknown) => void;
      const submitPromise = new Promise((_, reject) => {
        rejectSubmit = reject;
      });
      mockSubmitWorkflowComment.mockReturnValue(submitPromise);

      render(React.createElement(WorkflowCommentSection, defaultProps));

      await user.type(screen.getByTestId("comment-input"), "失敗するコメント");
      await user.click(screen.getByTestId("send-button"));

      // オプティミスティックメッセージが表示されている
      const beforeReject =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(
        beforeReject.messages.some(
          (m: { text: string }) => m.text === "失敗するコメント",
        ),
      ).toBe(true);

      await act(async () => {
        rejectSubmit(new Error("API エラー"));
      });

      await waitFor(() => {
        const afterReject =
          mockWorkflowCommentThreadView.mock.calls[
            mockWorkflowCommentThreadView.mock.calls.length - 1
          ][0];
        expect(
          afterReject.messages.every(
            (m: { text: string }) => m.text !== "失敗するコメント",
          ),
        ).toBe(true);
      });
    });
  });

  describe("formatSender", () => {
    it("WorkflowCommentThread に formatSender 関数が渡される", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(typeof lastCall.formatSender).toBe("function");
    });

    it("formatSender は空文字に対してシステムを返す", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(lastCall.formatSender("")).toBe("システム");
    });

    it("formatSender は通常の名前をそのまま返す", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(lastCall.formatSender("山田 太郎")).toBe("山田 太郎");
    });
  });

  describe("currentStaff", () => {
    it("cognitoUser.id に対応するスタッフが currentStaff として渡される", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(lastCall.currentStaff?.id).toBe("staff-1");
    });

    it("cognitoUser が null の場合は currentStaff が undefined になる", () => {
      render(
        React.createElement(WorkflowCommentSection, {
          ...defaultProps,
          cognitoUser: null,
        }),
      );
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(lastCall.currentStaff).toBeUndefined();
    });
  });

  describe("toggleExpanded", () => {
    it("expandedMessages と onToggle が WorkflowCommentThread に渡される", () => {
      render(React.createElement(WorkflowCommentSection, defaultProps));
      const lastCall =
        mockWorkflowCommentThreadView.mock.calls[
          mockWorkflowCommentThreadView.mock.calls.length - 1
        ][0];
      expect(typeof lastCall.onToggle).toBe("function");
      expect(typeof lastCall.expandedMessages).toBe("object");
    });
  });
});
