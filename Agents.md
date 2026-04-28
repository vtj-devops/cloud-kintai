# Agents.md

## 基本ルール

- 英語で考えて、日本語で説明してください。
- コミットメッセージは英語で書く
- push 前に `npm run typecheck` が `.githooks` で自動実行される

## 実装時の重要制約

- `src/shared/api/graphql/` と `src/ui-components/` は Amplify 自動生成のため手動編集禁止
- MUI コンポーネントの新規直接 import は禁止（`src/shared/ui/` の共通 UI を使う）
- スタイリングは MUI `sx` を主軸、Tailwind は補助、新規 SCSS は作らない
- デザイントークンは `designTokenVar()` 経由で参照する
- フォームは React Hook Form + Zod を基本にする

## Skill 参照

- 開発コマンドと検証手順は `.agents/skills/garaku-dev-commands/SKILL.md` を参照
- 配置ルールと依存方向は `.agents/skills/garaku-architecture-map/SKILL.md` を参照
- 機能配置と修正対象の当たりを付けるときは `.agents/skills/garaku-feature-map/SKILL.md` を参照
- 勤怠ドメイン全般は `.agents/skills/about-kintai-app/SKILL.md` を参照
- 権限・ロールは `.agents/skills/about-permissions/SKILL.md` を参照

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
