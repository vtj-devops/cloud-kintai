import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import type { WorkflowEntity } from "@features/workflow/hooks/useWorkflowLoaderWorkflow";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import {
  createMockStaff,
  createMockUser,
  createMockWorkflow,
  createMockWorkflowComment,
} from "@shared/test-utils/mockFactories";
import { act, renderHook, waitFor } from "@testing-library/react";

import useWorkflowCommentThread from "../useWorkflowCommentThread";

// ── mock declarations ────────────────────────────────────────────────────────

const mockSubmitWorkflowComment = jest.fn();

jest.mock("../submitWorkflowComment", () => ({
  submitWorkflowComment: (...args: unknown[]) =>
    mockSubmitWorkflowComment(...args),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const STAFF_A = createMockStaff({
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "山田",
  givenName: "太郎",
  role: StaffRole.STAFF,
});

const STAFF_B = createMockStaff({
  id: "staff-2",
  cognitoUserId: "cognito-2",
  familyName: "鈴木",
  givenName: "花子",
  role: StaffRole.ADMIN,
});

const makeWorkflow = (overrides: Partial<WorkflowEntity> = {}): WorkflowEntity =>
  createMockWorkflow({
    id: "wf-1",
    staffId: "staff-1",
    status: WorkflowStatus.PENDING,
    category: WorkflowCategory.PAID_LEAVE,
    comments: [],
    approvalSteps: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  }) as WorkflowEntity;

const makeComment = (
  overrides: Partial<{ id: string; staffId: string; text: string; createdAt: string }> = {},
) =>
  createMockWorkflowComment({
    id: "comment-1",
    staffId: "staff-1",
    text: "テストコメント",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

const defaultParams = {
  workflow: makeWorkflow(),
  staffs: [STAFF_A, STAFF_B],
  cognitoUser: createMockUser({ id: "cognito-1", familyName: "山田", givenName: "太郎" }),
  onWorkflowChange: jest.fn(),
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
};

// ── tests ────────────────────────────────────────────────────────────────────

describe("useWorkflowCommentThread", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("初期状態", () => {
    it("messages が空配列で初期化される", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.messages).toEqual([]);
    });

    it("input が空文字で初期化される", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.input).toBe("");
    });

    it("sending が false で初期化される", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.sending).toBe(false);
    });

    it("expandedMessages が空オブジェクトで初期化される", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.expandedMessages).toEqual({});
    });
  });

  describe("currentStaff", () => {
    it("cognitoUser.id に対応するスタッフを返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.currentStaff?.id).toBe("staff-1");
    });

    it("cognitoUser が null の場合は undefined を返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, cognitoUser: null }),
      );
      expect(result.current.currentStaff).toBeUndefined();
    });

    it("対応するスタッフが見つからない場合は undefined を返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({
          ...defaultParams,
          cognitoUser: createMockUser({ id: "unknown-cognito" }),
        }),
      );
      expect(result.current.currentStaff).toBeUndefined();
    });
  });

  describe("workflow コメントの同期", () => {
    it("workflow.comments が変化すると messages が更新される", () => {
      const comment = makeComment();
      const workflow = makeWorkflow({ comments: [comment] });
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow }),
      );
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].text).toBe("テストコメント");
    });

    it("スタッフ名が messages に反映される", () => {
      const comment = makeComment({ staffId: "staff-1" });
      const workflow = makeWorkflow({ comments: [comment] });
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow }),
      );
      expect(result.current.messages[0].sender).toBe("山田 太郎");
    });

    it("staffId に対応するスタッフがいない場合は staffId を送信者として使う", () => {
      const comment = makeComment({ staffId: "unknown-staff" });
      const workflow = makeWorkflow({ comments: [comment] });
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow }),
      );
      // formatWorkflowCommentSender: staffId が system でなければそのまま返る
      expect(result.current.messages[0].sender).toBe("unknown-staff");
    });

    it("null コメントはフィルタされる", () => {
      const workflow = makeWorkflow({ comments: [null, makeComment()] });
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow }),
      );
      expect(result.current.messages).toHaveLength(1);
    });

    it("workflow が null の場合は messages が空になる", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow: null }),
      );
      expect(result.current.messages).toEqual([]);
    });
  });

  describe("expandedMessages と toggleExpanded", () => {
    it("toggleExpanded でメッセージの展開状態をトグルできる", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.toggleExpanded("msg-1");
      });
      expect(result.current.expandedMessages["msg-1"]).toBe(true);

      act(() => {
        result.current.toggleExpanded("msg-1");
      });
      expect(result.current.expandedMessages["msg-1"]).toBe(false);
    });

    it("workflow.id が変わると expandedMessages がリセットされる", () => {
      const { result, rerender } = renderHook(
        ({ wf }) => useWorkflowCommentThread({ ...defaultParams, workflow: wf }),
        { initialProps: { wf: makeWorkflow({ id: "wf-1" }) } },
      );

      act(() => {
        result.current.toggleExpanded("msg-1");
      });
      expect(result.current.expandedMessages["msg-1"]).toBe(true);

      rerender({ wf: makeWorkflow({ id: "wf-2" }) });
      expect(result.current.expandedMessages).toEqual({});
    });
  });

  describe("setInput", () => {
    it("input 値を更新できる", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.setInput("新しいコメント");
      });
      expect(result.current.input).toBe("新しいコメント");
    });
  });

  describe("formatSender", () => {
    it("空文字の場合は「システム」を返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.formatSender("")).toBe("システム");
      expect(result.current.formatSender(undefined)).toBe("システム");
    });

    it("'system' の場合は「システム」を返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.formatSender("system")).toBe("システム");
      expect(result.current.formatSender("System Bot")).toBe("システム");
    });

    it("通常の名前はそのまま返す", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );
      expect(result.current.formatSender("山田 太郎")).toBe("山田 太郎");
    });
  });

  describe("sendMessage", () => {
    it("正常系: コメントを送信して onWorkflowChange と notifySuccess を呼ぶ", async () => {
      const updatedWorkflow = makeWorkflow({
        comments: [makeComment({ text: "送信テスト" })],
      });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      const onWorkflowChange = jest.fn();
      const notifySuccess = jest.fn();

      const { result } = renderHook(() =>
        useWorkflowCommentThread({
          ...defaultParams,
          onWorkflowChange,
          notifySuccess,
        }),
      );

      act(() => {
        result.current.setInput("送信テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      await waitFor(() => expect(notifySuccess).toHaveBeenCalled());

      expect(onWorkflowChange).toHaveBeenCalledWith(updatedWorkflow);
      expect(notifySuccess).toHaveBeenCalledWith("コメントを送信しました");
    });

    it("送信後は input が空になる", async () => {
      const updatedWorkflow = makeWorkflow({ comments: [] });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.setInput("テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      await waitFor(() =>
        expect(mockSubmitWorkflowComment).toHaveBeenCalled(),
      );

      expect(result.current.input).toBe("");
    });

    it("送信中はオプティミスティックメッセージが表示される", async () => {
      let resolveSubmit!: (v: unknown) => void;
      const submitPromise = new Promise((r) => {
        resolveSubmit = r;
      });
      mockSubmitWorkflowComment.mockReturnValue(submitPromise);

      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.setInput("楽観的メッセージ");
      });

      act(() => {
        result.current.sendMessage();
      });

      // オプティミスティックメッセージが追加されている
      expect(result.current.messages.some((m) => m.text === "楽観的メッセージ")).toBe(true);

      await act(async () => {
        resolveSubmit(makeWorkflow({ comments: [] }));
      });
    });

    it("送信中に再度 sendMessage を呼んでも無視される", async () => {
      let resolveSubmit!: (v: unknown) => void;
      const submitPromise = new Promise((r) => {
        resolveSubmit = r;
      });
      mockSubmitWorkflowComment.mockReturnValue(submitPromise);

      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.setInput("テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      act(() => {
        result.current.sendMessage(); // 二重送信
      });

      await act(async () => {
        resolveSubmit(makeWorkflow({ comments: [] }));
      });

      expect(mockSubmitWorkflowComment).toHaveBeenCalledTimes(1);
    });

    it("input が空の場合は送信しない", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.sendMessage();
      });

      expect(mockSubmitWorkflowComment).not.toHaveBeenCalled();
    });

    it("workflow が null の場合は送信しない", () => {
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow: null }),
      );

      act(() => {
        result.current.setInput("テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      expect(mockSubmitWorkflowComment).not.toHaveBeenCalled();
    });

    it("エラー発生時は notifyError を呼びオプティミスティックメッセージを削除する", async () => {
      mockSubmitWorkflowComment.mockRejectedValue(
        new Error("送信に失敗しました"),
      );

      const notifyError = jest.fn();

      // 既存のコメントがある状態でテスト
      const comment = makeComment({ id: "existing" });
      const workflow = makeWorkflow({ comments: [comment] });
      const { result: resultWithComments } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, workflow, notifyError }),
      );

      act(() => {
        resultWithComments.current.setInput("失敗するコメント");
      });

      act(() => {
        resultWithComments.current.sendMessage();
      });

      await waitFor(() => expect(notifyError).toHaveBeenCalled());

      expect(notifyError).toHaveBeenCalledWith("送信に失敗しました");
      // オプティミスティックメッセージが削除されて元の状態に戻る
      expect(
        resultWithComments.current.messages.every(
          (m) => m.text !== "失敗するコメント",
        ),
      ).toBe(true);
    });

    it("Error インスタンス以外のエラーも文字列として notifyError に渡す", async () => {
      mockSubmitWorkflowComment.mockRejectedValue("文字列エラー");

      const notifyError = jest.fn();
      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams, notifyError }),
      );

      act(() => {
        result.current.setInput("テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      await waitFor(() => expect(notifyError).toHaveBeenCalled());
      expect(notifyError).toHaveBeenCalledWith("文字列エラー");
    });

    it("cognitoUser がない場合は「不明なユーザー」として送信する", async () => {
      const updatedWorkflow = makeWorkflow({ comments: [] });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      const { result } = renderHook(() =>
        useWorkflowCommentThread({
          ...defaultParams,
          cognitoUser: undefined,
        }),
      );

      act(() => {
        result.current.setInput("テスト");
      });

      act(() => {
        result.current.sendMessage();
      });

      await waitFor(() =>
        expect(mockSubmitWorkflowComment).toHaveBeenCalled(),
      );

      expect(mockSubmitWorkflowComment).toHaveBeenCalledWith(
        expect.objectContaining({
          actorDisplayName: "不明なユーザー",
        }),
      );
    });

    it("currentStaff がある場合は staffId を actorStaffId として送信する", async () => {
      const updatedWorkflow = makeWorkflow({ comments: [] });
      mockSubmitWorkflowComment.mockResolvedValue(updatedWorkflow);

      const { result } = renderHook(() =>
        useWorkflowCommentThread({ ...defaultParams }),
      );

      act(() => {
        result.current.setInput("スタッフコメント");
      });

      act(() => {
        result.current.sendMessage();
      });

      await waitFor(() =>
        expect(mockSubmitWorkflowComment).toHaveBeenCalled(),
      );

      expect(mockSubmitWorkflowComment).toHaveBeenCalledWith(
        expect.objectContaining({
          actorStaffId: "staff-1",
        }),
      );
    });
  });
});
