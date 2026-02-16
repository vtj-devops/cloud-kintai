/**
 * 共同編集シフト調整の型定義
 */

import {
  ModelShiftRequestConditionInput,
  ShiftRequestStatus,
  UpdateShiftRequestInput,
} from "@shared/api/graphql/types";

/**
 * シフト状態（内部表現）
 */
export type ShiftState =
  | "work"
  | "fixedOff"
  | "requestedOff"
  | "auto"
  | "empty";

/**
 * 参加ユーザー情報
 */
export interface CollaborativeUser {
  userId: string;
  userName: string;
  color: string; // UI用のアバターカラー
  lastActivity: number; // timestamp
}

/**
 * 接続状態
 */
export interface ConnectionState {
  status: "connected" | "disconnected" | "syncing";
  lastSyncedAt: number; // timestamp
  pendingChangeCount: number;
}

/**
 * シフトセルデータ
 */
export interface ShiftCellData {
  state: ShiftState;
  isLocked: boolean;
  lastChangedBy?: string;
  lastChangedAt?: string;
  version?: number;
}

/**
 * シフトデータマップ
 * Key: staffId, Value: Map<dayKey, ShiftCellData>
 */
export type ShiftDataMap = Map<string, Map<string, ShiftCellData>>;

/**
 * 保留中の変更
 * Key: staffId-dayKey, Value: ShiftCellUpdate
 */
export type PendingChangesMap = Map<string, ShiftCellUpdate>;

/**
 * 共同編集コンテキストの状態
 */
export interface CollaborativeShiftState {
  // シフトデータ
  shiftDataMap: ShiftDataMap;

  // 参加ユーザー
  activeUsers: CollaborativeUser[];

  // 編集中のセル（他のユーザーが編集中）
  editingCells: Map<
    string,
    { userId: string; userName: string; startTime: number }
  >;

  // ローカル編集状態
  pendingChanges: PendingChangesMap;
  selectedCells: Set<string>; // "staffId#dayKey"

  // 状態フラグ
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: number;
  error: string | null;
  connectionState: "connected" | "disconnected" | "error";

  // オフライン対応
  isOnline: boolean;
  hasPendingChanges: boolean;
}

/**
 * GraphQL から受け取るシフトリクエスト
 */
export interface ShiftRequestData {
  id: string;
  staffId: string;
  targetMonth: string;
  entries?: ShiftRequestEntry[];
  updatedAt?: string;
  updatedBy?: string;
  version?: number;
}

export type ShiftRequestEntry = {
  date: string;
  status: ShiftRequestStatus;
  isLocked?: boolean;
};

export type ShiftRequestsQueryArgs = {
  staffIds: string[];
  targetMonth: string;
};

export type ShiftRequestQueryArgs = {
  staffId: string;
  targetMonth: string;
};

export type ShiftRequestUpdatePayload = {
  input: UpdateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput;
};

export const shiftRequestStatusToShiftState = (
  status?: ShiftRequestStatus | null,
): ShiftState => {
  switch (status) {
    case ShiftRequestStatus.WORK:
      return "work";
    case ShiftRequestStatus.FIXED_OFF:
      return "fixedOff";
    case ShiftRequestStatus.REQUESTED_OFF:
      return "requestedOff";
    case ShiftRequestStatus.AUTO:
      return "auto";
    default:
      return "empty";
  }
};

export const shiftStateToShiftRequestStatus = (
  state: ShiftState,
): ShiftRequestStatus | null => {
  switch (state) {
    case "work":
      return ShiftRequestStatus.WORK;
    case "fixedOff":
      return ShiftRequestStatus.FIXED_OFF;
    case "requestedOff":
      return ShiftRequestStatus.REQUESTED_OFF;
    case "auto":
      return ShiftRequestStatus.AUTO;
    default:
      return null;
  }
};

/**
 * シフト更新リクエスト（UIからの入力）
 */
export interface ShiftCellUpdate {
  staffId: string;
  date: string; // "DD"
  newState?: ShiftState;
  isLocked?: boolean;
  previousState?: ShiftState;
  previousLocked?: boolean;
}

/**
 * メンション情報
 */
export interface Mention {
  userId: string;
  userName: string;
  position: number; // テキスト内の位置
}

/**
 * セルコメント
 */
export interface CellComment {
  id: string;
  cellKey: string; // "staffId#date"
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  mentions: Mention[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isEdited: boolean;
  replies?: CellComment[]; // 返信コメント
}

/**
 * コメントマップ
 * Key: cellKey ("staffId#date"), Value: CellComment[]
 */
export type CommentsMap = Map<string, CellComment[]>;

/**
 * 共同編集コンテキストの状態（拡張版）
 */
export interface CollaborativeShiftStateWithComments extends CollaborativeShiftState {
  // コメント管理
  comments: CommentsMap;
  selectedCommentCell: string | null; // コメント編集中のセルキー
}
