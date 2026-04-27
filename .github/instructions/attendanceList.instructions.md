---
applyTo: "src/pages/attendance/list/AttendanceListPage.tsx,src/pages/admin/AdminStaffAttendanceList/AdminStaffAttendanceList.tsx"
---

# 勤怠一覧ページ — 実装ルール

ステータス判定アルゴリズムや申請中表示ロジックの詳細は `.claude/agents/attendance/list-guide.md` を参照。

## ステータス判定（変更禁止）

- 勤怠ステータス判定は `src/lib/AttendanceState.ts` の `AttendanceState` クラスに集中させる。一覧コンポーネント側で独自判定ロジックを追加しない
- 「申請中」の判定は `ChangeRequest.getUnapprovedCount() > 0` を使う。独自カウントを実装しない
- 当日の勤怠はステータス判定から除外する（確定前のため）

## 管理者向け表示

- 「申請中のスタッフ」セクションは `pendingAttendances.length > 0` の場合のみ描画する（0 件時は非表示）
- 「申請確認」ボタンの表示判定も `getUnapprovedCount()` を使い、セクション表示条件と同一の基準を維持する
