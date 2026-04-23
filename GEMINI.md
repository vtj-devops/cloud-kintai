# GEMINI.md - プロジェクト指示コンテキスト

このファイルは、Gemini CLI がこのプロジェクト（クラウド勤怠フロントエンド）で作業する際の主要な指針とコンテキストを提供します。

## プロジェクト概要
- **名称**: クラウド勤怠 (garaku-frontend)
- **用途**: 社内向け勤怠管理・シフト管理システム
- **技術スタック**:
  - **Core**: React 19, TypeScript, Vite
  - **UI**: MUI v6, Tailwind CSS, SCSS, Lucide React
  - **State**: Redux Toolkit (通知系), Context API (認証・設定系)
  - **Form**: React Hook Form, Zod
  - **Backend**: AWS Amplify (GraphQL/AppSync, Cognito)
  - **Testing**: Jest (Unit), Playwright (E2E)

## ドキュメントと情報源
- **開発ドキュメントサイト**: Docusaurus ベースのサイトがあります。
  - 開発者向けガイド (`docs-site/docs/developer/`)
  - 管理者・ユーザー操作マニュアル (`docs-site/docs/admin/`, `docs-site/docs/staff/`)
  - 用語定義 (`docs-site/docs/terminology.md`)
  - 勤務ステータス・タイプ仕様 (`docs-site/docs/work-status-overview.md`, `docs-site/docs/work-type-overview.md`)
- **参照コマンド**: `npm run docs:start` でローカルプレビューが可能です。

## アーキテクチャ (Feature-Sliced Design)
プロジェクトは FSD 構造に従って構成されています。依存関係は常に下方向（pages -> shared）に維持してください。

| レイヤー | パス | 役割 |
| :--- | :--- | :--- |
| `pages` | `src/pages/` | ルート単位のページコンポーネント |
| `processes` | `src/processes/` | 複数ページをまたぐ複雑な業務フロー |
| `features` | `src/features/` | 1画面内の機能単位（ui, model, lib を含む） |
| `entities` | `src/entities/` | ドメイン知識、型、APIクライアント、ビジネスロジック |
| `shared` | `src/shared/` | プロジェクト横断的な UI 部品、Hooks、ユーティリティ |
| `widgets` | `src/widgets/` | ページを構成する大きな UI ブロック（ヘッダー等） |

## 主要コマンド
- `npm start`: 開発サーバー起動 (Vite)
- `npm run build`: 本番用ビルド
- `npm run lint`: ESLint による静的解析
- `npm run typecheck`: TypeScript 型チェック (tsc --noEmit)
- `npm run test:unit`: Jest による単体テスト実行
- `npm run test:e2e`: Playwright による E2E テスト実行
- `npm run docs:start`: Docusaurus ドキュメントサイト起動

## 開発・コーディング規約
### 1. インポートとエイリアス
- `tsconfig.json` で定義されたエイリアスを優先的に使用してください。
  - `@shared/*`, `@entities/*`, `@features/*`, `@pages/*`, `@processes/*`, `@app/*`
- 相対パス（`../`）よりもエイリアスパスの利用を推奨します。

### 2. UI 実装方針
- **新規 MUI コンポーネントの直接インポート禁止**: `import { Button } from '@mui/material'` のように新規に MUI コンポーネントを直接インポートする実装は行わない。代わりに `src/shared/ui/` の共通コンポーネントを使用してください。
- **スタイリング優先順位**: スタイリングは MUI の `sx` prop を primary として使用し、Tailwind CSS は utility クラスとして補助的に使用（レイアウト調整など）する。
- **SCSS は廃止方向**: 既存の SCSS ファイルは段階的に MUI sx / Tailwind へ移行。新規 SCSS ファイルは作成しないでください。
- **既存 MUI の移行**: 既存の MUI 箇所を修正する場合は、少しずつ `src/shared/ui/` ベースへ置き換えることを検討してください。
- **デザイントークン**: 色・スペーシングは `src/shared/designSystem/` のトークンを使用し、`designTokenVar()` を介して CSS 変数を参照してください。

### 3. 自動生成コードの保護
- 以下のディレクトリは Amplify CLI によって自動生成されるため、**手動で編集しないでください**。
  - `src/shared/api/graphql/**`
  - `src/ui-components/**`
  - `src/aws-exports.js` (および `.d.ts`)
- 変更が必要な場合は `amplify pull` または `amplify codegen` を実行してください。

### 4. シフト管理のリアルタイム同期
- シフト共同編集機能は GraphQL Subscription によるリアルタイム同期を行っています。
- 自己発行のイベントによる二重反映を防ぐため、`updatedBy` ID によるフィルタリングを徹底してください。

### 5. バリデーション
- フォームバリデーションには Zod スキーマを使用し、`react-hook-form` の `zodResolver` と統合してください。

## メンテナンス履歴とリファクタリング方針
- 巨大なコンポーネント（例: `ShiftManagementBoard.tsx`）は、積極的に `ui/components/` 配下のサブコンポーネントへ分割してください。
- 複雑な集計ロジックは、フック内ではなく独立した純粋関数（`lib/`）として抽出し、テスト可能にしてください。
- 勤怠ステータスの判定ロジックは `src/features/attendance/list/lib/attendanceStatusUtils.ts` に集約されています。
