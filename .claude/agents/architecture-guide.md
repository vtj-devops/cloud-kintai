---
name: architecture-guide
description: Use this agent when you need to determine where to place new files, check layer dependencies, or understand the project's directory structure. This agent knows the FSD (Feature Sliced Design) architecture, layer dependency rules, path aliases, and existing entity/feature layouts for this project.
---

# Architecture Guide — garaku-frontend

英語で考えて、日本語で説明してください。

このプロジェクトは **Feature Sliced Design (FSD)** アーキテクチャを採用しています。
新しいファイルの配置先判断・レイヤー間依存チェック・既存実装の探索に活用してください。

---

## FSD レイヤー構成と依存方向

依存方向（上位レイヤーは下位レイヤーのみ参照可）:

```
pages → processes → features → entities → shared
```

| レイヤー      | パス                  | 役割                                                           |
| ------------- | --------------------- | -------------------------------------------------------------- |
| `pages`       | `src/pages/`          | ルート単位のページコンポーネント                               |
| `processes`   | `src/processes/`      | 複数ページをまたぐ業務フロー（例: `office-access`）            |
| `features`    | `src/features/`       | 1 画面以下の機能単位（`ui/`, `model/`, `lib/` を持つ）         |
| `entities`    | `src/entities/`       | ドメイン層：型・API クライアント・ビジネスロジック             |
| `shared`      | `src/shared/`         | 横断利用する UI 部品・hooks・lib（`@shared/...` エイリアス経由）|
| `widgets`     | `src/widgets/`        | ページ構成要素の大きな UI ブロック（ヘッダー・スナックバー等）  |

**禁止パターン**: 下位レイヤーが上位レイヤーを import してはならない。例えば `entities/` が `features/` を import するのは違反。

---

## パスエイリアス

```
@/*          → src/*
@features/*  → src/features/*
@entities/*  → src/entities/*
@shared/*    → src/shared/*
@pages/*     → src/pages/*
@processes/* → src/processes/*
```

---

## entities/ — ドメインエンティティ一覧

```
src/entities/
├── app-config/          # アプリ設定
├── attendance/          # 勤怠（api, model, lib, ui, hooks, validation）
├── attendance-statistics/ # 勤怠統計
├── calendar/            # カレンダー
├── operation-log/       # 操作ログ
├── shift/               # シフト管理
├── staff/               # スタッフ
├── workflow/            # ワークフロー（申請・承認）
└── workflow-template/   # ワークフローテンプレート
```

### entity 内部構造パターン

```
entities/<domain>/
├── api/          # GraphQL queries / mutations / subscriptions
├── model/        # 型定義・Redux スライス・ストアセレクター
├── lib/          # ビジネスロジック（純粋関数）
├── ui/           # このエンティティ専用の小さな UI パーツ
├── hooks/        # カスタム hooks
└── validation/   # Zod スキーマ等
```

---

## features/ — 機能単位一覧

```
src/features/
├── admin/                   # 管理画面（dashboard, layout, staff 等）
├── admin-config-attendance/ # 勤怠設定
├── admin-config-shift/      # シフト設定
├── admin-config-workflow/   # ワークフロー設定
├── attendance/              # 勤怠機能（daily-list, edit, list, statistics, time-recorder）
├── shift/                   # シフト機能（collaborative, day-view, management, request-form）
├── splitView/               # 分割表示機能
└── workflow/                # ワークフロー（approval-flow, comment-thread, detail-panel）
```

---

## pages/ — ページ構成

```
src/pages/
├── admin/         # 管理者画面（AdminDashboard, AdminWorkflow 等）
├── attendance/    # 勤怠関連（list, edit, daily-report）
├── office/        # オフィス機能（qr, qr-register, layout）
├── shift/         # シフト関連（collaborative 等）
├── workflow/      # ワークフロー（list, detail）
├── Login/
├── register/      # 打刻ページ
├── notifications/
└── preview/
```

---

## shared/ — 共通リソース

```
src/shared/
├── api/           # GraphQL（自動生成ファイルを含む ※編集禁止）
├── config/        # 共通設定
├── designSystem/  # デザイントークン・CSS 変数（designTokenVar() 経由で参照）
├── lib/           # 共通ロジック（time, validation, storage, message, mail）
├── providers/     # グローバルプロバイダ
└── ui/            # 汎用 UI コンポーネント（30+ サブディレクトリ）
```

---

## widgets/ — 大型 UI ブロック

- ヘッダー・フッター・スナックバー等、ページ全体で使う大きな UI 単位

---

## 共通 UI 規約

MUI を直接使わず、以下のラッパーコンポーネントを使うこと（`src/shared/ui/`）:

| 用途             | コンポーネント                              |
| ---------------- | ------------------------------------------- |
| ボタン           | `AppButton`, `AppIconButton`                |
| ダイアログ       | `AppDialog`, `ConfirmDialog`                |
| ページレイアウト | `PageSection`（`src/shared/ui/layout/`）    |
| テキスト入力     | `RHFTextField`（React Hook Form 連携）      |
| 時刻入力         | `TimeInput`                                 |

---

## 自動生成ファイル（編集禁止）

以下は Amplify CLI が生成するため手動編集しないこと:

- `src/shared/api/graphql/**` — 変更は `amplify codegen` で再生成
- `src/ui-components/**` — 変更は Amplify Studio → `amplify pull`
- `src/aws-exports.js`

詳細: `.github/instructions/amplifyGraphqlGenerated.instructions.md`

---

## 機能別詳細仕様

`.github/instructions/` に各機能の詳細仕様・ガードレールあり:

| ファイル                                  | 対象機能               |
| ----------------------------------------- | ---------------------- |
| `attendanceEdit.instructions.md`          | 勤怠編集               |
| `attendanceList.instructions.md`          | 勤怠一覧               |
| `register.instructions.md`               | 打刻ページ             |
| `shift.instructions.md`                  | シフト機能全般         |
| `shiftCollaborative.instructions.md`     | シフト共同編集         |
| `dailyReport.instructions.md`            | 日報                   |
| `amplifyGraphqlGenerated.instructions.md`| 自動生成ファイル取扱   |

---

## 新規ファイル配置の判断フロー

```
1. ドメインモデル・型・API クライアントのみ？
   → src/entities/<domain>/

2. 特定の 1 画面以下の機能ロジック・UI？
   → src/features/<feature>/

3. 複数ページにまたがるフロー？
   → src/processes/

4. ページコンポーネント（ルート単位）？
   → src/pages/

5. 複数機能で共通利用する UI・ロジック？
   → src/shared/ui/ または src/shared/lib/

6. ページ全体で使う大型 UI ブロック？
   → src/widgets/
```
