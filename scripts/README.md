# OSS 同期スクリプト

このディレクトリには、プライベートリポジトリからOSSリポジトリへコードを同期するためのスクリプトが含まれています。

## スクリプト一覧

### 1. `sync-to-oss.sh`

プライベートリポジトリの内容をOSS用に準備するメインスクリプトです。

**使用方法:**
```bash
./scripts/sync-to-oss.sh <OSS-リポジトリURL> [ブランチ名]
```

**例:**
```bash
./scripts/sync-to-oss.sh https://github.com/vtj-devops/cloud-kintai.git main
```

**機能:**
- OSS用の`oss-sync`ブランチを作成
- 機密情報を含むファイルを自動削除
- OSS用の設定ファイルを適用
- 手動編集が必要なファイルをリストアップ

### 2. `check-oss-security.sh`

OSSリポジトリへプッシュする前にセキュリティチェックを行うスクリプトです。

**使用方法:**
```bash
./scripts/check-oss-security.sh
```

**チェック項目:**
- 機密情報パターンの検出（APIキー、パスワードなど）
- 必須ファイルの存在確認
- README.mdに内部情報が含まれていないか
- package.jsonの設定確認
- AWS設定ファイルが残っていないか
- コミット履歴の簡易チェック

## 推奨ワークフロー

### 初回セットアップ

```bash
# 1. OSSリポジトリをリモートに追加
git remote add oss https://github.com/vtj-devops/cloud-kintai.git

# 2. スクリプトの実行権限を確認
ls -l scripts/*.sh
```

### 定期的な同期

```bash
# 1. 最新のコードを取得
git checkout develop
git pull origin develop

# 2. OSS用の準備
./scripts/sync-to-oss.sh https://github.com/vtj-devops/cloud-kintai.git main

# 3. 手動編集を実施
# (詳細は docs/OSS_SYNC_GUIDE.md を参照)

# 4. セキュリティチェック
./scripts/check-oss-security.sh

# 5. プッシュ
git push oss oss-sync:main

# 6. 元のブランチに戻る
git checkout develop
```

## トラブルシューティング

### 権限エラーが発生する場合

```bash
chmod +x scripts/*.sh
```

### リモートURLを変更したい場合

```bash
git remote set-url oss <新しいURL>
```

### oss-syncブランチをクリーンに作り直したい場合

```bash
git branch -D oss-sync
git checkout develop
./scripts/sync-to-oss.sh <URL>
```

## 詳細ドキュメント

より詳細な情報は [docs/OSS_SYNC_GUIDE.md](../docs/OSS_SYNC_GUIDE.md) を参照してください。

- 手動編集が必要なファイルの詳細
- セキュリティチェックリスト
- トラブルシューティング
- 自動化の検討事項
