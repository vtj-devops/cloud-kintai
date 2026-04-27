---
name: appsync-realtime
description: Use this agent when implementing or modifying real-time data display using AppSync GraphQL Subscriptions (pub/sub). Knows the subscription patterns, optimistic update flow, self-event exclusion, version conflict resolution, DataSyncStatus state machine, and memory leak prevention for this project. Invoke when asked to add real-time sync, modify subscription hooks, or debug live-update behavior.
---

# AppSync Pub/Sub リアルタイム表示ガイド — garaku-frontend

英語で考えて、日本語で説明してください。

このプロジェクトでは **AWS Amplify AppSync** の GraphQL Subscription を使ってリアルタイムデータ同期を実現しています。主な実装例はシフト共同編集機能です。

---

## 設計の基本方針（ガードレール）

- **GraphQL Subscription を第一選択**。ポーリングや独自タイマーによる監視は主軸にしない
- `onCreate` と `onUpdate` の **両方を必ず購読する**。片方だけでは初回作成イベントを取りこぼす
- `updatedBy === currentUserId` による **自己イベント除外を必ず実装する**（楽観的更新との二重反映防止）
- 競合解決は **`ConflictResolutionDialog` を再利用し、暗黙上書きを禁止する**
- 同期状態は **`DataSyncStatus` を唯一の真実源**とする

---

## Subscription 定義ファイル（自動生成・編集禁止）

```
src/shared/api/graphql/documents/subscriptions.ts
```

定義されている主な subscription（命名パターン: `on{Create|Update|Delete}{ModelName}`）:

| subscription | 用途 |
|---|---|
| `onCreateShiftRequest` / `onUpdateShiftRequest` | シフトリクエストのリアルタイム同期 |
| `onCreateShiftEditLock` / `onUpdateShiftEditLock` / `onDeleteShiftEditLock` | 編集ロック管理 |
| `onCreateAttendance` / `onUpdateAttendance` / `onDeleteAttendance` | 勤怠リアルタイム同期 |
| `onCreateCheckForUpdate` / `onUpdateCheckForUpdate` | デプロイ更新検知 |

---

## GraphQL クライアント

```typescript
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
```

`graphqlClient` は Amplify の `generateClient()` でラップされたシングルトン。直接 `generateClient()` を呼ばず、このクライアントを経由する。

---

## Subscription の基本パターン

### useEffect での subscribe / unsubscribe

```typescript
useEffect(() => {
  // 依存データが揃っていなければ購読しない
  if (!targetMonth || staffIds.length === 0) return;

  // 複数エンティティへの購読を flatMap で展開
  const subscriptions = staffIds.flatMap((staffId) => {
    const variables = {
      filter: {
        staffId: { eq: staffId },
        targetMonth: { eq: targetMonth },
      },
    };

    // onCreate と onUpdate の両方を必ず購読する
    const createSub = graphqlClient
      .graphql({ query: onCreateShiftRequest, variables, authMode: "userPool" })
      .subscribe({
        next: ({ data }) => {
          if (!data?.onCreateShiftRequest) return;
          const record = normalizeShiftRequest(data.onCreateShiftRequest);
          handleRealtimeEvent(record, "created", staffId);
        },
        error: (error) => {
          console.error(`[Subscription Error] create for staff ${staffId}:`, error);
          // Amplify が自動で再接続するためここでは console.error のみ
        },
      });

    const updateSub = graphqlClient
      .graphql({ query: onUpdateShiftRequest, variables, authMode: "userPool" })
      .subscribe({
        next: ({ data }) => {
          if (!data?.onUpdateShiftRequest) return;
          const record = normalizeShiftRequest(data.onUpdateShiftRequest);
          handleRealtimeEvent(record, "updated", staffId);
        },
        error: (error) => {
          console.error(`[Subscription Error] update for staff ${staffId}:`, error);
        },
      });

    return [createSub, updateSub];
  });

  // クリーンアップ：アンマウント時・依存配列変更時に必ず解除する
  return () => {
    subscriptions.forEach((sub) => sub.unsubscribe());
  };
}, [staffIdsKey, targetMonth, currentUserId, updateState]);
// 注: staffIds 配列は join した文字列キー（staffIdsKey）で依存を管理し、
//     不要な再購読を防ぐ
```

### onCreate / onUpdate / onDelete の 3 種購読（ロック等）

```typescript
useEffect(() => {
  if (!targetMonth) return;

  const variables = { filter: { targetMonth: { eq: targetMonth } } };

  const createSub = graphqlClient
    .graphql({ query: onCreateShiftEditLock, variables, authMode: "userPool" })
    .subscribe({
      next: ({ data }) => {
        if (data?.onCreateShiftEditLock) upsertLock(data.onCreateShiftEditLock);
      },
      error: (error) => console.error("create lock sub error:", error),
    });

  const updateSub = graphqlClient
    .graphql({ query: onUpdateShiftEditLock, variables, authMode: "userPool" })
    .subscribe({
      next: ({ data }) => {
        if (data?.onUpdateShiftEditLock) upsertLock(data.onUpdateShiftEditLock);
      },
      error: (error) => console.error("update lock sub error:", error),
    });

  const deleteSub = graphqlClient
    .graphql({ query: onDeleteShiftEditLock, variables, authMode: "userPool" })
    .subscribe({
      next: ({ data }) => {
        if (data?.onDeleteShiftEditLock) {
          const lock = data.onDeleteShiftEditLock;
          removeLock(lock.staffId, lock.date);
        }
      },
      error: (error) => console.error("delete lock sub error:", error),
    });

  return () => {
    createSub.unsubscribe();
    updateSub.unsubscribe();
    deleteSub.unsubscribe();
  };
}, [targetMonth, upsertLock, removeLock]);
```

---

## 自己イベント除外パターン

楽観的更新で既に UI に反映済みの変更が Subscription でも届くため、自分の操作によるイベントを必ず除外する。

```typescript
const handleRealtimeEvent = (record: ShiftRequestData, staffId: string) => {
  // 自己イベント除外：楽観的更新との二重反映を防ぐ
  if (record.updatedBy === currentUserId) return;

  // 他ユーザーの変更をローカル状態に反映
  updateLocalState(record);
  notifyAutoSyncReceived(); // DataSyncStatus を更新
};
```

**参照実装**: `src/features/shift/collaborative/hooks/useCollaborativeShiftData.ts:562`

---

## 楽観的更新フロー

```
1. applyShiftCellUpdateToMap()  → UI に即座に反映
2. pendingChangesRef に保留中の変更を記録
3. persistShiftUpdate() でサーバーに永続化
   ├─ 成功: notifySaveCompleted()、確定値で再マップ更新
   └─ 失敗: prevMap にロールバック、notifySaveFailed()
4. 他ユーザーからの Subscription イベント（自己除外後）でさらに上書き
```

### バージョン競合（ConditionalCheckFailed）の処理

```typescript
import { isConditionalCheckFailed } from "@shared/api/graphql/concurrency";

try {
  await graphqlClient.graphql({
    query: updateShiftRequest,
    variables: { input: { ...data, expectedVersion, nextVersion } },
    authMode: "userPool",
  });
} catch (error) {
  if (isConditionalCheckFailed(error)) {
    // ConflictResolutionDialog を開く（暗黙上書き禁止）
    openConflictDialog({ localData, serverData });
  } else {
    notifySaveFailed(buildShiftErrorMessage(error));
  }
}
```

**参照ファイル**: `src/shared/api/graphql/concurrency.ts`

---

## DataSyncStatus 状態機械

**型定義**: `src/features/shift/collaborative/types/collaborative.types.ts`

```
idle
 ├─ 保存開始 → saving
 └─ 他ユーザーのイベント受信 → synced → (3秒後) → idle

saving
 ├─ 保存完了 → saved → (3秒後) → idle
 └─ 保存失敗 → error（ユーザーが clearSyncError するまで保持）

error → clearSyncError() → idle
```

| ステータス | UI 表現 |
|---|---|
| `idle` | 非表示 / 「未同期」 |
| `saving` | 「保存中」（進行中インジケータ） |
| `syncing` | 「同期中」（進行中インジケータ） |
| `saved` | 「保存完了」（約 3 秒表示後 idle へ） |
| `synced` | 「同期完了」（約 3 秒表示後 idle へ） |
| `error` | 「エラー」（色だけでなくテキスト＋アイコンで表現） |

**`useShiftSync` の公開 API** (`src/features/shift/collaborative/hooks/useShiftSync.ts`):

```typescript
const {
  dataStatus,           // DataSyncStatus
  isSyncing,            // boolean
  syncError,            // string | null
  triggerSync,          // () => Promise<void>  手動同期（二重実行防止済み）
  notifyAutoSyncReceived,  // Subscription 受信時に呼ぶ
  notifySaveStarted,    // 保存開始時に呼ぶ
  notifySaveCompleted,  // 保存完了時に呼ぶ
  notifySaveFailed,     // 保存失敗時に呼ぶ (error: string)
  clearSyncError,       // エラークリア
  lastSyncedAt,         // number (timestamp)
} = useShiftSync({ onManualSync });
```

**最終同期日時の表示形式**: `YYYY/MM/DD HH:mm:ss`（未受信時は `未同期` を明示）

---

## 型の正規化パターン

自動生成型（`APITypes.OnCreateShiftRequestSubscription` 等）からアプリ内カスタム型へ変換する正規化関数を必ず挟む。自動生成型を直接 UI 層に流さない。

```typescript
// 自動生成型 → カスタム型への変換
import { normalizeShiftRequest } from "../lib/shiftTransformers";
// 参照: src/features/shift/collaborative/lib/shiftTransformers.ts

const record = normalizeShiftRequest(data.onCreateShiftRequest);
```

---

## メモリリーク防止チェックリスト

- [ ] `useEffect` のクリーンアップ関数で **全 subscription に `sub.unsubscribe()` を呼ぶ**
- [ ] 配列をループして購読する場合は `forEach` でまとめて解除する
- [ ] `statusTimerRef` 等の setTimeout/setInterval は `clearTimeout` / `clearInterval` でクリアする
- [ ] `staffIds` 配列のような参照が変わりやすい依存は `join()` した文字列キーに変換してから useEffect 依存配列に渡す（不要な再購読防止）

---

## エラーハンドリング方針

| エラー種別 | 対応 |
|---|---|
| Subscription の `error` コールバック | `console.error` のみ。Amplify が自動で WebSocket 再接続する |
| 保存時の `ConditionalCheckFailed` | `ConflictResolutionDialog` を開く（暗黙上書き禁止） |
| ネットワークエラー / 認証エラー | `buildShiftErrorMessage()` でメッセージを生成し `notifySaveFailed()` |
| 同期エラー | `error` ステータスを保持し、ユーザー操作でクリア |

---

## 既存の参照実装

| 概念 | ファイルパス |
|---|---|
| Subscription 購読・自己除外 | `src/features/shift/collaborative/hooks/useCollaborativeShiftData.ts:550-643` |
| DataSyncStatus 状態管理 | `src/features/shift/collaborative/hooks/useShiftSync.ts` |
| 編集ロック（3 種 subscription） | `src/features/shift/collaborative/hooks/useShiftEditLocks.ts:272-353` |
| 型定義 | `src/features/shift/collaborative/types/collaborative.types.ts` |
| データ正規化 | `src/features/shift/collaborative/lib/shiftTransformers.ts` |
| 競合検出ユーティリティ | `src/shared/api/graphql/concurrency.ts` |
| Subscription 定義（自動生成） | `src/shared/api/graphql/documents/subscriptions.ts` |
| ガードレール仕様 | `.github/instructions/shiftCollaborative.instructions.md` |
