import { useCallback, useRef } from "react";

import {
  CellComment,
  CommentsMap,
  Mention,
} from "../types/collaborative.types";

/**
 * シフトコメント管理フック
 * セルごとのコメント追加、更新、削除を管理
 */
export const useShiftComments = () => {
  const commentsMapRef = useRef<CommentsMap>(new Map());
  const commentIdCounterRef = useRef(0);

  /**
   * ユーザー情報からコメント作成
   */
  const createCommentObject = useCallback(
    (
      cellKey: string,
      userId: string,
      userName: string,
      userColor: string,
      content: string,
      mentions: Mention[],
    ): CellComment => {
      const now = new Date().toISOString();
      return {
        id: `comment_${commentIdCounterRef.current++}`,
        cellKey,
        userId,
        userName,
        userColor,
        content,
        mentions,
        createdAt: now,
        updatedAt: now,
        isEdited: false,
        replies: [],
      };
    },
    [],
  );

  /**
   * コメントを追加
   */
  const addComment = useCallback(
    (
      cellKey: string,
      userId: string,
      userName: string,
      userColor: string,
      content: string,
      mentions: Mention[] = [],
    ): CellComment => {
      const comment = createCommentObject(
        cellKey,
        userId,
        userName,
        userColor,
        content,
        mentions,
      );

      const existingComments = commentsMapRef.current.get(cellKey) || [];
      commentsMapRef.current.set(cellKey, [...existingComments, comment]);

      return comment;
    },
    [createCommentObject],
  );

  /**
   * コメントを更新
   */
  const updateComment = useCallback(
    (
      commentId: string,
      content: string,
      mentions: Mention[] = [],
    ): CellComment | null => {
      for (const [, comments] of commentsMapRef.current) {
        const commentIndex = comments.findIndex((c) => c.id === commentId);
        if (commentIndex !== -1) {
          const updatedComment: CellComment = {
            ...comments[commentIndex],
            content,
            mentions,
            updatedAt: new Date().toISOString(),
            isEdited: true,
          };
          const newComments = [...comments];
          newComments[commentIndex] = updatedComment;
          commentsMapRef.current.set(
            comments[commentIndex].cellKey,
            newComments,
          );
          return updatedComment;
        }
      }
      return null;
    },
    [],
  );

  /**
   * コメントを削除
   */
  const deleteComment = useCallback((commentId: string): boolean => {
    for (const [cellKey, comments] of commentsMapRef.current) {
      const filteredComments = comments.filter((c) => c.id !== commentId);
      if (filteredComments.length !== comments.length) {
        if (filteredComments.length === 0) {
          commentsMapRef.current.delete(cellKey);
        } else {
          commentsMapRef.current.set(cellKey, filteredComments);
        }
        return true;
      }
    }
    return false;
  }, []);

  /**
   * セルのコメント一覧を取得
   */
  const getCommentsByCell = useCallback((cellKey: string): CellComment[] => {
    return commentsMapRef.current.get(cellKey) || [];
  }, []);

  /**
   * コメントに返信を追加
   */
  const replyToComment = useCallback(
    (
      parentCommentId: string,
      userId: string,
      userName: string,
      userColor: string,
      content: string,
      mentions: Mention[] = [],
    ): CellComment | null => {
      for (const [, comments] of commentsMapRef.current) {
        const parentComment = comments.find((c) => c.id === parentCommentId);
        if (parentComment) {
          const reply = createCommentObject(
            parentComment.cellKey,
            userId,
            userName,
            userColor,
            content,
            mentions,
          );

          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(reply);
          parentComment.updatedAt = new Date().toISOString();

          return reply;
        }
      }
      return null;
    },
    [createCommentObject],
  );

  /**
   * コメントの返信を削除
   */
  const deleteCommentReply = useCallback(
    (parentCommentId: string, replyCommentId: string): boolean => {
      for (const [, comments] of commentsMapRef.current) {
        const parentComment = comments.find((c) => c.id === parentCommentId);
        if (parentComment && parentComment.replies) {
          const initialLength = parentComment.replies.length;
          parentComment.replies = parentComment.replies.filter(
            (r) => r.id !== replyCommentId,
          );
          if (parentComment.replies.length !== initialLength) {
            parentComment.updatedAt = new Date().toISOString();
            return true;
          }
        }
      }
      return false;
    },
    [],
  );

  /**
   * 全コメント取得
   */
  const getAllComments = useCallback((): CommentsMap => {
    return new Map(commentsMapRef.current);
  }, []);

  /**
   * コメント数を取得（返信を含む）
   */
  const getCommentCount = useCallback((cellKey: string): number => {
    const comments = commentsMapRef.current.get(cellKey) || [];
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies?.length || 0);
    }, 0);
  }, []);

  /**
   * メンションを解析
   * @ユーザー名 形式を抽出
   */
  const parseMentions = useCallback(
    (
      content: string,
      availableUsers: { userId: string; userName: string }[],
    ): Mention[] => {
      const mentions: Mention[] = [];
      // @の後に続く単語またはユーザー名を抽出（スペースまたは終端まで）
      const mentionRegex = /@([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)/g;
      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedName = match[1];
        const user = availableUsers.find((u) => u.userName === mentionedName);

        if (user) {
          mentions.push({
            userId: user.userId,
            userName: user.userName,
            position: match.index,
          });
        }
      }

      return mentions;
    },
    [],
  );

  /**
   * メンション付きコンテンツをHTMLに変換
   */
  const formatCommentWithMentions = useCallback(
    (comment: CellComment): string => {
      let result = comment.content;

      // メンションを@userNameからリンク形式に変換
      comment.mentions.forEach((mention) => {
        result = result.replace(
          `@${mention.userName}`,
          `<span class="mention" data-user-id="${mention.userId}">@${mention.userName}</span>`,
        );
      });

      return result;
    },
    [],
  );

  return {
    addComment,
    updateComment,
    deleteComment,
    getCommentsByCell,
    replyToComment,
    deleteCommentReply,
    getAllComments,
    getCommentCount,
    parseMentions,
    formatCommentWithMentions,
  };
};

export type UseShiftComments = ReturnType<typeof useShiftComments>;
