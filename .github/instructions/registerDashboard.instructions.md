---
applyTo: "src/pages/Register.tsx,src/pages/register/RegisterContent.tsx,src/features/attendance/time-recorder/ui/RegisterDashboard.tsx,src/features/attendance/time-recorder/ui/RegisterAnnouncementPanel.tsx,src/features/attendance/time-recorder/ui/RegisterAttendanceSummaryCard.tsx,src/features/attendance/time-recorder/ui/TimeRecorder.tsx,src/widgets/layout/header/AdminPendingApprovalSummary.tsx"
---

# 打刻ダッシュボード — 実装ルール

カード構成・算出式・集計ルールの詳細は `.claude/agents/register/dashboard-guide.md` を参照。

## ガードレール

- `/register` では `StaffRole.OPERATOR` は打刻画面を使わず `/office/qr` へ遷移する。OPERATOR 向けに ダッシュボード UI を追加しない
- `VITE_STANDARD_REGISTER_DISABLE === true` の場合、Register.tsx は利用不可アラートのみ表示する。このガードを迂回しない
- ダッシュボードの aside は `lg` 以上でのみ表示される。モバイル向けに情報を追加する場合は別途モバイル導線を用意する
- 経過時間の算出・打刻エラー判定は **TimeRecorder の責務**。ダッシュボード側のカードで独自タイマーや状態判定を持たない
- 管理者向け未承認申請件数のリアルタイム更新は Subscription（`onCreateAttendance` / `onUpdateAttendance` / `onDeleteAttendance`）で行う。ポーリングへ置き換えない
- `data-testid` の `register-dashboard-*` と `admin-pending-approval-summary` 系の命名は維持する

## カード並び順（RegisterDashboard）

1. RegisterAnnouncementPanel（常に最上位）
2. AdminPendingApprovalSummary（管理者のみ）
3. 経過時間カード 2 枚
4. RegisterAttendanceSummaryCard

並び順の変更は、打刻体験の認知負荷が上がらないことを確認してから行う。
