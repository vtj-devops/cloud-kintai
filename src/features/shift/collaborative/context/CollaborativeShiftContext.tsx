import { createContext, useContext } from "react";

import { HistoryEntry } from "../hooks/useUndoRedo";
import {
  CellComment,
  CollaborativeShiftState,
  CollaborativeUser,
  Mention,
  ShiftCellUpdate,
} from "../types/collaborative.types";

/**
 * 共同編集シフトコンテキストの型
 */
export interface CollaborativeShiftContextType {
  state: CollaborativeShiftState;
  updateShift: (update: ShiftCellUpdate) => Promise<void>;
  batchUpdateShifts: (updates: ShiftCellUpdate[]) => Promise<void>;
  isBatchUpdating: boolean;
  toggleCellSelection: (cellKey: string, selected: boolean) => void;
  startEditingCell: (staffId: string, date: string) => void;
  stopEditingCell: (staffId: string, date: string) => void;
  isCellBeingEdited: (staffId: string, date: string) => boolean;
  getCellEditor: (
    staffId: string,
    date: string,
  ) => CollaborativeUser | undefined;
  forceReleaseCell: (staffId: string, date: string) => void;
  getAllEditingCells: () => Array<{
    cellKey: string;
    staffId: string;
    date: string;
    userId: string;
    userName: string;
    startTime: number;
  }>;
  triggerSync: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;
  updateUserActivity: () => void;
  retryPendingChanges: () => Promise<void>;
  syncPendingChanges: () => Promise<{
    successful: string[];
    conflicts: Array<{
      changeId: string;
      localUpdate: ShiftCellUpdate;
      remoteUpdate?: ShiftCellUpdate;
      strategy: "local" | "remote" | "manual";
    }>;
  }>;
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  getLastUndo: () => HistoryEntry | null;
  getLastRedo: () => HistoryEntry | null;
  undoHistory: HistoryEntry[];
  redoHistory: HistoryEntry[];
  showHistory: boolean;
  toggleHistory: () => void;
  // コメント機能
  addComment: (
    cellKey: string,
    content: string,
    mentions: Mention[],
  ) => Promise<CellComment>;
  updateComment: (
    commentId: string,
    content: string,
    mentions: Mention[],
  ) => Promise<CellComment>;
  deleteComment: (commentId: string) => Promise<void>;
  getCommentsByCell: (cellKey: string) => CellComment[];
  replyToComment: (
    parentCommentId: string,
    content: string,
    mentions: Mention[],
  ) => Promise<CellComment>;
  deleteCommentReply: (
    parentCommentId: string,
    replyCommentId: string,
  ) => Promise<void>;
}

/**
 * 共同編集シフトコンテキスト
 */
export const CollaborativeShiftContext =
  createContext<CollaborativeShiftContextType | null>(null);

/**
 * 共同編集シフトコンテキストを使用するフック
 */
export const useCollaborativeShift = () => {
  const context = useContext(CollaborativeShiftContext);
  if (!context) {
    throw new Error(
      "useCollaborativeShift must be used within CollaborativeShiftProvider",
    );
  }
  return context;
};
