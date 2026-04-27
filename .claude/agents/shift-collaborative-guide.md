---
name: shift-collaborative-guide
description: Use this agent when implementing or modifying the shift collaborative editing feature (シフト共同編集). Knows the two-lock architecture (isLocked vs ShiftEditLock), cell rendering pipeline, CellHistoryPopover, lastChangedBy name resolution, VirtualizedShiftTable prop flow, and guard rails. Invoke when asked to modify ShiftCell, VirtualizedShiftTable, CellHistoryPopover, lock/unlock behavior, cell click behavior, or any file under src/features/shift/collaborative/ or src/pages/shift/collaborative/.
---

# シフト共同編集ガイド

英語で考えて、日本語で説明してください。

複数ユーザーが同じシフト表を同時に閲覧・編集するための機能です。入口は `src/pages/shift/collaborative/ShiftCollaborative.tsx`、UI・ロジックは `src/features/shift/collaborative/` に集約されています。

---

## ファイルマップ

| パス                                                                    | 役割                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/pages/shift/collaborative/ShiftCollaborative.tsx`                  | ページコンポーネント。セルクリック→ダイアログ開閉、各サブコンポーネントの統合 |
| `src/features/shift/collaborative/types/collaborative.types.ts`         | 全型定義（ShiftCellData, ShiftEditLockData, DataSyncStatus 等）               |
| `src/features/shift/collaborative/components/ShiftCell.tsx`             | セル単体の描画。ロック状態・編集状態のビジュアル制御                          |
| `src/features/shift/collaborative/components/CellHistoryPopover.tsx`     | 変更履歴インラインプレビュー用 Popover（単独利用。ShiftCellPanel の折りたたみ履歴とは別） |
| `src/features/shift/collaborative/components/VirtualizedShiftTable.tsx` | テーブル全体の描画。ShiftCellComponent に props を中継                        |
| `src/features/shift/collaborative/components/ChangeHistoryPanel.tsx`    | 変更履歴サイドドロワー（現在はメインページから切り離し済み。詳細検索・操作単位タブが必要な場合に接続） |
| `src/features/shift/collaborative/lib/cellChangeSourceConfig.ts`        | `CellChangeSource` の表示ラベル・Chip カラーを一元管理（各コンポーネントはここからインポートする）|
| `src/features/shift/collaborative/lib/shiftTransformers.ts`             | GraphQL ↔ ローカル型の変換・`lastChangedBy` の設定                            |
| `src/features/shift/collaborative/hooks/useShiftEditLocks.ts`           | 編集ロック（ShiftEditLock）の取得・更新・購読                                 |
| `src/features/shift/collaborative/hooks/useCollaborativePageState.ts`   | ページレベルの状態管理。セルクリック・選択・変更ハンドラ                      |
| `src/features/shift/collaborative/hooks/useCollaborativeShiftData.ts`   | GraphQL CRUD・Subscription 購読・楽観的更新                                   |
| `src/features/shift/collaborative/hooks/useCellChangeHistory.ts`        | セル単位の変更履歴の記録・取得。DB 由来のシードとセッション内操作を統合管理    |

---

## 2 種類のロックの違い

### 1. 確定ロック（`isLocked`）

セルが確定済みかどうかを示す永続フラグ。

```typescript
// ShiftCellData（collaborative.types.ts:76）
interface ShiftCellData {
  state: ShiftState; // work / fixedOff / requestedOff / auto / empty
  isLocked: boolean; // true = 確定済み（管理者のみ変更可）
  lastChangedBy?: string; // 最後に変更した staffId（名前ではない）
  lastChangedAt?: string; // ISO 8601
  version?: number; // 楽観的ロック用バージョン
}

// ShiftRequestEntry（DB に保存される形式、collaborative.types.ts:155）
type ShiftRequestEntry = {
  date: string;
  status: ShiftRequestStatus;
  isLocked?: boolean;
};
```

- **権限**: 管理者（`ADMIN` / `STAFF_ADMIN` / `OWNER`）のみ確定・解除可能
- **スコープ**: 月単位のスタッフ行全体、または個別セル
- **永続化**: GraphQL `updateShiftRequest` → DynamoDB に保存

### 2. 編集ロック（`ShiftEditLock`）

共同編集中の一時的な排他制御。編集開始時に自動取得、完了時に削除。

```typescript
// ShiftEditLockData（collaborative.types.ts:44）
interface ShiftEditLockData {
  id: string; // "{targetMonth}#{staffId}#{date}"
  staffId: string;
  date: string; // "DD"
  holderUserId: string;
  holderUserName: string;
  acquiredAt: string;
  expiresAt: string;
  version: number;
}
```

| 定数                            | 値        | 意味                               |
| ------------------------------- | --------- | ---------------------------------- |
| `EDIT_LOCK_TTL_MS`              | 90,000 ms | ロックの有効期限                   |
| `EDIT_LOCK_REFRESH_INTERVAL_MS` | 30,000 ms | 自動リフレッシュ間隔               |
| `EDIT_LOCK_CLEANUP_INTERVAL_MS` | 15,000 ms | 期限切れロックのクリーンアップ間隔 |

接続が切れると 90〜105 秒で自動解放される。

#### 編集ロック TTL 失効時のUX

編集ロックは `EDIT_LOCK_REFRESH_INTERVAL_MS`（30s）ごとに自動延長される。延長されず TTL（90s）を超えた場合：

1. **クリーンアップ処理**（15s ごと）が `expiresAt <= now` のロックを `editingCells` から削除
2. `visibleEditingCells` が更新され、`hasEditLock(staffId, date)` が `false` に
3. 自分のロックが失効した場合：
   - セルの編集中ビジュアル（青ボーダー）が消える
   - 次のキー入力で `changeCellState` 内の `hasEditLock` チェックが失敗し、エラー「編集前にロックを取得してください。」が表示される
   - バッチ保存もロックなしセルが除外される
4. 他ユーザーのロックが失効した場合：
   - セルから「〇〇が編集中」表示が消える
   - 自分がロックを取得可能になる

アクティブな編集操作（キー入力など）がある限りロックは自動延長されるため、通常の利用では失効は起きない。

### 管理者による強制解除（編集ロック剥奪）

**想定しない挙動が起きた場合や、担当スタッフがロック解除を忘れた場合に、管理者権限で強制的に編集ロックを解除できる。**

#### 強制解除ボタン

`ShiftCellPanel` に「編集ロックを強制剥奪」ボタンが表示される。

```
表示条件: isOthersEditingSelected（選択セルを他ユーザーが編集中）
        && canUnlock（isAdmin === true）
```

- 通常の「編集終了（ロック解除）」は自分自身のロックを解除する
- 「編集ロックを強制剥奪」は他ユーザーが保持しているロックを管理者権限で削除する

#### 実行フロー

```
1. 管理者が編集中のセルを選択
2. ShiftCellPanel の「編集ロックを強制剥奪」をクリック
3. handleForceReleaseLock → forceReleaseCell（isAdmin ガードあり）
4. forceReleaseLock → deleteShiftEditLock（DynamoDB からロックレコードを削除）
5. Subscription（onDeleteShiftEditLock）が全クライアントに通知
6. visibleEditingCells が更新され、ロックが消滅
```

#### ロックを剥奪されたスタッフへの影響

**ロックが強制解除されると、保持していたスタッフは即座に編集・保存ができなくなる。**

Subscription 受信後、`hasEditLock(staffId, date)` が `false` を返すようになるため：

| 操作 | 剥奪後の挙動 |
| --- | --- |
| キーボードでのセル変更 | `changeCellState` 内の `hasEditLock` チェックで弾かれる。エラー「編集前にロックを取得してください。」が表示される |
| 一括保存（バッチ更新） | `hasEditLock` フィルタによりロックなしのセルが除外され、変更が保存されない |
| 編集状態の表示 | `isEditing` フラグが解除され、セルのビジュアルも通常状態に戻る |

ロックを取得し直せば再び編集可能になるが、剥奪されたセルの未保存変更はローカル状態に残ったまま次の操作を待つ（自動破棄はされない）。

---

## `lastChangedBy` の実態と名前解決

`lastChangedBy` は **staffId（UUID）** であり、表示名ではない。

### 設定タイミング

```typescript
// (1) GraphQL からデータ受信時（shiftTransformers.ts:53）
map.set(dayKey, {
  isLocked: entry?.isLocked ?? false,
  lastChangedBy: shiftRequest?.updatedBy ?? undefined, // ← バックエンドの updatedBy
  lastChangedAt: shiftRequest?.updatedAt ?? undefined,
});

// (2) ローカルでセル更新時（shiftTransformers.ts:186）
staffData.set(update.date, {
  ...cell,
  lastChangedBy: currentUserId, // ← 現在のユーザーの staffId
  lastChangedAt: new Date().toISOString(),
});
```

### 名前解決のパターン

```typescript
// ShiftCollaborative.tsx での staffNameMap（全スタッフ staffId → 姓名）
const staffNameMap = useMemo(
  () =>
    new Map(
      staffs.map((staff) => [
        staff.id,
        `${staff.familyName || ""}${staff.givenName || ""}`.trim() || staff.id,
      ]),
    ),
  [staffs],
);

// CellHistoryPopover に渡す際の解決
const lockedBy = cellData.lastChangedBy
  ? (staffNameMap.get(cellData.lastChangedBy) ?? cellData.lastChangedBy)
  : undefined;
```

- `staffNameMap` にキーが存在すれば姓名を返す
- 存在しない場合は staffId をそのまま使用（フォールバック）
- 自分がロックした場合も自分の名前が正しく解決される（自分も `staffs` に含まれるため）

### 既知の制限

`lastChangedBy` は **セルではなくスタッフ行（ShiftRequest）単位**の `updatedBy` から来る。つまり、あるセルをロックした人ではなく「そのスタッフのシフトリクエストを最後に更新した人」が入る。セルごとの確定者履歴はローカルセッションの `CellChangeRecord` にのみ存在する。

---

## セルクリック時の処理フロー

### 左クリック → `ShiftCellPanel` が開く

セルを左クリックするとセルが選択状態になり、画面下部に **`ShiftCellPanel`** が浮き上がって表示される。これがユーザーから見た「セルを左クリックして開くパネル」の正体。

```
セル左クリック
  → handleCellClick（選択・フォーカス処理）
  → selectionCount が 1 以上になる
  → ShiftCellPanel が画面下部中央に固定表示される
```

### `handleCellClick` の内部動作（useCollaborativePageState.ts）
    setCellDetailOpen(true); // ダイアログを開く
  },
  [handleCellClick],
);
```

### `handleCellClick` の内部動作（useCollaborativePageState.ts）

| 操作                | 動作                                   |
| ------------------- | -------------------------------------- |
| 通常クリック        | `selectCell` + `focusCell`             |
| Shift + クリック    | `selectRange`（範囲選択）              |
| Ctrl/Cmd + クリック | `toggleCell` + `focusCell`（複数選択） |
| バッチ更新中        | 何もしない                             |

### `ShiftCellPanel` に渡すデータ（ShiftCollaborative.tsx）

`ShiftCellPanel` はページから直接 props を受け取る。選択セル情報 (`selectedCells`)・コメント・ロック状態・権限フラグ (`isAdmin`) などを渡す。セルクリックで新たなダイアログや Popover を開くロジックは持たない。

---

## `ShiftCellPanel` の仕様

セルを選択すると画面下部中央に固定表示される浮き上がり型パネル（`position: fixed, bottom: 24`）。1 セル以上選択されているときのみ表示される（`selectionCount === 0` で非表示）。

```typescript
interface ShiftCellPanelProps {
  selectionCount: number;
  selectedCells?: Array<{ staffId: string; date: string }>;
  comments?: CellComment[];
  cellHistory?: readonly CellChangeRecord[];  // 1セル選択時の変更履歴（getCellHistory で取得）
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onChangeState: (state: ShiftState) => void;
  onLock: () => void;
  onUnlock: () => void;
  onAddComments?: (content: string, mentions: Mention[]) => Promise<void>;
  canUnlock: boolean;
  showLock: boolean;
  showUnlock: boolean;
  hasClipboard: boolean;
  canPaste: boolean;
  isUpdating?: boolean;
  cellEditLockHolders?: EditLockHolder[];  // 選択セルの編集ロック保持者
  hasEditLockForSelected: boolean;
  isOthersEditingSelected: boolean;
  onAcquireEditLock: () => void;
  onReleaseEditLock: () => void;
  onForceReleaseLock: () => void;
}
```

パネルに表示されるセクション（上から順）：

| セクション | 表示条件 | 内容 |
| --- | --- | --- |
| 選択数 | 常時 | 「N セル選択中」+ 選択解除ボタン |
| 編集ロック制御 | 常時 | 編集開始 / 編集終了 / 強制剥奪 / 「他ユーザー編集中」テキスト |
| 編集ロック保持者 | `cellEditLockHolders.length > 0` | ロック中の人をアバター＋名前で一覧表示。本人の場合は「（あなた）」ラベルを付与 |
| 状態一括変更 | 常時 | 出勤 / 希望休 / 固定休 / 自動調整 / 未入力 Chip |
| 確定 / 解除 | `showLock` または `showUnlock` | 確定（ロック）/ 確定解除ボタン |
| コピー / 貼り付け | 常時 | コピー・貼り付けボタン |
| コメント追加 | `onAddComments` がある場合 | テキスト入力 + 既存コメント一覧 |
| 変更履歴 | `selectionCount === 1` | 折りたたみセクション（最大 5 件、超過分は「他N件」） |
| ヒントテキスト | 常時 | キーボードショートカット説明 |

## `CellHistoryPopover` の仕様

`ShiftCellPanel` の「このセルの変更履歴」ボタンを anchorEl として開く **MUI Popover**（インライン変更履歴プレビュー）。現在の接続: `onShowCellHistory` が `ChangeHistoryPanel`（ドロワー）を直接開くため、**Popover は現在未接続**。将来的にインラインプレビューとして接続する場合のみ使用する。

```typescript
interface CellHistoryPopoverProps {
  anchorEl: HTMLElement | null;           // ボタン要素（event.currentTarget）
  open: boolean;
  onClose: () => void;
  cellKey: string;                        // "staffId#date"
  records: readonly CellChangeRecord[];
  staffName?: string;
  maxVisible?: number;                    // デフォルト 20
}
```

---

## `ShiftCell` のビジュアル仕様

### 状態別スタイル

| 状態                     | 背景色                                  | ボーダー                | その他                                      |
| ------------------------ | --------------------------------------- | ----------------------- | ------------------------------------------- |
| 確定ロック（`isLocked`） | `rgba(148,163,184,0.12)` スレートグレー | `rgba(100,116,139,0.5)` | 右上にロックバッジ、コンテンツ opacity 0.65 |
| 自分が編集中             | `rgba(33,150,243,0.14)` 青              | `#2196f3`               | エディタイニシャルバッジ                    |
| 他ユーザーが編集中       | エディタカラー × 0.1                    | エディタカラー          | エディタイニシャルバッジ                    |
| フォーカス中             | 白                                      | `#9c27b0` 紫            | —                                           |
| 選択中                   | `rgba(156,39,176,0.15)` 紫              | グレー                  | —                                           |
| 通常                     | 白                                      | `rgba(226,232,240,0.7)` | —                                           |

### ロックアイコン（必須 UI）

**`isLocked: true` のセルには必ずセル内にロックアイコンを表示する。** セル右上に 16×16px のスレートグレー背景バッジとして配置し、白い `LockIcon`（MUI）を描画する。

```tsx
{isLocked && (
  <div className="absolute right-0 top-0 z-10 flex h-4 w-4 items-center justify-center rounded-bl-sm bg-slate-500 text-white">
    <LockIcon sx={{ fontSize: 10 }} />
  </div>
)}
```

- ロックアイコンはコンテンツの opacity（0.65）とは独立して **常に全不透明**で表示する
- セル内に配置する（テーブル外への絶対配置ではなく `td` の `position: relative` 内）
- ロックアイコンを削除・移動する場合は必ず代替の視覚的インジケータを用意する

### ツールチップ（ホバー / フォーカス時）

確定済みセルにカーソルを合わせると表示：

```
確定済み
確定者: {lastChangedBy（staffId のまま — 名前変換なし）}
YYYY/MM/DD HH:mm
```

注意: ツールチップの確定者表示は **意図的に `staffId` のまま**（`ShiftCell` に `staffNameMap` が届かないアーキテクチャ上の制約）。名前解決済みの詳細は左クリックで開く `CellHistoryPopover` に集約している。この設計を変更する場合は `ShiftCell` に `staffNameMap` を渡す props 追加が必要になる。

### 左クリック後のパネル表示（`ShiftCellPanel`）

**セルを左クリックするとセルが選択状態になり、画面下部中央に `ShiftCellPanel` が浮き上がる。** 新たなダイアログや Popover は開かない。

ダイアログに表示される情報：

| 項目 | 表示条件 | 内容 |
| --- | --- | --- |
| スタッフ名・日付 | 常時 | `{staffName} - {date}日`（タイトル） |
| シフト状態 | 常時 | 出勤 / 固定休 / 希望休 / 自動調整枠 / 未入力 |
| 確定状態アイコン | 常時 | 🔒「確定済み」または 🔓「未確定」 |
| 確定者名 | ChangeHistoryPanel の変更履歴レコードに記録 | `changedByName`（記録時点で解決済み） |
| 確定日時 | ChangeHistoryPanel の変更履歴レコードに記録 | `dayjs(changedAt).format(...)` |

`lockedBy` は `lastChangedBy`（staffId）を `staffNameMap.get()` で名前に解決した値を渡す。自分がロックした場合も自分の名前が正しく表示される。

---

## `VirtualizedShiftTable` → `ShiftCellComponent` の props フロー

```typescript
// VirtualizedShiftTable.tsx 内のセルレンダリング
const isEditing = isCellBeingEdited(staffId, dayKey);
const editor = getCellEditor(staffId, dayKey);
const editLockOwner: ShiftCellEditLockOwner = editor
  ? editor.userId === currentUserId ? "self" : "other"
  : null;

<ShiftCellComponent
  staffId={staffId}
  date={dayKey}
  state={cell.state}
  isLocked={cell.isLocked}
  isEditing={isEditing}
  editLockOwner={editLockOwner}
  editorName={editor?.userName}
  editorColor={editor?.color}
  lastChangedBy={cell.lastChangedBy}   // staffId（名前ではない）
  lastChangedAt={cell.lastChangedAt}
  onClick={(event) => onCellClick(staffId, dayKey, event)}
  ...
/>
```

`ShiftCellComponent` は `ShiftCollaborative.tsx` 内で `ShiftCellWithComments` としてメモ化されて渡される。

---

## 変更履歴の仕様

### 記録される内容（`CellChangeRecord`）

セル値を変更するたびに「いつ・誰が・どのように・何を変えたか」を `CellChangeRecord` として記録する。

```typescript
// collaborative.types.ts:236
interface CellChangeRecord {
  id: string;                 // レコードID
  cellKey: string;            // "staffId#date"
  staffId: string;
  date: string;               // "DD"
  previousState?: ShiftState; // 変更前のシフト状態
  newState?: ShiftState;      // 変更後のシフト状態
  previousLocked?: boolean;   // 変更前の確定状態
  newLocked?: boolean;        // 変更後の確定状態
  changedBy: string;          // 変更者の userId
  changedByName: string;      // 変更者の表示名（記録時点で解決済み）
  changedAt: number;          // timestamp（Date.now()）
  source: CellChangeSource;   // 変更の発生源
  operationId?: string;       // 一括操作のグルーピングキー
}
```

### 変更の発生源（`CellChangeSource`）

| source | 発生条件 | 表示ラベル（色） |
| --- | --- | --- |
| `manual` | ユーザーがキーボードで手動変更 | 「手動」（青） |
| `batch` | 一括変更（ShiftCellPanel の状態一括変更） | 「一括」（紫） |
| `undo` | Ctrl+Z（取り消し） | 「取り消し」（黄） |
| `redo` | Ctrl+Y（やり直し） | 「やり直し」（水色） |
| `conflict-resolution` | 競合解決ダイアログから変更 | 「競合解決」（赤） |
| `remote` | Subscription 経由のリアルタイムリモート変更 | 「他ユーザー」（グレー） |
| `db-history` | DB の `histories` スナップショットから導出（リロード後も表示される） | 「履歴」（グレー） |

ラベル・カラーの定義は `src/features/shift/collaborative/lib/cellChangeSourceConfig.ts` で一元管理。各コンポーネント内にローカル定義を持たせない。

### 記録タイミングと API（`useCellChangeHistory`）

```typescript
const {
  recordCellChange,        // 単一セルの変更を記録
  recordBatchCellChanges,  // 複数セルを一括記録（operationId で紐付け）
  recordRemoteChange,      // Subscription 経由のリモート変更を記録
  seedHistory,             // DB 由来のレコードで初期化（CollaborativeShiftProvider が初回ロード時に呼び出す）
  getCellHistory,          // 特定セルの履歴を新しい順で取得
  getAllCellHistory,        // 全セルの履歴を新しい順で取得
  getStaffCellHistory,     // 特定スタッフの全セル履歴を取得
  clearCellHistory,        // 履歴をクリア（月切り替え時に CollaborativeShiftProvider が呼び出す）
} = useCellChangeHistory({ maxRecordsPerCell: 200 });
```

`recordCellChange` の呼び出しシグネチャ：

```typescript
recordCellChange(
  update: ShiftCellUpdate,  // staffId, date, newState, isLocked, previousState, previousLocked
  changedBy: string,        // userId
  changedByName: string,    // 表示名（呼び出し元で解決してから渡す）
  source: CellChangeSource,
  operationId?: string,     // 一括操作時のみ指定
);
```

### 変更履歴の永続化（DB シード）

変更履歴はセッション内操作と DB 由来レコードの 2 層で構成される。

- **DB 由来（`source: "db-history"`）**: `CollaborativeShiftProvider` が初回ロード時に `ShiftRequest.histories`（スナップショット配列）を `deriveHistoryCellChanges` でセル差分に変換し、`seedHistory` で注入する。ページリロード後も復元される。
- **セッション内操作（`source: "manual" / "batch" / "undo" / "redo" / "remote" / "conflict-resolution"`）**: セッション中の操作のみ。リロード後は DB シード分のみ残る。
- `changedByName` の解決は呼び出し元の責務（不明な場合は `"不明"` になる）
- 月切り替え時は `clearCellHistory()` が呼ばれ、新しい月のデータが再シードされる

### 変更履歴の表示 UI

**インライン表示（ShiftCellPanel）**:
1 セル選択時に画面下部の `ShiftCellPanel` 内に折りたたみセクション「変更履歴（N件）」が表示される。最大 5 件表示、超過分は「他N件」。これが現在の主要経路。

**`ChangeHistoryPanel`（サイドドロワー）**:
フィルター・操作単位タブ・全セル表示などの高度な機能を持つが、現在のメインページからは切り離し済み。必要な場合に接続する。

**右クリックによる履歴表示は削除済み**。`onCellContextMenu` を `VirtualizedShiftTable` に渡していない。

セル変更履歴の各レコードで表示される内容：

| 項目 | データソース |
| --- | --- |
| 変更日時 | `dayjs(record.changedAt).format("M/D HH:mm")` |
| 発生源 | `CELL_CHANGE_SOURCE_LABELS[record.source]`（Chip で色分け） |
| シフト状態の変化 | `previousState → newState`（日本語ラベル） |
| 変更者名 | `record.changedByName`（記録時点で解決済み） |

---

## 権限ルール

```typescript
// ShiftCellPanel への各種ボタン制御
showLock={hasUnlocked && isAdmin}         // 確定ロックボタンは管理者のみ表示
showUnlock={hasLocked}                    // 確定解除は選択セルにロック済みがある場合
canUnlock={isAdmin}                       // 確定解除の実行は管理者のみ

// 編集ロック強制剥奪（ShiftCellPanel）
// 表示: (hasEditLockForSelected || isOthersEditingSelected) && canUnlock（isAdmin）
// 自分がロック中の場合も管理者であればボタンを表示する
// 非管理者には「他のユーザーが編集中です」テキストのみ表示される

// isAdmin の判定（useCollaborativePageState.ts）
const isAdmin = cognitoUser?.roles?.some(
  (role) => role === "ADMIN" || role === "STAFF_ADMIN" || role === "OWNER"
);
```

| 操作 | 一般スタッフ | 管理者（ADMIN / STAFF_ADMIN / OWNER） |
| --- | --- | --- |
| 確定ロック（isLocked）の付与 | 不可 | 可 |
| 確定ロックの解除 | 不可 | 可 |
| 編集ロック（ShiftEditLock）の取得・解除 | 自分のみ | 自分のみ |
| 編集ロックの強制剥奪（自分・他者問わず） | 不可（テキスト表示のみ） | 可（「編集ロックを強制剥奪」ボタン。自分がロック中でも表示） |

---

## ガードレール

- `lastChangedBy` は **staffId** であり表示名ではない。表示前に必ず `staffNameMap.get()` で変換する
- `ShiftCell` には `staffNameMap` が届かないため、ツールチップには名前変換を入れない。名前付き表示は `ShiftCellPanel` のコメント・履歴機能に集約する
- 確定ロック（`isLocked`）と編集ロック（`ShiftEditLock`）は別物。混同しない
- `ShiftRequestEntry` にはセルごとの `lastChangedBy` がない。セルのロック操作者の正確な追跡はセッション内の `CellChangeRecord` でのみ可能
- 右クリック履歴は削除済み。変更履歴への動線は「セル選択 → ShiftCellPanel の「このセルの変更履歴」ボタン → ChangeHistoryPanel（ドロワー）」が正規ルート
- 確定・解除は管理者のみ。UI と `applyLockState` の両方でガードする
- 編集ロックの強制剥奪（`handleForceReleaseLock`）は `isAdmin` をコード内でも確認している。UI の表示条件だけに頼らない
- 強制剥奪後、被剥奪スタッフの未保存変更は自動破棄されない。ローカル状態に残ったまま次の操作を待つ仕様
- `buildEditLockConflictMessage` は `staffId` をメッセージに含めない。`ShiftCell` に `staffNameMap` が届かないため、メッセージは `holderUserName` と `date` のみで構成する
- セルクリックで新たなダイアログや Popover を追加してはいけない。セル選択後の操作は `ShiftCellPanel` に集約する
- `lastChangedAt` はセル単位ではなくスタッフ行（ShiftRequest）単位の更新時刻。ShiftCellPanel 経由で参照される「確定日時」はセルのロック日時ではなく行全体の最終更新時刻である点に注意

---

## エラー種別と表示

`editLockError`（`useCollaborativePageState` が管理する InlineAlert 文字列）で発生しうるエラー：

| エラー種別 | 発生条件 | 表示メッセージ |
| --- | --- | --- |
| ネットワーク断 | `isEditingDisabled === true` | 「通信が切断されています。再接続後に編集を再開してください。」 |
| 確定済みセル変更 | `isCellLocked(staffId, date)` | 「確定済みのセルは変更できません。」 |
| 他ユーザーが編集中 | `isCellBeingEdited(staffId, date)` | 「{holderUserName} が {date} 日セルを編集中です。」 |
| ロック未取得で編集 | `!hasEditLock(staffId, date)` | 「編集前にロックを取得してください。」 |
| ロック競合（取得失敗） | 取得試行時に他ユーザーがロック中 | 「{holderUserName} が {date} 日セルを編集中です。」 |
| 編集ロック処理失敗 | GraphQL エラー | 「編集ロックの処理に失敗しました。」 または詳細メッセージ |

エラーは `ShiftCollaborative.tsx` で `<InlineAlert>` として画面上部に表示される。`clearEditLockError()` で手動クリア、または次の成功操作で自動クリアされる。

---

## 参照実装ファイル

| 概念                           | ファイル・行                                                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| 確定ロック UI                  | `src/features/shift/collaborative/components/ShiftCell.tsx:167-177`        |
| セル選択パネル（左クリック後）  | `src/features/shift/collaborative/components/ShiftCellPanel.tsx`           |
| 変更履歴インラインプレビュー     | `src/features/shift/collaborative/components/CellHistoryPopover.tsx`       |
| セルクリック処理               | `src/pages/shift/collaborative/ShiftCollaborative.tsx:195-204`             |
| セルデータ取得・名前解決       | `src/pages/shift/collaborative/ShiftCollaborative.tsx:175-192`             |
| 編集ロック管理                 | `src/features/shift/collaborative/hooks/useShiftEditLocks.ts`              |
| 編集ロック強制剥奪（実行）     | `src/features/shift/collaborative/hooks/useShiftEditLocks.ts:542`          |
| 編集ロック強制剥奪（UI）       | `src/features/shift/collaborative/components/ShiftCellPanel.tsx:170-179`   |
| 強制剥奪ハンドラ               | `src/features/shift/collaborative/hooks/useCollaborativePageState.ts:581`  |
| データ変換・lastChangedBy 設定 | `src/features/shift/collaborative/lib/shiftTransformers.ts:50-55, 182-188` |
| 変更履歴の記録・取得           | `src/features/shift/collaborative/hooks/useCellChangeHistory.ts`           |
| ガードレール仕様               | `.github/instructions/shiftCollaborative.instructions.md`                  |
