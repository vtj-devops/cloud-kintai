# クラウド勤怠

社内向けシステムとして誕生した勤怠管理システムです。

## 開発オンボーディング

### 1 初回セットアップ

必要なツール

- Node.js 22 LTS 以上
- npm 10 以上
- `nvm` 利用時はリポジトリ直下で `nvm use` を実行

初回実行コマンド

```bash
nvm use
npm ci
```

`npm ci` 実行時に `prepare` スクリプトで Git hooks を自動有効化します。  
手動で有効化する場合は次を実行してください。

```bash
npm run hooks:install
```

### 2 Amplify 設定の取得

`src/aws-exports.js` は Git 管理対象外のため、初回セットアップ時に `amplify pull` で生成してください。

```bash
# appId / envName は管理者に確認した値を指定
npx @aws-amplify/cli pull --appId <your-app-id> --envName <your-env-name>
```

補足

- 実行時に AWS 認証情報が必要です（`aws configure` 済みのプロファイルなど）
- `appId` / `envName` が不明な場合は、必ずプロジェクト管理者に確認してください

### 3 環境変数

アプリ起動や一部機能で `VITE_` 系の環境変数を参照します。  
ローカル実行時は `.env.example` をもとに `.env.local` を作成してください。

```bash
cp .env.example .env.local
```

開発サーバー起動で最低限必要なキー

```bash
VITE_BASE_PATH=http://localhost:5173
VITE_TOKEN_SECRET=local-secret
```

補足

- `VITE_STANDARD_REGISTER_DISABLE` などの追加キーは `.env.example` を参照してください
- E2E テストを実行する場合は `PLAYWRIGHT_` 系の環境変数も設定してください

### 4 開発サーバー起動

```bash
npm start
```

`npm start` は Vite の開発サーバーを起動します。  

### 5 E2E 最短実行（smoke-test）

Playwright の初回実行時はブラウザをインストールしてください。

```bash
npx playwright install --with-deps
```

`smoke-test` 実行前に、`.env.local` へ次の値を設定します（値は管理者に確認）。

```bash
VITE_BASE_PATH=http://localhost:5173
PLAYWRIGHT_LOGIN_EMAIL=
PLAYWRIGHT_LOGIN_PASSWORD=
PLAYWRIGHT_ADMIN_EMAIL=
PLAYWRIGHT_ADMIN_PASSWORD=
PLAYWRIGHT_OUT_USER_EMAIL=
PLAYWRIGHT_OUT_USER_PASSWORD=
PLAYWRIGHT_LAZY_USER_EMAIL=
PLAYWRIGHT_LAZY_USER_PASSWORD=
```

最短確認コマンド

```bash
npm run test:e2e --project=setup
npm run test:e2e -- smoke-test --project=chromium-staff
```

### 6 最初の成功体験

次の順に実行すると、ローカル開発の基本導線を一通り確認できます。

```bash
npm run lint
npm run typecheck
npm run test:unit
```

### 7 最初の作業チケットで見るファイル

初回は次の順で読むと、画面 ルーティング 機能分割の流れをつかみやすいです。

- `src/router.tsx` 画面遷移とルート定義の入口
- `src/pages/admin/AdminShiftSettings/AdminShiftSettings.tsx` 管理画面の実装例
- `src/features/README.md` 機能単位の責務 例 `features/admin/configManagement`
- `src/entities/README.md` ドメイン層の責務 例 `entities/attendance`
- `src/shared/README.md` 共通部品の責務 例 `shared/ui/form/RHFTextField.tsx`
- `src/widgets/README.md` ページ構成要素の責務 例 `widgets/layout/header`
- `src/processes/README.md` 複数ページをまたぐ業務フローの責務 例 `processes/office-access`

### 8 初回PRチェックリスト

PR 作成前に次を確認してください。

- コード削減作業では次の順で実行する（実務標準）  
  1. `npm run lint`  
  2. `npm run typecheck`  
  3. 変更箇所に対する targeted Jest（例: `npm run test:unit -- src/features/xxx/__tests__/yyy.test.tsx`）  
  4. 必要時のみ広域 Unit（`npm run test:unit`）
- 再利用用スクリプト
  - `npm run validate:reduction`（lint -> typecheck）
  - `npm run validate:reduction:targeted -- src/path/to/file.test.tsx`（lint -> typecheck -> targeted Jest）
  - `npm run validate:reduction:unit`（lint -> typecheck -> unit 全体）
- 変更した画面の表示崩れがないこと（PC とモバイルの主要表示）
- 既存機能への影響がないこと（最低1つの関連画面で動作確認）

### UI 実装ルール（運用）

- 新規実装では `@mui/material` / `@mui/icons-material` / `@mui/x-*` を追加しない
- 既存 MUI 利用箇所を改修する場合は、可能な限り TailwindCSS ベースへ寄せる
- MUI を残す必要がある場合は、PR に理由と将来の置換方針を明記する

### リファクタ後のレビュー基準（抜粋）

- **コンポーネント/Hook 分割**: 1ファイルが目安 200 行超、または副作用が複数系統に増えたら `ui` と `model/hooks` へ分割する
- **テスト重複防止**: 同じ前提データを3回以上書く場合は `@shared/test-utils` の factory かローカル helper に集約し、分岐ケースは `test.each` を優先する
- **MUI/SCSS 移行安全策**: 既存 MUI を触るPRは「ラッパー利用へ置換した箇所」と「未置換理由」を明記する。SCSSを触った場合は差分を `sx + designTokenVar()` へ移し、新規 SCSS 追加はしない

## 初回30分チェックリスト

```bash
# 1) 依存関係インストールと hooks 有効化
npm ci

# 2) Amplify 設定取得（値は管理者に確認）
npx @aws-amplify/cli pull --appId <your-app-id> --envName <your-env-name>

# 3) 環境変数ファイル作成
cp .env.example .env.local

# 4) アプリ起動
npm start

# 5) 静的チェック
npm run lint
npm run typecheck

# 6) 単体テスト
npm run test:unit

# 7) E2E 最短確認
npx playwright install --with-deps
# `http://localhost:5173` が起動中なら Playwright がそのまま再利用する
# 未起動なら Playwright がローカルサーバーを自動起動する
npm run test:e2e --project=setup
npm run test:e2e -- smoke-test --project=chromium-staff
```

成功条件（目安）

- `npm start`: アプリが起動し、ログイン画面へアクセスできる
- `npm run lint` / `npm run typecheck`: エラー 0 件で完了
- `npm run test:unit`: 失敗なしで完了
- `npm run test:e2e --project=setup`: `playwright/.auth/` に認証状態ファイルが生成される
- `npm run test:e2e -- smoke-test --project=chromium-staff`: 全テストが通る

`PLAYWRIGHT_BASE_URL` を指定して実行した場合は、その URL を使ってテストし、Playwright の `webServer` は起動しません。

## 開発ドキュメントサイト（Docusaurus）

Docusaurus ベースのドキュメントサイトの実体は `docs-site/` 配下にあります。

初回は依存関係をインストールしてください。

```bash
cd docs-site
npm install
```

リポジトリルートから実行する場合:

```bash
npm run docs:start
npm run docs:build
npm run docs:serve
npm run docs:search-preview
```

`npm run docs:start` は編集向けの開発サーバーです。検索プラグインの仕様により、開発モードでは検索インデックスが無効なため、検索時に警告が表示されます。

サイト内検索の挙動を確認する場合は、本番ビルド経由で次を実行してください。

```bash
npm run docs:search-preview
```

このコマンドは `docs:build` 後に `docs:serve` を起動し、検索インデックス付きの状態で確認できます。

## よくある詰まりどころ

### `Cannot find module './aws-exports'` が出る

`src/aws-exports.js` が未生成の状態です。  
`amplify pull` を実行して設定を取得してください。

```bash
npx @aws-amplify/cli pull --appId <your-app-id> --envName <your-env-name>
```

### `npm WARN EBADENGINE` が出る

Node.js 23 系以上で `npm ci` / `npm install` を実行すると `jest@30` 由来の `npm WARN EBADENGINE` が出る場合があります。  
推奨は Node.js 22 LTS への切り替えです。やむを得ず 23 系を使う場合は次のいずれかで抑止できます。

```bash
# 一時的にエンジンチェックを外す
npm_config_engine_strict=false npm ci

# もしくはグローバル設定
npm config set engine-strict false
```

### `browserType.launch: Executable doesn't exist` が出る

Playwright ブラウザが未インストールの状態です。  
次を実行してブラウザをインストールしてください。

```bash
npx playwright install --with-deps
```

### `The search index is only available when you run docusaurus build!` が出る

`npm run docs:start` では開発モードのため、検索インデックスが有効化されません。
検索確認時は次を実行してください。

```bash
npm run docs:search-preview
```
