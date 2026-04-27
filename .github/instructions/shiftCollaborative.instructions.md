---
applyTo: "src/pages/shift/collaborative/**,src/features/shift/collaborative/**"
---

# シフト共同編集 (ShiftCollaborative)

複数ユーザーが同じシフト表を同時に閲覧・編集するための機能。エントリポイントは `src/pages/shift/collaborative/ShiftCollaborative.tsx`（`ShiftCollaborativePage`）。

編集 UI・競合解決・履歴・提案表示・ショートカットなどの協調編集機能は `src/features/shift/collaborative/` に集約されている。

## 全体構造

```
pages/shift/collaborative/ShiftCollaborative.tsx   ← エントリポイント
  └─ CollaborativeShiftProvider（providers/）       ← 状態・副作用の統合
       ├─ useCollaborativeShiftData                 ← AppSync CRUD + 楽観的更新
       ├─ useShiftSync                              ← Subscription + 自動同期
       ├─ useShiftEditLocks                         ← 編集ロック取得/解放
       ├─ useShiftPresence                          ← 在席表示
       ├─ useShiftComments                          ← セルコメント
       ├─ useCellChangeHistory                      ← 変更履歴（インメモリ + DB シード）
       └─ useUndoRedo                               ← Undo/Redo スタック

features/shift/collaborative/
  components/       UI コンポーネント（VirtualizedShiftTable, ShiftCell, ShiftCellPanel, …）
  hooks/            上記フック群
  providers/        CollaborativeShiftProvider
  context/          CollaborativeShiftContext（Provider が公開する値）
  lib/              純粋関数（shiftTransformers, cellChangeSourceConfig）
  rules/            ビジネスルール（shiftRules）
  types/            型定義（collaborative.types.ts）
```

## 権限ルール

- **確定（ロック）・確定解除はいずれも管理者（`ADMIN` / `STAFF_ADMIN` / `OWNER`）のみ実行可能**。
- スタッフロール（`STAFF` / `GUEST` / `OPERATOR` 等）には確定ロックボタン自体を表示しない（`showLock={hasUnlocked && isAdmin}`）。
- ロジック層（`applyLockState`）でも `isAdmin` チェックをダブルガードとして維持し、UI バイパスを防ぐ。
- 強制ロック解放（`handleForceReleaseLock`）も同様に管理者のみ実行可能。

## 実装ガードレール

### リアルタイム同期

- 同期設計は GraphQL Subscription / pub-sub を第一選択とし、単発ポーリングや独自監視を主軸にしない。
- 同期制御は `useShiftSync` を中心に維持し、手動同期は `triggerSync` によるフォールバックとして扱う。
- リアルタイム受信は `onCreateShiftRequest` と `onUpdateShiftRequest` の両購読を必須とする。片方のみの購読は初回作成イベントの取りこぼしを招くため避ける。
- `updatedBy === currentUserId` の自己イベント除外を維持し、楽観的更新との二重反映を防止する。

### 状態管理

- データ状態は `DataSyncStatus`（`idle` / `saving` / `syncing` / `saved` / `synced` / `error`）を単一の真実源とし、成功状態（`saved` / `synced`）の短時間フィードバック（約 3 秒）を維持する。
- 競合解決は `ConflictResolutionDialog` など既存フローを再利用し、暗黙上書きや握りつぶしを禁止する。`conflicts={[]}` 固定のプレースホルダ状態で完了扱いにしない。

### UI/UX

- 手動同期 UI は `UndoRedoToolbar` の同期操作を基準とし、実行中の二重実行防止（disabled）を必須とする。同期インジケータの最短表示時間（現状 2 秒）も維持する。
- 「最後に自動同期された日時」は `YYYY/MM/DD HH:mm:ss` 形式で提示し、未受信時は `未同期` を明示する。
- 競合解決は `ConflictResolutionDialog` 経由（暗黙上書き禁止）。
- 表形式 UI は `VirtualizedShiftTable` 前提で設計し、データ量増加時のパフォーマンス劣化を招く実装を避ける。

## 機能別要件

### 編集・同期

- セル編集時はロック状態、編集中ユーザー、最終更新者/更新時刻を考慮し、上書き事故を防ぐ。
- 手動同期はリアルタイム同期を補完する手段として提供し、完了時は即時反映、失敗時は再試行導線を提示する。
- 同期失敗は黙殺せず、原因の概要と再同期導線を表示する。

### ステータス表示

- 画面状態として `未同期` `保存中` `同期中` `保存完了` `同期完了` `エラー` を区別して表示する。
- ステータス表示は色だけに依存せず、テキストとアイコン/ローディング表現を組み合わせる。
- `保存中` / `同期中` は進行中だと明確に分かる表現にする。
- セル単位状態と全体状態が混在する場合は優先度（例: `エラー > 保存中/同期中 > 完了`）を定義して矛盾を避ける。

### アクティブユーザー表示

- 接続中スタッフは画面上部のアクティブユーザー領域にアバター表示する。
- 各アバターには識別可能な表示名またはイニシャル、および個別識別色を付与する。
- 編集中ユーザーは閲覧中ユーザーと視覚的に区別し、編集中セル情報などを確認可能にする。
- 多人数同時接続時でもレイアウト崩れを防ぐため、`AvatarGroup` などで上限表示と省略表示を行う。

### 変更履歴

#### データフロー

```
DB (DynamoDB)
  ↓ getShiftRequests（listShiftRequestsLite / shiftRequestsByStaffIdLite）
ShiftRequest.histories（月次シフト全体のスナップショット配列、新しい順）
  ↓ normalizeShiftRequest（shiftTransformers.ts）
ShiftRequestData.histories
  ↓ deriveHistoryCellChanges（shiftTransformers.ts）
     連続スナップショットを差分比較 → CellChangeRecord[]（source="db-history"）
  ↓ seedHistory（useCellChangeHistory.ts、初回ロード時のみ）
useCellChangeHistory.historyMap（インメモリ）
  + セッション中の操作（recordCellChange / recordBatchCellChanges / recordRemoteChange）
  ↓ getCellHistory(cellKey)
ShiftCellPanel の「変更履歴」折りたたみセクション（インライン表示）
```

#### 実装構造

- **`useCellChangeHistory`**: セル単位の変更履歴をインメモリで管理するフック。
  - `recordCellChange` / `recordBatchCellChanges`：手動・一括操作の記録
  - `recordRemoteChange`：Subscription 経由のリモート変更の記録
  - `clearCellHistory`：月切り替え時のリセット（`CollaborativeShiftProvider` が呼び出す）
  - `seedHistory`：初回ロード時に DB 由来のレコードを注入する
  - `getCellHistory(cellKey)`：指定セルの履歴を新しい順で返す

- **`CollaborativeShiftProvider`** のシード制御: `seededMonthRef`（`useRef<string | null>`）で「シード済みの月」を追跡する。
  - `targetMonth` が変わったとき：`clearCellHistory()` を呼び出し、`seededMonthRef.current = null` にリセット。
  - `isLoading` が `false` になったとき：まだシードしていなければ `deriveHistoryCellChanges` → `seedHistory` を実行し、`seededMonthRef.current = targetMonth` に更新。
  - これら 2 つの処理は 1 つの `useEffect`（依存配列: `[targetMonth, isLoading, ...]`）にまとめられている。

- **`deriveHistoryCellChanges`** (`shiftTransformers.ts`): DB の `histories` スナップショット配列をセル単位の `CellChangeRecord[]` に変換するピュア関数。
  - 連続するスナップショットを古い順に差分比較し、`status` または `isLocked` が変化したセルのみレコード化する。
  - `source` は `"db-history"` 固定（セッション内のリモート受信 `"remote"` と区別するため）。
  - 最古スナップショットは「変更前不明（`previousState: undefined`）」として扱う。

- **`ShiftRequestLite`** (`shiftApi.ts`): フェッチクエリに `histories { version entries { date status isLocked } recordedAt recordedByStaffId }` を含めて取得する。**このフィールドを省略すると履歴がリロードで消える。**

- **`ShiftCellPanel`**: セル選択時に表示される下部固定パネルに変更履歴をインライン表示する。
  - 1 セル選択時のみ「変更履歴（N件）」折りたたみセクションを表示（最大 5 件、超過分は「他N件」）。

- **`CELL_CHANGE_SOURCE_LABELS` / `CELL_CHANGE_SOURCE_COLORS`** (`lib/cellChangeSourceConfig.ts`): `CellChangeSource` の表示ラベルと MUI Chip カラーを一元管理。`ShiftCellPanel` / `CellHistoryPopover` / `ChangeHistoryPanel` はすべてここからインポートする（ローカル定義を持たない）。

#### `CellChangeSource` 区分

| 値 | 意味 |
|----|------|
| `"manual"` | ユーザーによる手動変更（セルクリック） |
| `"batch"` | 一括変更（ShiftCellPanel の状態一括変更） |
| `"undo"` | Undo 操作による変更 |
| `"redo"` | Redo 操作による変更 |
| `"conflict-resolution"` | 競合解決ダイアログ経由の変更 |
| `"remote"` | Subscription 経由のリアルタイムリモート変更 |
| `"db-history"` | DB の `histories` スナップショットから導出した変更（リロード後も表示される） |

#### ガードレール

- 上記 `CellChangeSource` 区分の意味を混在させない。特に `"remote"`（Subscription リアルタイム）と `"db-history"`（DB スナップショット由来）は区別する。
- DB 由来（`"db-history"`）とセッション内操作は同一の `historyMap` に統合し、時系列で混在表示する。
- `UndoRedoToolbar` の取り消し・やり直しは履歴と整合させ、表示と内部状態の不一致を起こさない。
- `histories` はスナップショット（全セル）であり、セル差分は `deriveHistoryCellChanges` が導出する。DB スキーマを変更してセル差分を直接保存する場合はこの関数を削除・置き換えること。

## UI/UX ルール

- シフトセルの状態表現（`work` / `fixedOff` / `requestedOff` / `auto` / `empty`）は既存の意味と色・ラベル対応を維持する。
- アクティブユーザー表示、プレゼンス通知、編集中表示は協調編集の中核機能として扱い、削除・簡略化は慎重に行う。
- 操作性改善ではマウス操作とキーボード操作の両方を確認し、ショートカットヘルプの更新漏れを防ぐ。
