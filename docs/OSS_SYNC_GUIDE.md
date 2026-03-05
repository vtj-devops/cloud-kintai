# OSS リポジトリへの同期ガイド

このドキュメントは、プライベートリポジトリからOSSリポジトリへコードを同期する際の手順と注意事項をまとめたものです。

## 概要

このプロジェクトは、プライベート版とOSS版の2つのリポジトリで管理されています。OSS版へのコードpushには機密情報の除外と一部ファイルの手動編集が必要です。

## セットアップ

### 初回のみ実行

```bash
# OSS リモートリポジトリを設定
git remote add oss https://github.com/vtj-devops/cloud-kintai.git

# スクリプトに実行権限を付与
chmod +x scripts/sync-to-oss.sh
```

## 同期手順

### 1. 自動処理の実行

```bash
# 同期スクリプトを実行
./scripts/sync-to-oss.sh https://github.com/vtj-devops/cloud-kintai.git main
```

このスクリプトは以下を自動で行います:
- `oss-sync` ブランチの作成
- 機密情報を含むファイルの削除
- OSS用の.gitignoreの適用

### 2. 手動編集が必要なファイル

以下のファイルは **必ず手動で確認・編集** してください:

#### 高優先度（必須）

| ファイル                        | 編集内容                                        |
| ------------------------------- | ----------------------------------------------- |
| `src/amplifyconfiguration.json` | AWS設定を削除または汎用的なダミー値に変更       |
| `src/aws-exports.js`            | 完全に削除またはダミー値に置換                  |
| `README.md`                     | 社内情報・内部リンクを削除、OSS向けの説明を追加 |
| `package.json`                  | `name`, `repository`, `bugs`, `homepage` を更新 |

#### 中優先度（推奨）

| ファイル                  | 編集内容                                 |
| ------------------------- | ---------------------------------------- |
| `.github/workflows/*.yml` | 社内専用のワークフローを削除または汎用化 |
| `amplify/backend/`        | Amplifyの設定から機密情報を削除          |
| `docs/`                   | 社内ドキュメントを削除または汎用化       |
| コメント内の機密情報      | コード内のコメントから社内情報を削除     |

#### 低優先度（確認）

| ファイル          | 編集内容                                  |
| ----------------- | ----------------------------------------- |
| `CONTRIBUTING.md` | OSS向けのコントリビューションガイドを作成 |
| `LICENSE`         | 適切なライセンスを追加                    |
| `.env.example`    | OSS版のサンプル環境変数を作成             |

### 3. 編集例

#### README.mdの編集

```markdown
<!-- 削除: 社内専用情報 -->
<!-- Before -->
## 社内デプロイ手順
AWS環境: https://internal-link.example.com
担当者: xxx@company.com

<!-- After: OSS向けの説明に変更 -->
## Getting Started
このプロジェクトは...
```

#### package.jsonの編集

```json
{
  "name": "@vtj-devops/cloud-kintai",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/vtj-devops/cloud-kintai.git"
  },
  "bugs": {
    "url": "https://github.com/vtj-devops/cloud-kintai/issues"
  },
  "homepage": "https://github.com/vtj-devops/cloud-kintai#readme"
}
```

#### amplifyconfiguration.jsonの編集

```json
{
  "aws_project_region": "REGION",
  "aws_cognito_region": "REGION",
  "aws_user_pools_id": "YOUR_USER_POOL_ID",
  "aws_user_pools_web_client_id": "YOUR_CLIENT_ID"
}
```

### 4. コミット・プッシュ

編集完了後、以下を実行:

```bash
# 変更を確認
git status
git diff

# すべての変更をステージング
git add -A

# コミット
git commit -m "Update for OSS release v1.0"

# OSSリポジトリへプッシュ
git push oss oss-sync:main --force

# 元のブランチに戻る
git checkout feature/ideal-cuckoo
```

## チェックリスト

プッシュ前に以下を確認してください:

- [ ] AWSの認証情報・APIキーが含まれていない
- [ ] 内部URLやIPアドレスが含まれていない
- [ ] 社員の個人情報（名前、メールアドレス）が含まれていない
- [ ] 機密性の高いビジネスロジックが適切に処理されている
- [ ] テスト用のアカウント情報が含まれていない
- [ ] README.mdがOSS向けの内容になっている
- [ ] LICENSEファイルが適切に設定されている
- [ ] コントリビューションガイドが存在する

## トラブルシューティング

### 機密情報を誤ってプッシュした場合

```bash
# 履歴から完全に削除（注意: 破壊的操作）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive-file" \
  --prune-empty --tag-name-filter cat -- --all

# または git-filter-repo を使用（推奨）
git filter-repo --path path/to/sensitive-file --invert-paths
```

### 差分を確認したい場合

```bash
# プライベート版とOSS版の差分を確認
git diff origin/develop oss/main
```

## 定期的な同期

定期的に最新の変更をOSSリポジトリに反映する場合:

```bash
# 1. 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 2. 同期スクリプトを実行
./scripts/sync-to-oss.sh https://github.com/vtj-devops/cloud-kintai.git main

# 3. 手動編集を実行（前回からの差分のみ）
git diff oss/main

# 4. プッシュ
git push oss oss-sync:main
```

## 自動化の検討事項

将来的に自動化できる可能性のある作業:

1. **機密情報の検出**: git-secretsなどのツールで自動検出
2. **変換テンプレート**: 特定のファイルを自動変換するスクリプト
3. **CI/CDパイプライン**: GitHub Actionsでレビュー後の自動同期
4. **差分管理**: 前回同期時からの変更点を自動抽出

## 参考資料

- [GitHub: Managing multiple remotes](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [GitHub Secrets Scanning](https://docs.github.com/en/code-security/secret-scanning)
