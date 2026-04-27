---
applyTo: "src/pages/admin/AdminAttendanceEditor.tsx,src/pages/attendance/edit/AttendanceEdit.tsx"
---

# 勤怠編集ページ — 実装ルール

フィールド仕様・バリデーションルールの詳細は `.claude/agents/attendance/edit-guide.md` を参照。

## バリデーション（変更禁止）

以下のバリデーションルールはシステム要件であり、削除・緩和しない。

- 勤務終了時間は勤務開始時間より後であること
- 複数の休憩時間が時間帯として重複しないこと
- 6 時間以上勤務時は最低 30 分の休憩確認を促すこと
- 8 時間以上勤務時は最低 1 時間の休憩確認を促すこと
- 振替休日と有給・特別休暇は同時設定不可

## フォーム実装

- フォームは **React Hook Form + Zod** で管理する
- 時刻入力は `TimeInput`（`@shared/ui/`）を使う
- 定型入力（複数フィールドをまとめて更新）と クイック入力チップ（単一フィールドのみ更新）は別の UI として維持する
- AppConfig 依存の既定値は `useAppConfig` フックで取得する

## 権限

- 「修正理由」入力はスタッフ側のみ。管理者画面には表示しない
