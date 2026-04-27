---
name: attendance-list-guide
description: Use this agent when implementing or modifying the attendance list pages (勤怠一覧). Knows the AttendanceState status determination algorithm, the pending-approval display logic for admins, and the staff vs admin page split. Invoke when asked to change status badges, add list columns, modify filtering logic, or debug status mismatch.
---

# 勤怠一覧ページ 詳細仕様

英語で考えて、日本語で説明してください。

スタッフ向け: `src/pages/attendance/list/AttendanceListPage.tsx`
管理者向け: `src/pages/admin/AdminStaffAttendanceList/AdminStaffAttendanceList.tsx`

---

## 勤怠ステータスの種類

| ステータス | 意味 |
| --- | --- |
| **OK** | 勤怠が正常に記録されており、対応不要 |
| **要確認** | 不明点または確認が必要な項目がある（スタッフ/管理者が修正すべき状態） |
| **申請中** | 申請が行われているが管理者の承認待ち |
| （なし） | 判定対象外（当日・休日・利用開始日前など） |

---

## ステータス判定アルゴリズム（`AttendanceState` クラス）

実装ファイル: `src/lib/AttendanceState.ts`

以下の順序でチェックを行い、最初にマッチした条件でステータスが確定する。

1. **当日チェック**: `workDate === today` → ステータスなし（確定前のため）
2. **利用開始日チェック**: `workDate < staff.usageStartDate` → ステータスなし
3. **有給・振替チェック**:
   - `paidHolidayFlag === true` → **OK**
   - `substituteHolidayFlag === true` → **OK**
4. **休日チェック**（以下のいずれかに該当 → ステータスなし）:
   - シフト制スタッフ（`workType === "shift"`）かつ `isDeemedHoliday === true`
   - 通常勤務スタッフで、祝日または会社休日
5. **申請中チェック**: `changeRequests` に `completed === false` の申請が 1 件以上 → **申請中**
6. **平日勤務チェック**:
   - `startTime` が未入力 → **要確認**
   - `endTime` が未入力 → **要確認**
   - 上記以外 → **OK**
7. **休日出勤チェック**（土日 + 上記休日チェックを通過した場合）:
   - 出勤・退勤が両方未入力 → ステータスなし
   - それ以外 → **OK**

---

## 管理者向け「申請中のスタッフ」表示ロジック

実装ファイル: `src/features/admin/staffAttendanceList/model/useAdminStaffAttendanceListViewModel.ts`

### 「申請中」とみなす条件

```typescript
new ChangeRequest(attendance.changeRequests).getUnapprovedCount() > 0
```

- `ChangeRequest` クラスは `null` 要素を除外してからカウントする
- `completed === false` の申請を「未承認」としてカウントする

### セクション表示条件

`pendingAttendances.length > 0` の場合のみ「申請中のスタッフ」セクションを描画する（0 件のときはセクション自体を描画しない）。

実装ファイル: `src/features/admin/staffAttendanceList/ui/AdminStaffAttendanceList.tsx`

### 各行の「申請確認」ボタン表示条件

```typescript
getBadgeContent(attendance) > 0
// → ChangeRequest.getUnapprovedCount() > 0 と同一
```

判定基準はセクション表示と同一なので、セクションが表示されているときは必ずボタンも表示される。

---

## 技術メモ

- 勤怠ステータス判定は `AttendanceState` クラスに集中しており、列挙値は `AttendanceStatus` enum で定義されている
- `ChangeRequest` クラスは `null` 要素を含む配列を受け取ることを前提に設計されているため、呼び出し前のフィルタリングは不要
- シフト制スタッフ（`workType === "shift"`）の休日判定は通常勤務スタッフと異なるため、workType を条件に含めること
