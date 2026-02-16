import { act, renderHook } from "@testing-library/react";

import { CellComment, Mention } from "../../types/collaborative.types";
import { useShiftComments } from "../useShiftComments";

describe("useShiftComments", () => {
  describe("addComment", () => {
    it("コメントを追加できること", () => {
      const { result } = renderHook(() => useShiftComments());

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "これはテストコメントです",
          [],
        );

        expect(comment).toBeDefined();
        expect(comment.cellKey).toBe("staff1#01");
        expect(comment.content).toBe("これはテストコメントです");
        expect(comment.userId).toBe("user1");
        expect(comment.userName).toBe("太郎");
        expect(comment.isEdited).toBe(false);
      });
    });

    it("複数のコメントを追加できること", () => {
      const { result } = renderHook(() => useShiftComments());

      act(() => {
        result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "最初のコメント",
          [],
        );
        result.current.addComment(
          "staff1#01",
          "user2",
          "花子",
          "#ff6b6b",
          "次のコメント",
          [],
        );
      });

      const comments = result.current.getCommentsByCell("staff1#01");
      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe("最初のコメント");
      expect(comments[1].content).toBe("次のコメント");
    });

    it("メンション情報をコメントに含められること", () => {
      const { result } = renderHook(() => useShiftComments());

      const mentions: Mention[] = [
        { userId: "user2", userName: "花子", position: 5 },
      ];

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "@花子 こんにちは",
          mentions,
        );

        expect(comment.mentions).toHaveLength(1);
        expect(comment.mentions[0].userName).toBe("花子");
      });
    });
  });

  describe("updateComment", () => {
    it("コメントを更新できること", () => {
      const { result } = renderHook(() => useShiftComments());

      let commentId: string;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "元のコメント",
          [],
        );
        commentId = comment.id;
      });

      act(() => {
        const updated = result.current.updateComment(
          commentId,
          "更新されたコメント",
          [],
        );
        expect(updated).not.toBeNull();
        expect(updated?.content).toBe("更新されたコメント");
        expect(updated?.isEdited).toBe(true);
      });
    });

    it("存在しないコメントはnullを返すこと", () => {
      const { result } = renderHook(() => useShiftComments());

      act(() => {
        const updated = result.current.updateComment(
          "non-existent",
          "新しいコンテンツ",
          [],
        );
        expect(updated).toBeNull();
      });
    });
  });

  describe("deleteComment", () => {
    it("コメントを削除できること", () => {
      const { result } = renderHook(() => useShiftComments());

      let commentId: string;
      let deleted = false;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "削除するコメント",
          [],
        );
        commentId = comment.id;
      });

      act(() => {
        deleted = result.current.deleteComment(commentId);
      });

      expect(deleted).toBe(true);

      const comments = result.current.getCommentsByCell("staff1#01");
      expect(comments).toHaveLength(0);
    });

    it("存在しないコメント削除はfalseを返すこと", () => {
      const { result } = renderHook(() => useShiftComments());

      let deleted = false;
      act(() => {
        deleted = result.current.deleteComment("non-existent");
      });

      expect(deleted).toBe(false);
    });
  });

  describe("getCommentsByCell", () => {
    it("セルのコメント一覧を取得できること", () => {
      const { result } = renderHook(() => useShiftComments());

      act(() => {
        result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "コメント1",
          [],
        );
        result.current.addComment(
          "staff1#02",
          "user1",
          "太郎",
          "#1976d2",
          "コメント2",
          [],
        );
      });

      const comments1 = result.current.getCommentsByCell("staff1#01");
      const comments2 = result.current.getCommentsByCell("staff1#02");

      expect(comments1).toHaveLength(1);
      expect(comments1[0].content).toBe("コメント1");

      expect(comments2).toHaveLength(1);
      expect(comments2[0].content).toBe("コメント2");
    });

    it("存在しないセルは空配列を返すこと", () => {
      const { result } = renderHook(() => useShiftComments());

      const comments = result.current.getCommentsByCell("non-existent");
      expect(comments).toHaveLength(0);
    });
  });

  describe("replyToComment", () => {
    it("コメントに返信できること", () => {
      const { result } = renderHook(() => useShiftComments());

      let parentCommentId: string;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "親コメント",
          [],
        );
        parentCommentId = comment.id;
      });

      act(() => {
        const reply = result.current.replyToComment(
          parentCommentId,
          "user2",
          "花子",
          "#ff6b6b",
          "返信です",
          [],
        );

        expect(reply).not.toBeNull();
        expect(reply?.content).toBe("返信です");
        expect(reply?.userName).toBe("花子");
      });

      const comments = result.current.getCommentsByCell("staff1#01");
      expect(comments[0].replies).toHaveLength(1);
      expect(comments[0].replies![0].content).toBe("返信です");
    });

    it("複数の返信ができること", () => {
      const { result } = renderHook(() => useShiftComments());

      let parentCommentId: string;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "親コメント",
          [],
        );
        parentCommentId = comment.id;
      });

      act(() => {
        result.current.replyToComment(
          parentCommentId,
          "user2",
          "花子",
          "#ff6b6b",
          "返信1",
          [],
        );
        result.current.replyToComment(
          parentCommentId,
          "user3",
          "次郎",
          "#4ecdc4",
          "返信2",
          [],
        );
      });

      const comments = result.current.getCommentsByCell("staff1#01");
      expect(comments[0].replies).toHaveLength(2);
    });

    it("存在しない親コメントはnullを返すこと", () => {
      const { result } = renderHook(() => useShiftComments());

      let reply: CellComment | null = null;
      act(() => {
        reply = result.current.replyToComment(
          "non-existent",
          "user1",
          "太郎",
          "#1976d2",
          "返信",
          [],
        );
      });

      expect(reply).toBeNull();
    });
  });

  describe("deleteCommentReply", () => {
    it("返信を削除できること", () => {
      const { result } = renderHook(() => useShiftComments());

      let parentCommentId: string;
      let replyId: string;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "親コメント",
          [],
        );
        parentCommentId = comment.id;

        const reply = result.current.replyToComment(
          parentCommentId,
          "user2",
          "花子",
          "#ff6b6b",
          "返信",
          [],
        );
        replyId = reply!.id;
      });

      let deleted = false;
      act(() => {
        deleted = result.current.deleteCommentReply(parentCommentId, replyId);
      });

      expect(deleted).toBe(true);

      const comments = result.current.getCommentsByCell("staff1#01");
      expect(comments[0].replies).toHaveLength(0);
    });
  });

  describe("getCommentCount", () => {
    it("コメント数を正しく計算できること（返信を含む）", () => {
      const { result } = renderHook(() => useShiftComments());

      let parentCommentId: string;

      act(() => {
        const comment = result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "親コメント",
          [],
        );
        parentCommentId = comment.id;

        result.current.replyToComment(
          parentCommentId,
          "user2",
          "花子",
          "#ff6b6b",
          "返信1",
          [],
        );
        result.current.replyToComment(
          parentCommentId,
          "user3",
          "次郎",
          "#4ecdc4",
          "返信2",
          [],
        );
      });

      const count = result.current.getCommentCount("staff1#01");
      expect(count).toBe(3); // 親1 + 返信2
    });
  });

  describe("parseMentions", () => {
    it("メンションを正しく解析できること", () => {
      const { result } = renderHook(() => useShiftComments());

      const availableUsers = [
        { userId: "user1", userName: "太郎" },
        { userId: "user2", userName: "花子" },
      ];

      let mentions: Mention[] = [];
      act(() => {
        mentions = result.current.parseMentions(
          "@太郎 と @花子 に知らせます",
          availableUsers,
        );
      });

      expect(mentions).toHaveLength(2);
      expect(mentions[0].userName).toBe("太郎");
      expect(mentions[1].userName).toBe("花子");
    });

    it("存在しないユーザーのメンションは除外されること", () => {
      const { result } = renderHook(() => useShiftComments());

      const availableUsers = [{ userId: "user1", userName: "太郎" }];

      let mentions: Mention[] = [];
      act(() => {
        mentions = result.current.parseMentions(
          "@太郎 と @花子 に知らせます",
          availableUsers,
        );
      });

      expect(mentions).toHaveLength(1);
      expect(mentions[0].userName).toBe("太郎");
    });
  });

  describe("getAllComments", () => {
    it("全コメントを取得できること", () => {
      const { result } = renderHook(() => useShiftComments());

      act(() => {
        result.current.addComment(
          "staff1#01",
          "user1",
          "太郎",
          "#1976d2",
          "コメント1",
          [],
        );
        result.current.addComment(
          "staff2#02",
          "user2",
          "花子",
          "#ff6b6b",
          "コメント2",
          [],
        );
      });

      const allComments = result.current.getAllComments();
      expect(allComments.size).toBe(2);
      expect(allComments.get("staff1#01")).toHaveLength(1);
      expect(allComments.get("staff2#02")).toHaveLength(1);
    });
  });
});
