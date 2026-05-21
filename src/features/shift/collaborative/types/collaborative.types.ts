/**
 * 共同編集シフト調整の型定義
 */

import type { ShiftStateWithEmpty as ShiftState } from "@entities/shift/lib/statusMapping";
import {
  ModelShiftRequestConditionInput,
  ShiftRequestStatus,
  UpdateShiftRequestInput,
} from "@shared/api/graphql/types";

export type { ShiftState };

/**
 * データ同期ステータス
 */
export type DataSyncStatus =
  | "idle"
  | "saving"
  | "syncing"
  | "saved"
  | "synced"
  | "error";

/**
 * 参加ユーザー情報
 */
export interface CollaborativeUser {
  userId: string;
  userName: string;
  color: string; // UI用のアバターカラー
  lastActivity: number; // timestamp
}

export type ShiftCellEditLockOwner = "self" | "other" | null;

export interface ShiftEditLockData {
  id: string;
  targetMonth: string;
  staffId: string;
  date: string;
  holderUserId: string;
  holderUserName: string;
  acquiredAt: string;
  expiresAt: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EditLockAcquireResult {
  acquired: boolean;
  lock?: ShiftEditLockData;
  conflict?: ShiftEditLockData;
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
  lastAutoSyncedAt: number;
  dataStatus: DataSyncStatus;
  error: string | null;
  connectionState: "connected" | "disconnected" | "error";

  // 接続状態
  isOnline: boolean;

  // リモート更新通知（サブスクリプション経由で他ユーザーの変更を受信した際のスタッフID）
  lastRemoteUpdate: { staffId: string; timestamp: number } | null;
}

/**
 * GraphQL から受け取るシフトリクエスト
 */
export interface ShiftRequestCommentData {
  id: string;
  cellKey: string;
  staffId: string;
  authorName?: string;
  body: string;
  createdAt: string;
}

export interface ShiftRequestHistoryEntry {
  version: number;
  entries?: Array<{ date: string; status: ShiftRequestStatus; isLocked?: boolean }>;
  recordedAt: string; // ISO文字列
  recordedByStaffId?: string;
}

export interface ShiftRequestData {
  id: string;
  staffId: string;
  targetMonth: string;
  entries?: ShiftRequestEntry[];
  comments?: ShiftRequestCommentData[];
  histories?: ShiftRequestHistoryEntry[];
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
 * セル変更の発生源
 */
export type CellChangeSource =
  | "manual"        // ユーザーによる手動変更
  | "batch"         // 一括変更
  | "conflict-resolution" // 競合解決
  | "remote"        // Subscription 経由の他ユーザー変更（リアルタイム）
  | "db-history";   // DB のスナップショット履歴から復元した記録

/**
 * セル単位の変更履歴レコード
 */
export interface CellChangeRecord {
  readonly id: string;
  readonly cellKey: string; // "staffId#date"
  readonly staffId: string;
  readonly date: string; // "DD"
  readonly previousState?: ShiftState;
  readonly newState?: ShiftState;
  readonly previousLocked?: boolean;
  readonly newLocked?: boolean;
  readonly changedBy: string; // userId
  readonly changedByName: string;
  readonly changedAt: number; // timestamp
  readonly source: CellChangeSource;
  readonly operationId?: string; // 一括操作のグルーピング用
}

/**
 * セル変更履歴マップ
 * Key: cellKey ("staffId#date"), Value: CellChangeRecord[]
 */
export type CellChangeHistoryMap = Map<string, CellChangeRecord[]>;

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
