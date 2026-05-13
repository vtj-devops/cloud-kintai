# AWS Amplify Gen 1 メンテナンスモード対応計画（garaku-frontend）

## 現状

- フロントエンドは Amplify JS v6 系を使用中（`aws-amplify`, `@aws-amplify/api`, `@aws-amplify/ui-react`）。
- バックエンド定義は Amplify Gen 1（CLI + CloudFormation）構成。
- 主要リソース:
  - AppSync GraphQL API（`garakufrontend`）
  - API Gateway + Lambda（`AdminQueries`）
  - Cognito User Pool / Identity Pool
  - S3 Storage
  - Lambda Functions（`AdminQueriesf7a7d2e5`, `garakuSendMail`）
  - Amplify Hosting
- コード上の Amplify 依存は広範囲。
  - `src/ui-components/` 配下（Amplify Studio 自動生成）に Amplify UI / API 呼び出し多数
  - `src/shared/api/amplify/graphqlClient.ts` を経由した GraphQL 呼び出しが多数
  - `src/shared/api/amplify/adminQueriesClient.ts` に REST (`AdminQueries`) 依存

## 前提と方針

- Amplify Gen 1 は「即時停止」ではなく「メンテナンスモード」であるため、計画移行が可能。
- ただし新機能投入や運用継続性を考慮し、**Gen 2 もしくは IaC 主導（CDK/Terraform）への移行を 2026 年内に完了**させる。
- 移行は Big Bang を避け、**フロント互換を維持した段階移行**とする。

## 目標

1. Gen 1 依存を段階的に解消し、運用リスクを低減する。
2. 認証（Cognito）・API（AppSync/REST）・Storage（S3）の挙動を現行同等で維持する。
3. 既存の Unit/E2E テストと監視を強化して、移行時の回帰を最小化する。

## スコープ

### 対象

- Amplify Gen 1 backend 定義（`amplify/backend/**`）
- Amplify 初期化と API クライアント層（`src/index.tsx`, `src/shared/api/amplify/**`）
- GraphQL schema / codegen 運用
- AdminQueries（API Gateway + Lambda）
- Hosting 設定

### 非対象（初期フェーズ）

- 画面仕様変更
- 大規模な UI 再設計
- ドメインロジック再設計

## 推奨アーキテクチャ移行先

- 第一候補: **Amplify Gen 2**（TypeScript 定義）
  - AppSync + Cognito + Storage を Gen 2 管理へ寄せる
  - 必要に応じて CDK 連携で不足機能（例: 特殊な API Gateway/Lambda 構成）を補完
- 第二候補: **CDK/Terraform への直接移行**
  - Amplify Hosting のみ残し、バックエンドを独立 IaC 化

本プロジェクトでは既存 Amplify 資産が多く、まずは Gen 2 へ寄せるのが移行コストと継続開発のバランスが良い。

## 手順

### 1. 影響調査と凍結ルール確定（1-2 週）

- Amplify Gen 1 への新規 resource 追加を凍結（緊急対応のみ例外）。
- `src/ui-components/**`（自動生成）利用箇所を棚卸しし、残存必要性を分類。
- GraphQL operation の利用一覧（query/mutation/subscription）を確定。
- `AdminQueries` の API 契約（path, request/response, 認可）を仕様化。

成果物:
- 依存マップ
- 移行対象 API 一覧
- 凍結ルール（PR テンプレ追記）

### 2. 土台整備（1 週）

- 環境分離（`dev/stg/prod`）と切替方式を明文化。
- feature flag / endpoint 切替設定を追加（同一フロントで新旧バックエンド切替可能にする）。
- 監視項目定義（エラー率、認証失敗率、GraphQL 失敗率、p95 レイテンシ）。

成果物:
- 切替設計書
- 監視ダッシュボード要件

### 3. バックエンド移行実装（3-6 週）

- Cognito を最優先で移行（ユーザー移行方式を決定: 既存 User Pool 継続 or 新規移行）。
- AppSync schema を Gen 2 側へ移植、resolver/auth ルールを同等化。
- S3 バケットポリシー・権限を再定義。
- `AdminQueries` を以下のいずれかで再構築:
  - Gen 2 + Function
  - CDK 管理 API Gateway + Lambda

成果物:
- 新バックエンド（stg）
- IaC 定義（Gen 2 / CDK）
- データ移行手順書

### 4. フロント接続切替（1-2 週）

- `Amplify.configure()` 入力設定を環境変数ベースに整理。
- `graphqlClient` / `adminQueriesClient` の接続先切替を実装。
- 段階リリース（社内限定 -> 一部ロール -> 全体）を実施。

成果物:
- 切替済みフロント
- ロールバック手順

### 5. 検証・本番移行・Gen 1 廃止（1-2 週）

- 回帰テスト（Unit / E2E smoke + 重点シナリオ）
- 本番カットオーバー（低トラフィック時間帯）
- 監視で安定確認後、Gen 1 リソースを段階停止

成果物:
- 移行完了レポート
- 運用手順更新
- Gen 1 廃止チェックリスト

## 検証

- 静的検証:
  - `npm run lint`
  - `npm run typecheck`
- 単体テスト:
  - `npm run test:unit`
- E2E（最低ライン）:
  - `npm run test:e2e:setup`
  - `npm run test:e2e -- smoke-test --project=chromium-staff`
  - `npm run test:e2e -- smoke-test --project=chromium-admin`
- 非機能:
  - 認証成功率、GraphQL エラー率、API 失敗率、p95 レイテンシ比較（新旧）

## リスクと対策

1. 認証互換性（Cognito 設定差分）
- 対策: 既存 User Pool 継続案を第一に検討し、切替時は段階ロールアウト。

2. GraphQL 認可差分（API_KEY + UserPool の混在）
- 対策: 認可モードごとの統合テストを先行作成。

3. AdminQueries の再現性不足
- 対策: 先に API 契約テストを固定し、実装方式を後追いで置換。

4. 自動生成 UI 依存（`src/ui-components/**`）
- 対策: 生成物に依存した実装は段階縮退し、必要最低限に限定。

## 体制

- Tech Lead: アーキテクチャ決定、移行ゲート管理
- Backend 担当: Gen 2 / IaC 実装、データ移行
- Frontend 担当: クライアント切替、回帰修正
- QA: テスト計画、段階リリース判定

## 完了条件（Done）

- 新バックエンドで本番トラフィックを安定処理できる。
- 重要導線（打刻・勤怠編集・ワークフロー・日報・管理者機能）の E2E が通過。
- Gen 1 backend への依存が運用上不要となり、停止計画が承認済み。

## 直近アクション（今週着手）

1. 移行TFを編成し、凍結ルールを合意
2. `AdminQueries` 契約書（path/権限/レスポンス）を作成
3. GraphQL 利用一覧と認可モード一覧を出力
4. 新環境（stg）で最小構成の Gen 2 PoC を立ち上げ
5. 切替フラグ方式を決定し、フロントに接続層を追加

---

## 公式ガイド準拠の移行手順（実行ランブック）

参照元:
- https://docs.amplify.aws/react/start/migrate-to-gen2/migrate-existing-app/

この章は、公式の Step 0-9 を本リポジトリ向けに実行順へ落とし込んだもの。

### 実値マッピング（garaku-frontend）

- Amplify App ID: `dmghdnhtsemgt`
- 利用中 Gen 1 env: `dev` / `develop` / `main`
- ローカル既定 env（この作業端末）: `dev`
- Git 既定ブランチ: `develop`
- 移行検証の推奨開始点: `develop` env（本番相当へ適用する前に clone で検証）

### 手順

### Step -1: 事前チェック（必須）

1. ツールチェーン確認
```bash
node -v   # 20+
npm -v
```

2. Amplify CLI を v14 系へ
```bash
npm install -g @aws-amplify/cli@^14.4.0
amplify -v
```

3. Gen 1 環境との差分ゼロ確認
```bash
# 例: develop env を対象にする場合
amplify pull --appId dmghdnhtsemgt --envName develop
amplify status   # No Change であること
git diff         # 作業前に差分なしが理想
```

4. IAM 権限追加（Stack Refactor API）
- `cloudformation:CreateStackRefactor`
- `cloudformation:DescribeStackRefactor`
- `cloudformation:ExecuteStackRefactor`
- `cloudformation:GetStackPolicy`
- `cloudformation:SetStackPolicy`
- `cloudformation:DeleteChangeSet`
- `s3:GetBucketVersioning`
- `s3:GetEncryptionConfiguration`

5. CDK bootstrap 済み確認（対象アカウント/リージョン）

6. フロント依存の最終確認
- `aws-amplify` は `^6.16.2` 以上
- `@aws-amplify/ui-react` は v6 系

7. Feature Parity 確認
- 未対応カテゴリがある場合、手動移行タスクを先に起票する

### Step 0: Clone（本番前に複製環境で検証）

```bash
amplify env add
amplify push
```

- 先に clone 環境で end-to-end で移行を通す。
- 注意: import 済みリソースやハードコード ARN があると clone と本番で資源共有になるため、分離確認を実施する。

### Step 1: Assess

```bash
amplify gen2-migration assess
```

- read-only の評価レポートを確認。
- `generate` 未対応: Gen 2 コードへ手動実装。
- `refactor` 未対応: データ移行を別手段で実施。

#### 本リポジトリの assess 結果に対する判断（2026-05-12）

- `custom/customResource1b080f88` のみ未対応（`unknown resource type`）。
- この resource はアプリ本体の CRUD/認証ではなく、AWS Backup/KMS の運用系 custom CDK。
- よって、以下条件を満たす場合は移行を継続可能。
  - Step 3/7 を `--skip-validations` 付きで実行
  - custom リソースは手動移行タスクとして別管理
  - Gen 1 廃止前に custom の移管/保持方針を確定

### Step 1.5: Unsupported custom の手動移行タスク化

対象 resource:
- `customResource1b080f88`

現行実装の要点（`amplify/backend/custom/customResource1b080f88/cdk-stack.ts`）:
- AWS Backup Plan（日次/週次/月次）
- Backup Vault（削除制御ポリシー付き）
- KMS Key/Alias（`alias/amplify-appsync-<env>-key`）
- Tag `user:Stack=<env>` のリソースをバックアップ対象に選択

実施方針（推奨）:
1. Gen 2 側へ同等の CDK 定義を手動移植（`amplify/backend.ts` もしくは分離 CDK スタック）
2. 新旧バックアップ設定の並行稼働期間を設ける
3. リストアテスト成功後に Gen 1 側 custom の停止可否を判断

暫定方針（短期）:
- まず移行本線を進めるため、custom は Gen 1 側に残置
- ただし「Gen 1 完全廃止」の完了条件には含めない（先に custom 移管を終える）

### Step 2: Lock（Gen 1 変更凍結）

```bash
amplify gen2-migration lock
```

- Gen 1 への CI/CD 自動デプロイを停止。
- rollback（必要時のみ）
```bash
amplify gen2-migration lock --rollback
```

### Step 3: Generate（Gen 2 定義生成）

```bash
git checkout -b gen2-main
amplify gen2-migration generate --skip-validations
```

- このコマンドで `amplify/` は Gen 2 定義に置き換わる。
- 生成直後は依存解決をクリーンアップ。

```bash
rm -rf node_modules package-lock.json
npm install
npm install --package-lock-only
```

### Step 4: Post-Generate（手動修正）

1. フロント設定
- Gen 1 の `aws-exports` / `amplifyconfiguration` 依存から、Gen 2 outputs 取り込みへ段階移行。
- `Amplify.configure(...)` は維持しつつ、設定ソースを `amplify_outputs.json` に切替。

2. 本リポジトリ固有対応
- `src/shared/api/amplify/adminQueriesClient.ts` の API 名（`AdminQueries`）が Gen 2 側で変わる場合は追従。
- `src/shared/api/amplify/graphqlClient.ts` の client 初期化は維持し、設定注入のみ更新。

3. Data
- 生成された `amplify/data/resource.ts` の branch 名を実際の Gen 2 ブランチへ修正（例: `gen2-main`）。
- Gen 1 の「無指定 model = public(API_KEY)」挙動に依存している型は、必要に応じて明示 auth を追加。

4. Functions
- CommonJS 形式 Lambda は ESM へ変換（`exports.handler` -> `export async function handler`）。
- Secret は Gen 2 の `secret()` 参照へ更新。

### Step 5: Deploy（Gen 2 ブランチをデプロイ）

```bash
git add .
git commit -m "feat: migrate to gen2"
git push origin gen2-main
```

- Amplify Hosting 側で `gen2-main` ブランチを接続し、デプロイを完了させる。

### Step 6: Functional Tests（最重要）

Refactor 前に必ず実施。

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e:setup
npm run test:e2e -- smoke-test --project=chromium-staff
npm run test:e2e -- smoke-test --project=chromium-admin
```

加えて重点確認:
- サインイン/サインアウト
- GraphQL CRUD
- Subscription リアルタイム更新
- S3 アップロード/ダウンロード
- AdminQueries API（管理系エンドポイント）

### Step 7: Refactor（状態資源を Gen 2 管理へ移管）

1. CloudFormation で Gen 2 root stack 名を特定
- 形式: `amplify-<appId>-gen2main-branch-<suffix>`

2. Refactor 実行
```bash
# 例: develop を移行対象にする場合
git checkout develop
amplify pull --appId dmghdnhtsemgt --envName develop
amplify gen2-migration refactor --to <gen2-root-stack-name> --skip-validations
```

3. 失敗時 rollback
```bash
amplify gen2-migration refactor --to <gen2-root-stack-name> --rollback
amplify gen2-migration lock --rollback
amplify push
```

### Step 8: Post-Refactor（最重要）

```bash
git checkout gen2-main
```

- `amplify/backend.ts` の `postRefactor()` を有効化。
- この設定は移行後も恒久的に維持（外すと以後のデプロイが失敗し得る）。

### Step 9: 再デプロイ

```bash
git add .
git commit -m "fix: post refactor"
git push origin gen2-main
```

- `amplify_outputs.json` の出力値が refactor 後の資源を指すことを確認。

## 移行判定ゲート

1. 事前ゲート
- `assess` で blocker がない、または未対応が `customResource1b080f88` のみで手動移行計画が承認済み
- clone 環境で手順完走済み

2. Refactor 実行ゲート
- Step 6 の検証が完了
- 運用監視（認証/GraphQL/REST/S3）で異常なし

3. Gen 1 廃止ゲート
- Gen 1 stateless 資源へのアクセスがゼロに近い
- CloudFormation の Retain 方針を適用済み
- 手動削除対象（旧 AppSync/API Gateway/Lambda/IAM）を棚卸し済み
- `customResource1b080f88` の移管完了、または Retain 前提で安全に残置できることを確認済み

## このリポジトリの追加注意点

1. `src/ui-components/**` は Amplify 自動生成のため手動編集しない。

2. 既存フロントは `src/index.tsx` で `Amplify.configure(config)` を実行している。
- 設定ファイル形式切替時は、周辺コード（設定キーを直接読む箇所）がないか事前検索する。

3. `AdminQueries` は業務影響が大きいため、移行前に API 契約テストを固定し、移行後に同一ケースで比較する。

4. 生成時に dependency 競合が出る場合がある。
- 特に function ごとの `package.json` 由来依存が root へマージされたときは、衝突解消後に再デプロイする。

5. env 名と Git ブランチ名は一致していないケースがある。
- 本リポジトリは `main` env と `develop` env が共存するため、移行対象 env を毎コマンドで明示する。

6. 主要コマンドの実値例（develop env）
```bash
# 現在の状態同期
amplify pull --appId dmghdnhtsemgt --envName develop

# 評価
amplify gen2-migration assess

# 凍結
amplify gen2-migration lock

# 生成（gen2-main ブランチで）
amplify gen2-migration generate --skip-validations
```
