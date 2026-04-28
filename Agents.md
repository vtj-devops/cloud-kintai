# Agents.md

## 基本ルール

- 英語で考えて、日本語で説明してください。
- コミットメッセージは英語で書く
- push 前に `npm run typecheck` が `.githooks` で自動実行される

## 開発コマンド

```bash
npm start          # 開発サーバー起動 (Vite)
npm run build      # 本番ビルド
npm run lint       # ESLint
npm run typecheck  # TypeScript 型チェック（tsc --noEmit）
npm run test:unit  # Jest ユニットテスト
npm run test:watch # Jest ウォッチモード

# 特定ファイルのテスト
npx jest src/path/to/file.test.tsx

# E2E（初回はブラウザインストールが必要）
npx playwright install --with-deps
npm run test:e2e:setup              # 認証状態を playwright/.auth/ に生成
npm run test:e2e -- smoke-test --project=chromium-staff
```

## 実装時の重要制約

- `src/shared/api/graphql/` と `src/ui-components/` は Amplify 自動生成のため手動編集禁止
- MUI コンポーネントの新規直接 import は禁止（`src/shared/ui/` の共通 UI を使う）
- スタイリングは MUI `sx` を主軸、Tailwind は補助、新規 SCSS は作らない
- デザイントークンは `designTokenVar()` 経由で参照する
- フォームは React Hook Form + Zod を基本にする

## アーキテクチャ概要

### レイヤー構成（FSD ベース）

依存方向: `pages` → `processes` → `features` → `entities` → `shared`

| レイヤー    | パス             | 役割                                                                                    |
| ----------- | ---------------- | --------------------------------------------------------------------------------------- |
| `pages`     | `src/pages/`     | ルート単位のページコンポーネント                                                        |
| `processes` | `src/processes/` | 複数ページをまたぐ業務フロー（例: `office-access`）                                     |
| `features`  | `src/features/`  | 1画面以下の機能単位（`ui/`, `model/`, `lib/` を持つ）                                   |
| `entities`  | `src/entities/`  | ドメイン層：型・API クライアント・ビジネスロジック（例: `attendance`, `shift`, `user`） |
| `shared`    | `src/shared/`    | 横断利用する UI 部品・hooks・lib（`@shared/...` エイリアス経由）                        |
| `widgets`   | `src/widgets/`   | ページ構成要素の大きな UI ブロック（ヘッダー・フッター・スナックバー）                  |

### パスエイリアス

```
@/*       → src/*
@features/* → src/features/*
@entities/* → src/entities/*
@shared/*   → src/shared/*
@pages/*    → src/pages/*
@processes/* → src/processes/*
```

### バックエンド

AWS Amplify (AppSync / GraphQL + Cognito)

### 状態管理

- グローバル状態: Redux Toolkit + React Redux（スナックバー等）
- 認証・設定は `src/context/` 配下の Context（`AuthContext`, `AppConfigContext`, `ThemeContext` 等）

### デザインシステム

MUI v6 + Tailwind CSS + SCSS の併用。デザイントークンは `src/shared/designSystem/` で管理し、CSS 変数として注入する（`designTokenVar()` で参照）。`src/shared/ui/layout/PageSection.tsx` がページ内カードレイアウトの基本単位。

## 主要機能エリア

### 管理者画面 (`/admin`)

- `AdminDashboard.tsx`: ヘッダーメニュー（`AdminMenu`）＋コンテンツ（`Outlet`）の2ペイン構成。分割表示モード（`SplitViewProvider`）あり。
- `AdminMasterLayout.tsx`: 設定系サイドバー付きレイアウト（`/admin/master/**`）。
- 管理メニュー項目は `src/features/admin/layout/model/useHeaderMenu.ts` で定義。

### シフト共同編集 (`/shift/collaborative`)

- GraphQL Subscription（`onCreateShiftRequest` + `onUpdateShiftRequest` の両方）による複数ユーザーのリアルタイム同期。
- 同期状態は `useShiftSync` と `DataSyncStatus`（`idle/saving/syncing/saved/synced/error`）で管理。
- `updatedBy === currentUserId` の自己イベントは除外（楽観的更新との二重反映防止）。
- テーブル UI は `VirtualizedShiftTable` 前提。
- 競合解決は `ConflictResolutionDialog` 経由（暗黙上書き禁止）。

### 勤怠管理

- 打刻: `src/pages/Register.tsx`（出勤前/勤務中/休憩中/勤務終了）
- スタッフ向け一覧: `src/pages/attendance/list/AttendanceListPage.tsx`
- 編集: `src/pages/attendance/edit/AttendanceEdit.tsx`（スタッフ）/ `src/pages/admin/AdminAttendanceEditor.tsx`（管理者）
- 勤怠ステータス判定ロジック: `src/lib/AttendanceState.ts`

### ワークフロー（申請・承認）

- スタッフが勤怠修正申請等を行い、管理者が承認・否認するフロー。
- 一覧: `src/pages/workflow/list/Workflow.tsx` / 詳細: `src/pages/workflow/detail/WorkflowDetail.tsx`
- 管理者側: `src/pages/admin/AdminWorkflow/`
- `src/features/workflow/` に承認タイムライン（`WorkflowApprovalTimeline`）・コメントスレッド（`WorkflowCommentThread`）・詳細パネル（`WorkflowDetailPanel`）を集約。

### 日報

- スタッフ向け: `src/pages/attendance/daily-report/DailyReport.tsx`
- 管理者向け一覧: `src/pages/admin/AdminDailyReport/AdminDailyReport.tsx` / 詳細: `AdminDailyReportDetail.tsx`

### オフィス機能

- オフィス入退館フローは `src/processes/office-access/` でオーケストレーション。
- QR コード打刻: `src/pages/office/qr/OfficeQrPage.tsx`（QR 生成）/ `src/pages/office/qr-register/OfficeQrRegisterPage.tsx`（QR 読取打刻）
- オフィスレイアウト表示: `src/pages/office/layout/OfficeLayoutPage.tsx`

## 共通 UI パターン

- **ページレイアウト**: `src/shared/ui/layout/PageSection.tsx` がカード型レイアウトの基本単位。`Page` / `PageContent` でラップする。
- **ボタン・ダイアログ**: MUI を直接使わず `AppButton` / `AppIconButton` / `AppDialog` / `ConfirmDialog`（`src/shared/ui/`）を使う。
- **フォーム**: React Hook Form + Zod。テキスト入力は `RHFTextField`、時刻入力は `TimeInput` を使う。
- **デザイントークン**: CSS 変数は `designTokenVar()` 経由で参照（`src/shared/designSystem/`）。

## 詳細仕様ドキュメント

機能ごとの詳細仕様は `.github/instructions/` に配置：

| ファイル                                  | 対象                                         |
| ----------------------------------------- | -------------------------------------------- |
| `attendanceEdit.instructions.md`          | 勤怠編集（定型入力・バリデーションルール等） |
| `attendanceList.instructions.md`          | 勤怠一覧・ステータス判定                     |
| `register.instructions.md`                | 打刻ページ・直行直帰                         |
| `shift.instructions.md`                   | シフト機能全般                               |
| `shiftCollaborative.instructions.md`      | シフト共同編集のガードレール                 |
| `dailyReport.instructions.md`             | 日報                                         |
| `amplifyGraphqlGenerated.instructions.md` | 自動生成ファイルの扱い                       |

## 自動生成ファイル（編集禁止）

- `src/shared/api/graphql/**`
- `src/ui-components/**`
- `src/aws-exports.js`（`amplify pull` で生成）。ソースツリー（git worktree）使用時はメインリポジトリのファイルをリンクして使用する
