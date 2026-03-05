#!/bin/bash
# OSS 公開前のセキュリティチェックスクリプト
# 使用方法: ./scripts/check-oss-security.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES_FOUND=0

echo -e "${GREEN}=== OSS セキュリティチェック ===${NC}\n"

# 1. 機密情報パターンのチェック
echo -e "${YELLOW}[1/6] 機密情報パターンをチェック中...${NC}"
SENSITIVE_PATTERNS=(
    "aws_access_key_id"
    "aws_secret_access_key"
    "AKIA[0-9A-Z]{16}"
    "password.*=.*['\"].*['\"]"
    "secret.*=.*['\"].*['\"]"
    "api_key.*=.*['\"].*['\"]"
    "@.*\.internal"
    "\.corp\."
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git grep -i -E "$pattern" -- ':!scripts/check-oss-security.sh' ':!docs/OSS_SYNC_GUIDE.md' > /dev/null 2>&1; then
        echo -e "  ${RED}✗ 検出: $pattern${NC}"
        git grep -i -n -E "$pattern" -- ':!scripts/check-oss-security.sh' ':!docs/OSS_SYNC_GUIDE.md' | head -3
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "  ${GREEN}✓ 機密情報パターンは検出されませんでした${NC}"
fi

# 2. 必須ファイルの存在チェック
echo -e "\n${YELLOW}[2/6] 必須ファイルをチェック中...${NC}"
REQUIRED_FILES=(
    "README.md"
    "LICENSE"
    ".env.example"
    "CONTRIBUTING.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓ $file${NC}"
    else
        echo -e "  ${RED}✗ $file が見つかりません${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# 3. README.mdの内容チェック
echo -e "\n${YELLOW}[3/6] README.md の内容をチェック中...${NC}"
if [ -f "README.md" ]; then
    INTERNAL_KEYWORDS=("社内" "internal" "confidential" "機密" "@company.com")
    for keyword in "${INTERNAL_KEYWORDS[@]}"; do
        if grep -i "$keyword" README.md > /dev/null 2>&1; then
            echo -e "  ${RED}✗ 内部情報の可能性: '$keyword' が含まれています${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
    
    if [ $ISSUES_FOUND -eq 0 ]; then
        echo -e "  ${GREEN}✓ README.md に問題は見つかりませんでした${NC}"
    fi
fi

# 4. package.jsonのチェック
echo -e "\n${YELLOW}[4/6] package.json をチェック中...${NC}"
if [ -f "package.json" ]; then
    if grep -q '"private": *true' package.json; then
        echo -e "  ${YELLOW}! package.json が private: true に設定されています${NC}"
        echo -e "    ${YELLOW}OSS版では false に変更することを推奨します${NC}"
    else
        echo -e "  ${GREEN}✓ package.json の設定は問題ありません${NC}"
    fi
    
    # リポジトリURLのチェック
    if grep -q 'vtj-devops' package.json; then
        echo -e "  ${YELLOW}! プライベートリポジトリのURLが含まれています${NC}"
        echo -e "    ${YELLOW}OSS版のリポジトリURLに更新してください${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# 5. AWS設定ファイルのチェック
echo -e "\n${YELLOW}[5/6] AWS設定ファイルをチェック中...${NC}"
SENSITIVE_FILES=(
    "src/aws-exports.js"
    "amplify/team-provider-info.json"
    ".env"
    ".env.local"
    ".env.production"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "  ${RED}✗ 機密ファイルが存在: $file${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "  ${GREEN}✓ 機密性の高いファイルは検出されませんでした${NC}"
fi

# 6. Gitの履歴チェック（最近のコミット）
echo -e "\n${YELLOW}[6/6] 最近のコミットメッセージをチェック中...${NC}"
COMMIT_KEYWORDS=("password" "secret" "key" "credential" "token")
for keyword in "${COMMIT_KEYWORDS[@]}"; do
    if git log -5 --all --grep="$keyword" -i > /dev/null 2>&1; then
        echo -e "  ${YELLOW}! コミットメッセージに '$keyword' が含まれています${NC}"
        echo -e "    ${YELLOW}コミット履歴を確認してください${NC}"
    fi
done
echo -e "  ${GREEN}✓ コミット履歴のチェック完了${NC}"

# 結果サマリー
echo -e "\n${GREEN}=== チェック完了 ===${NC}\n"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ すべてのチェックをパスしました!${NC}"
    echo -e "${GREEN}OSSリポジトリへのプッシュを行えます。${NC}"
    exit 0
else
    echo -e "${RED}✗ $ISSUES_FOUND 個の問題が見つかりました${NC}"
    echo -e "${YELLOW}上記の問題を修正してから再度チェックを実行してください${NC}"
    echo -e "${YELLOW}詳細は docs/OSS_SYNC_GUIDE.md を参照してください${NC}"
    exit 1
fi
