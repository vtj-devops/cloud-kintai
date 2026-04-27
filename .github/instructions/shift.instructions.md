---
applyTo: "src/pages/shift/**,src/features/shift/**"
---

# シフト機能

従業員の勤務スケジュールを管理する機能群。管理者・スタッフそれぞれに画面があり、AppConfig の設定値によって「通常モード」と「共同編集モード」が切り替わる。

## モード切り替えアーキテクチャ

シフト管理・申請の両ページは、AppConfig の 2 つのフラグによって表示する画面が変わる。

| フラグ | デフォルト | 役割 |
|--------|-----------|------|
| `shiftDefaultMode` | `"normal"` | `"collaborative"` にすると共同編集モードに切り替わる |
| `shiftCollaborativeEnabled` | `false` | スタッフ向け申請ページで共同編集を有効にする追加スイッチ |

```
pages/shift/management/index.tsx
  getShiftDefaultMode() === "collaborative"
    → ShiftCollaborativePage（共同編集）
    → ShiftManagementBoard（通常管理）

pages/shift/request/index.tsx
  getShiftDefaultMode() === "collaborative" && getShiftCollaborativeEnabled()
    → ShiftCollaborativePage（共同編集）
    → ShiftRequestForm（通常申請）
```

両ページとも「どちらのモードで動くか」が実行時に決まるため、**どちらかの実装を変更するときはもう一方への影響も確認すること**。

## 画面・機能一覧

### 管理者向け

| 画面 | ページ | Feature |
|------|--------|---------|
| シフト管理（通常） | `pages/shift/management/` | `features/shift/management/` |
| シフト共同編集 | `pages/shift/collaborative/` | `features/shift/collaborative/` |
| シフト計画管理 | `pages/admin/ShiftPlanManagement/` | — |
| シフト設定 | `pages/admin/AdminShiftSettings/` | — |

### スタッフ向け

| 画面 | ページ | Feature |
|------|--------|---------|
| 希望シフト申請（通常） | `pages/shift/request/` | `features/shift/request-form/` |
| 希望シフト申請（共同編集） | `pages/shift/request/` | `features/shift/collaborative/` |
| スタッフシフト一覧 | `pages/shift/staff/` | `features/shift/staff-shift-list/` |
| 日次ビュー | `pages/shift/day-view/` | `features/shift/day-view/` |

## アクセス制御

- `ShiftAccessGuard`（`pages/shift/ShiftAccessGuard.tsx`）がスタッフページを保護する。勤務形態が「シフト勤務」でないスタッフはシフト画面にアクセスできない。
- 確定（ロック）・確定解除・強制ロック解放は `ADMIN` / `STAFF_ADMIN` / `OWNER` のみ実行可能。スタッフロールにはボタンを表示しない。

## 通常モード（`management/` / `request-form/`）の概要

通常モードは GraphQL Subscription を使わず、画面操作ごとに AppSync へ単発 Mutation を発行してデータを更新する。リアルタイム同期・Undo/Redo・編集ロック・変更履歴などの機能はない。

- `ShiftManagementBoard`：管理者が月単位でスタッフのシフトを閲覧・編集するテーブル UI。
- `ShiftRequestForm`：スタッフが当月の希望シフトをカレンダー形式で入力・提出するフォーム。マイパターン（`shiftPatternStorage`）登録機能を持つ。

## 共同編集モードの概要

→ 詳細は `shiftCollaborative.instructions.md` を参照。

- 複数ユーザーが同じシフト表を同時編集できるリアルタイム協調編集機能。
- AppSync GraphQL Subscription によるリアルタイム同期、楽観的更新、Undo/Redo、編集ロック、変更履歴、在席表示（プレゼンス）などを含む。

## シフトグループ

管理者がスタッフをグループ単位で管理するための設定。`AdminShiftSettings` で作成・編集し、スタッフ管理画面で各スタッフに割り当てる。

- 最小・最大人数の範囲指定や固定人数の設定が可能。
- 設定は `AppConfig` ではなく DynamoDB に独立して保存される。

## `ShiftRequestData` と DB の関係

スタッフごとの月次シフトデータは `ShiftRequest` として DynamoDB に保存される。

- `entries`：日付ごとの状態（`status` / `isLocked`）の配列。
- `histories`：変更のたびに追記されるスナップショット配列（全セルの状態を全件保持）。共同編集モードでの変更履歴表示に使用する。
- `comments`：セル単位のコメント（共同編集モードのみ利用）。
