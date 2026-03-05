#!/bin/bash
# OSS リポジトリへの同期スクリプト
# 使用方法: ./scripts/sync-to-oss.sh [oss-リポジトリURL]

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

OSS_REPO_URL="${1:-}"
OSS_BRANCH="${2:-main}"
SYNC_BRANCH="oss-sync"

if [ -z "$OSS_REPO_URL" ]; then
    echo -e "${RED}エラー: OSSリポジトリのURLを指定してください${NC}"
    echo "使用方法: $0 <oss-repo-url> [branch-name]"
    exit 1
fi

echo -e "${GREEN}=== OSS リポジトリへの同期準備 ===${NC}"

# 1. OSS用のリモートリポジトリを追加（既に存在する場合はスキップ）
if ! git remote | grep -q "^oss$"; then
    echo -e "${YELLOW}OSS リモートを追加...${NC}"
    git remote add oss "$OSS_REPO_URL"
else
    echo -e "${YELLOW}OSS リモートは既に存在します${NC}"
    git remote set-url oss "$OSS_REPO_URL"
fi

# 2. 現在のブランチから oss-sync ブランチを作成/更新
echo -e "${YELLOW}同期ブランチ ($SYNC_BRANCH) を作成/更新...${NC}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git checkout -B "$SYNC_BRANCH"

# 3. 機密情報を含むファイルを削除
echo -e "${YELLOW}機密情報ファイルを削除...${NC}"
cat > /tmp/oss-remove-list.txt << 'EOF'
amplify/team-provider-info.json
src/aws-exports.js
.env*
coverage/
build/
node_modules/
playwright-report/
test-results/
.devcontainer/.ssh
EOF

while IFS= read -r pattern; do
    if [ -n "$pattern" ] && [[ ! "$pattern" =~ ^# ]]; then
        echo "  削除: $pattern"
        git rm -rf --cached "$pattern" 2>/dev/null || true
        rm -rf "$pattern" 2>/dev/null || true
    fi
done < /tmp/oss-remove-list.txt

# 4. OSS用の.gitignoreを追加
echo -e "${YELLOW}OSS用の設定ファイルを更新...${NC}"
cat >> .gitignore.oss << 'EOF'
# OSS版で追加で除外するファイル
amplify/team-provider-info.json
src/aws-exports.js
.env*
!.env.example
EOF

# 5. 変更をコミット
if git diff --cached --quiet; then
    echo -e "${YELLOW}変更はありません${NC}"
else
    git add -A
    git commit -m "Prepare for OSS sync: Remove sensitive files"
fi

# 6. 手動編集が必要なファイルをリスト表示
echo -e "${GREEN}=== 次のステップ ===${NC}"
echo -e "${YELLOW}以下のファイルを手動で確認・編集してください:${NC}"
echo ""
echo "  1. src/amplifyconfiguration.json - AWS設定を汎用的な内容に変更"
echo "  2. README.md - 社内情報を削除し、OSS向けの説明を追加"
echo "  3. package.json - プライベートな依存関係を確認"
echo "  4. その他、機密情報を含む可能性のあるファイル"
echo ""
echo -e "${YELLOW}編集完了後、以下のコマンドを実行してください:${NC}"
echo ""
echo "  git add -A"
echo "  git commit -m 'Update for OSS release'"
echo "  git push oss $SYNC_BRANCH:$OSS_BRANCH --force"
echo ""
echo -e "${YELLOW}元のブランチに戻るには:${NC}"
echo "  git checkout $CURRENT_BRANCH"
echo ""
echo -e "${GREEN}現在、$SYNC_BRANCH ブランチにいます${NC}"
