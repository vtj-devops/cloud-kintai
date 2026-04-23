import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import type { CellComment } from "../../types/collaborative.types";
import { CellCommentDialog } from "../CellCommentDialog";

// ----------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------
jest.mock("../../hooks/useShiftComments", () => ({
  useShiftComments: () => ({
    parseMentions: jest.fn().mockReturnValue([]),
  }),
}));

jest.mock("@shared/ui/button", () => ({
  AppIconButton: ({
    children,
    "aria-label": ariaLabel,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    "aria-label": string;
    tone?: string;
    size?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} {...rest}>
      {children}
    </button>
  ),
}));

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------
const makeComment = (overrides: Partial<CellComment> = {}): CellComment => ({
  id: "comment-1",
  cellKey: "staff-1#01",
  userId: "user-1",
  userName: "山田太郎",
  userColor: "#1976d2",
  content: "テストコメント",
  mentions: [],
  createdAt: "2024-01-15T09:00:00.000Z",
  updatedAt: "2024-01-15T09:00:00.000Z",
  isEdited: false,
  replies: [],
  ...overrides,
});

const defaultProps = {
  open: true,
  cellKey: "staff-1#01",
  staffName: "山田太郎",
  date: "15",
  comments: [] as CellComment[],
  availableUsers: [
    { userId: "user-1", userName: "山田太郎" },
    { userId: "user-2", userName: "田中花子" },
  ],
  currentUserId: "user-1",
  onClose: jest.fn(),
  onAddComment: jest.fn(),
  onUpdateComment: jest.fn(),
  onDeleteComment: jest.fn(),
  onReplyComment: jest.fn(),
  onDeleteReply: jest.fn(),
};

const renderDialog = (props: Partial<typeof defaultProps> = {}) =>
  render(<CellCommentDialog {...defaultProps} {...props} />);

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------
describe("CellCommentDialog", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── Dialog の開閉 ──────────────────────────────────────────────
  describe("ダイアログの表示", () => {
    it("open=true のときダイアログが表示される", () => {
      renderDialog();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("open=false のときダイアログが表示されない", () => {
      renderDialog({ open: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("タイトルにスタッフ名と日付が表示される", () => {
      renderDialog();
      expect(screen.getByText("山田太郎 - 15日のコメント")).toBeInTheDocument();
    });
  });

  // ── コメントなし ───────────────────────────────────────────────
  describe("コメントが空の場合", () => {
    it("「コメントはまだありません」と表示される", () => {
      renderDialog({ comments: [] });
      expect(
        screen.getByText("コメントはまだありません"),
      ).toBeInTheDocument();
    });
  });

  // ── コメント一覧 ───────────────────────────────────────────────
  describe("コメント一覧の表示", () => {
    it("コメントのユーザー名・内容が表示される", () => {
      renderDialog({ comments: [makeComment()] });
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(screen.getByText("テストコメント")).toBeInTheDocument();
    });

    it("アバターにユーザー名の頭文字が表示される", () => {
      renderDialog({ comments: [makeComment()] });
      expect(screen.getByText("山")).toBeInTheDocument();
    });

    it("isEdited=true のとき「(編集済み)」が表示される", () => {
      renderDialog({ comments: [makeComment({ isEdited: true })] });
      expect(screen.getByText("(編集済み)")).toBeInTheDocument();
    });

    it("isEdited=false のとき「(編集済み)」が表示されない", () => {
      renderDialog({ comments: [makeComment({ isEdited: false })] });
      expect(screen.queryByText("(編集済み)")).not.toBeInTheDocument();
    });

    it("複数コメントがすべて表示される", () => {
      const comments = [
        makeComment({ id: "c1", content: "最初のコメント" }),
        makeComment({ id: "c2", content: "二番目のコメント" }),
      ];
      renderDialog({ comments });
      expect(screen.getByText("最初のコメント")).toBeInTheDocument();
      expect(screen.getByText("二番目のコメント")).toBeInTheDocument();
    });
  });

  // ── 編集/削除ボタンの権限 ─────────────────────────────────────
  describe("編集・削除ボタンの権限制御", () => {
    it("自分のコメントには編集・削除ボタンが表示される", () => {
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
      });
      expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
    });

    it("他人のコメントには編集・削除ボタンが表示されない", () => {
      renderDialog({
        comments: [makeComment({ userId: "user-2" })],
        currentUserId: "user-1",
      });
      expect(
        screen.queryByRole("button", { name: "編集" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
    });
  });

  // ── 削除 ──────────────────────────────────────────────────────
  describe("コメント削除", () => {
    it("削除ボタンをクリックすると onDeleteComment が呼ばれる", async () => {
      const onDeleteComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ id: "comment-1", userId: "user-1" })],
        currentUserId: "user-1",
        onDeleteComment,
      });

      await user.click(screen.getByRole("button", { name: "削除" }));
      expect(onDeleteComment).toHaveBeenCalledWith("comment-1");
    });
  });

  // ── 編集フォーム ───────────────────────────────────────────────
  describe("コメント編集", () => {
    it("編集ボタンをクリックすると編集フォームが表示される", async () => {
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
      });

      await user.click(screen.getByRole("button", { name: "編集" }));
      expect(screen.getByDisplayValue("テストコメント")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
      // Multiple キャンセル buttons exist (edit form + dialog actions)
      const cancelButtons = screen.getAllByRole("button", { name: "キャンセル" });
      expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("編集中は編集・削除ボタンが非表示になる", async () => {
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
      });

      await user.click(screen.getByRole("button", { name: "編集" }));
      expect(
        screen.queryByRole("button", { name: "編集" }),
      ).not.toBeInTheDocument();
    });

    it("テキスト変更後に保存ボタンをクリックすると onUpdateComment が呼ばれる", async () => {
      const onUpdateComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ id: "comment-1", userId: "user-1" })],
        currentUserId: "user-1",
        onUpdateComment,
      });

      await user.click(screen.getByRole("button", { name: "編集" }));

      const textarea = screen.getByDisplayValue("テストコメント");
      await user.clear(textarea);
      await user.type(textarea, "更新されたコメント");

      await user.click(screen.getByRole("button", { name: "保存" }));
      expect(onUpdateComment).toHaveBeenCalledWith(
        "comment-1",
        "更新されたコメント",
        expect.any(Array),
      );
    });

    it("空のテキストで保存しても onUpdateComment は呼ばれない", async () => {
      const onUpdateComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
        onUpdateComment,
      });

      await user.click(screen.getByRole("button", { name: "編集" }));
      const textarea = screen.getByDisplayValue("テストコメント");
      await user.clear(textarea);
      await user.click(screen.getByRole("button", { name: "保存" }));

      expect(onUpdateComment).not.toHaveBeenCalled();
    });

    it("キャンセルボタンをクリックすると編集フォームが閉じる", async () => {
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
      });

      await user.click(screen.getByRole("button", { name: "編集" }));
      // First キャンセル is the edit form's cancel; second is DialogActions cancel
      const cancelButtons = screen.getAllByRole("button", { name: "キャンセル" });
      await user.click(cancelButtons[0]);

      expect(
        screen.queryByRole("button", { name: "保存" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("テストコメント")).toBeInTheDocument();
    });

    it("保存後は編集フォームが閉じてコメント内容が表示される", async () => {
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ userId: "user-1" })],
        currentUserId: "user-1",
        onUpdateComment: jest.fn(),
      });

      await user.click(screen.getByRole("button", { name: "編集" }));
      await user.click(screen.getByRole("button", { name: "保存" }));

      expect(
        screen.queryByRole("button", { name: "保存" }),
      ).not.toBeInTheDocument();
    });
  });

  // ── 返信 ──────────────────────────────────────────────────────
  describe("返信機能", () => {
    it("各コメントに「返信」ボタンが表示される", () => {
      renderDialog({ comments: [makeComment()] });
      expect(screen.getByRole("button", { name: /返信/ })).toBeInTheDocument();
    });

    it("返信ボタンをクリックすると返信フォームが表示される", async () => {
      const user = userEvent.setup();
      renderDialog({ comments: [makeComment()] });

      await user.click(screen.getByRole("button", { name: /返信/ }));

      expect(
        screen.getByPlaceholderText("返信を入力..."),
      ).toBeInTheDocument();
    });

    it("返信フォームが表示されているとき「返信」ボタン（開くためのもの）が非表示になる", async () => {
      const user = userEvent.setup();
      renderDialog({ comments: [makeComment()] });

      // Click the icon-based "返信" link button (has ReplyIcon + "返信" text)
      await user.click(screen.getByRole("button", { name: /返信/ }));

      // Reply input form should be visible
      expect(screen.getByPlaceholderText("返信を入力...")).toBeInTheDocument();
      // The link "返信" button (startIcon variant) should be gone;
      // only the form submit "返信" (contained) button remains
      const replyButtons = screen.getAllByRole("button", { name: "返信" });
      // Only the submit button in the form should remain (contained button)
      expect(replyButtons).toHaveLength(1);
    });

    it("返信内容を入力して「返信」を押すと onReplyComment が呼ばれる", async () => {
      const onReplyComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ id: "comment-1" })],
        onReplyComment,
      });

      await user.click(screen.getByRole("button", { name: /返信/ }));
      await user.type(screen.getByPlaceholderText("返信を入力..."), "返信内容");

      // Click the 返信 button inside the form (contained button variant)
      const saveReplyBtn = screen.getByRole("button", { name: "返信" });
      await user.click(saveReplyBtn);

      expect(onReplyComment).toHaveBeenCalledWith(
        "comment-1",
        "返信内容",
        expect.any(Array),
      );
    });

    it("空の返信で送信しても onReplyComment は呼ばれない", async () => {
      const onReplyComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ id: "comment-1" })],
        onReplyComment,
      });

      await user.click(screen.getByRole("button", { name: /返信/ }));
      await user.click(screen.getByRole("button", { name: "返信" }));

      expect(onReplyComment).not.toHaveBeenCalled();
    });

    it("返信キャンセルで返信フォームが閉じる", async () => {
      const user = userEvent.setup();
      renderDialog({ comments: [makeComment()] });

      await user.click(screen.getByRole("button", { name: /返信/ }));
      // First キャンセル is the reply form's cancel; second is DialogActions cancel
      const cancelButtons = screen.getAllByRole("button", { name: "キャンセル" });
      await user.click(cancelButtons[0]);

      expect(
        screen.queryByPlaceholderText("返信を入力..."),
      ).not.toBeInTheDocument();
    });

    it("返信後は返信フォームが閉じる", async () => {
      const user = userEvent.setup();
      renderDialog({
        comments: [makeComment({ id: "comment-1" })],
        onReplyComment: jest.fn(),
      });

      await user.click(screen.getByRole("button", { name: /返信/ }));
      await user.type(screen.getByPlaceholderText("返信を入力..."), "返信内容");
      await user.click(screen.getByRole("button", { name: "返信" }));

      expect(
        screen.queryByPlaceholderText("返信を入力..."),
      ).not.toBeInTheDocument();
    });
  });

  // ── 返信コメントの表示 ─────────────────────────────────────────
  describe("返信コメントの表示", () => {
    it("返信コメントが表示される", () => {
      const reply: CellComment = makeComment({
        id: "reply-1",
        content: "これは返信です",
        userName: "田中花子",
        userId: "user-2",
      });
      const comment = makeComment({ replies: [reply] });
      renderDialog({ comments: [comment] });

      expect(screen.getByText("これは返信です")).toBeInTheDocument();
    });

    it("自分の返信には削除ボタンが表示される", () => {
      const reply: CellComment = makeComment({
        id: "reply-1",
        content: "自分の返信",
        userId: "user-1",
      });
      const comment = makeComment({
        id: "comment-1",
        userId: "user-2",
        replies: [reply],
      });
      renderDialog({
        comments: [comment],
        currentUserId: "user-1",
      });

      // 返信の削除ボタンが存在する（aria-label="削除"）
      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("他人の返信には削除ボタンが表示されない", () => {
      const reply: CellComment = makeComment({
        id: "reply-1",
        content: "他人の返信",
        userId: "user-2",
      });
      const comment = makeComment({
        id: "comment-1",
        userId: "user-2",
        replies: [reply],
      });
      renderDialog({
        comments: [comment],
        currentUserId: "user-1",
      });

      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
    });

    it("返信の削除ボタンをクリックすると onDeleteReply が呼ばれる", async () => {
      const onDeleteReply = jest.fn();
      const user = userEvent.setup();
      const reply: CellComment = makeComment({
        id: "reply-1",
        userId: "user-1",
      });
      const comment = makeComment({
        id: "comment-1",
        userId: "user-1",
        replies: [reply],
      });
      renderDialog({
        comments: [comment],
        currentUserId: "user-1",
        onDeleteReply,
      });

      // There are 2 delete buttons: one for parent comment, one for reply
      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      // The reply delete button is the second one
      await user.click(deleteButtons[1]);

      expect(onDeleteReply).toHaveBeenCalledWith("comment-1", "reply-1");
    });
  });

  // ── 新規コメント入力 ───────────────────────────────────────────
  describe("新規コメント入力", () => {
    it("コメント追加テキストエリアが表示される", () => {
      renderDialog();
      expect(
        screen.getByPlaceholderText(
          "コメントを入力... (@ユーザー名 でメンション可)",
        ),
      ).toBeInTheDocument();
    });

    it("内容が空のときは「コメント追加」ボタンが無効化される", () => {
      renderDialog();
      expect(
        screen.getByRole("button", { name: "コメント追加" }),
      ).toBeDisabled();
    });

    it("内容を入力すると「コメント追加」ボタンが有効化される", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.type(
        screen.getByPlaceholderText(
          "コメントを入力... (@ユーザー名 でメンション可)",
        ),
        "新しいコメント",
      );

      expect(
        screen.getByRole("button", { name: "コメント追加" }),
      ).not.toBeDisabled();
    });

    it("「コメント追加」ボタンをクリックすると onAddComment が呼ばれる", async () => {
      const onAddComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({ onAddComment });

      await user.type(
        screen.getByPlaceholderText(
          "コメントを入力... (@ユーザー名 でメンション可)",
        ),
        "新しいコメント",
      );
      await user.click(screen.getByRole("button", { name: "コメント追加" }));

      expect(onAddComment).toHaveBeenCalledWith(
        "staff-1#01",
        "新しいコメント",
        expect.any(Array),
      );
    });

    it("コメント追加後にテキストエリアがクリアされる", async () => {
      const user = userEvent.setup();
      renderDialog({ onAddComment: jest.fn() });

      const textarea = screen.getByPlaceholderText(
        "コメントを入力... (@ユーザー名 でメンション可)",
      );
      await user.type(textarea, "新しいコメント");
      await user.click(screen.getByRole("button", { name: "コメント追加" }));

      expect(textarea).toHaveValue("");
    });

    it("スペースのみの入力では onAddComment は呼ばれない", async () => {
      const onAddComment = jest.fn();
      const user = userEvent.setup();
      renderDialog({ onAddComment });

      await user.type(
        screen.getByPlaceholderText(
          "コメントを入力... (@ユーザー名 でメンション可)",
        ),
        "   ",
      );
      // button should remain disabled due to trim
      const addButton = screen.getByRole("button", { name: "コメント追加" });
      expect(addButton).toBeDisabled();
    });
  });

  // ── ダイアログを閉じる ─────────────────────────────────────────
  describe("ダイアログを閉じる", () => {
    it("キャンセルボタンをクリックすると onClose が呼ばれる", async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      renderDialog({ onClose });

      // DialogActions にある「キャンセル」ボタンをクリック
      // There may be multiple "キャンセル" buttons if editing is active
      const cancelButtons = screen.getAllByRole("button", { name: "キャンセル" });
      // The last one is in DialogActions
      await user.click(cancelButtons[cancelButtons.length - 1]);

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── メンション ──────────────────────────────────────────────────
  describe("メンションの解析", () => {
    it("availableUsers の名前がメンション候補として存在する", () => {
      renderDialog({
        availableUsers: [
          { userId: "user-1", userName: "山田太郎" },
          { userId: "user-2", userName: "田中花子" },
        ],
      });
      // Autocomplete が options を持っている（レンダリングされている）
      // メンションラベルが表示されている
      expect(screen.getByLabelText("メンション")).toBeInTheDocument();
    });
  });
});
