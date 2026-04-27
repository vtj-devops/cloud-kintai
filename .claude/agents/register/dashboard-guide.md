---
name: register-dashboard-guide
description: Use this agent when implementing or modifying the register page dashboard (打刻ダッシュボード). Knows the two-column layout, card composition, elapsed-time calculation formulas, attendance summary aggregation rules, admin pending-approval counting, and the data flow between TimeRecorder and RegisterDashboard. Invoke when asked to add dashboard cards, change time calculations, modify aggregation periods, or debug card values.
---

# 打刻ダッシュボード 詳細仕様

英語で考えて、日本語で説明してください。

エントリポイント: `src/pages/Register.tsx` / `src/pages/register/RegisterContent.tsx`
ダッシュボード本体: `src/features/attendance/time-recorder/ui/RegisterDashboard.tsx`

---

## 画面構成

### レイアウト

`RegisterContent` は左に `TimeRecorder`、右に `RegisterDashboard` を置く 2 カラム構成。右カラム（aside）は `lg` 以上でのみ表示される。

### カードの並び順（RegisterDashboard）

1. `RegisterAnnouncementPanel`（アナウンス）
2. `AdminPendingApprovalSummary`（管理者向け未承認申請）
3. 経過時間カード 2 枚（勤務時間・休憩時間）
4. `RegisterAttendanceSummaryCard`（直近の勤務状況）

---

## アナウンスカード（RegisterAnnouncementPanel）

- AppConfigContext の `announcement` を表示する
- 表示条件: `announcement.enabled === true` かつ `message` が空白でない かつ localStorage で未 dismiss
- dismiss キーは `configId + message` から生成。キー生成規則を変更しない
- `sticky top-4` で固定表示（常に最上位に表示される）

---

## 管理者向け未承認申請カード（AdminPendingApprovalSummary）

表示対象: `ADMIN` / `STAFF_ADMIN` / `OWNER` ロールのみ（一般スタッフには非表示）

### 勤怠修正申請件数の算出

```
件数 = count(distinct staffId + workDate)
  where workDate >= today - 30days
  and hasUnapprovedChangeRequest(attendance.changeRequests) === true
```

- 同一スタッフ・同一 workDate に複数未承認申請があっても 1 件として数える
- `staffId` が欠けた attendance は除外する
- リアルタイム更新: `onCreateAttendance` / `onUpdateAttendance` / `onDeleteAttendance` Subscription で再集計（ポーリング不可）

### ワークフロー申請件数の算出

```
件数 = count(workflow) where workflow.status in {SUBMITTED, PENDING}
```

表示ラベルは `N件` 形式。勤怠修正申請は再集計中のみ `集計中` を表示する。

---

## 経過時間カード

### 表示条件

`elapsedWorkInfo.visible === true`（TimeRecorder から受け取る）の場合のみ表示。
`visible` の条件: `attendance.startTime != null && workStatus in {WORKING, RESTING}`

### 現在の勤務時間（算出式）

```
grossWorkMinutes = diffInMinutes(now, attendance.startTime)
recordedRestMinutes = Σ diffInMinutes(rest.endTime ?? now, rest.startTime)
  for each rest where rest.startTime != null
defaultLunchMinutes = max(diffInMinutes(appConfig.lunchRestEndTime, appConfig.lunchRestStartTime), 0)
shouldDeductDefaultLunch = now >= appConfig.lunchRestEndTime && attendance.startTime <= appConfig.lunchRestEndTime
effectiveRestMinutes = recordedRestMinutes + (shouldDeductDefaultLunch ? defaultLunchMinutes : 0)
netWorkMinutes = max(grossWorkMinutes - effectiveRestMinutes, 0)
```

表示: `formatHHmm(netWorkMinutes)`

昼休憩が記録済みの場合の二重控除に注意: 既定昼休憩帯と重複する記録済み休憩は控除済みとして扱う。

### 現在の休憩時間（算出式）

```
activeRest = rests のうち startTime != null && endTime == null を満たす要素のうち startTime が最新の 1 件
activeRestMinutes = workStatus === RESTING && activeRest.startTime != null
  ? diffInMinutes(now, activeRest.startTime) : 0
```

表示: `formatHHmm(activeRestMinutes)`

### フォーマット関数

```
formatHHmm(x):
  hours = floor(x / 60)
  minutes = x % 60
  → "HH:mm"（2 桁ゼロ埋め）

diffInMinutes(end, start):
  分単位整数差分（負値は 0 に丸める）
```

`appConfig.lunchRestStartTime` / `lunchRestEndTime` は `getLunchRestStartTime()` / `getLunchRestEndTime()` で取得。

---

## 直近の勤務状況カード（RegisterAttendanceSummaryCard）

### 集計期間の決定

```
currentMonth = today.startOf("month")
monthStart = currentMonth.startOf("month")
monthEnd = currentMonth.endOf("month")
applicableCloseDates = closeDates のうち [startDate, endDate] が [monthStart, monthEnd] と重なる要素

effectiveDateRange の優先順:
  1. today を内包する applicableCloseDates の start/end
  2. updatedAt ?? closeDate が最大の要素の start/end
  3. [monthStart, monthEnd]

queryDateRange.start = max(effectiveDateRange.start, monthStart)
queryDateRange.end   = min(effectiveDateRange.end, monthEnd)
filteredAttendances = attendance のうち effectiveDateRange.start <= workDate <= effectiveDateRange.end && workDate < today
```

`useCloseDates` で取得した締め期間を AppConfig の集計期間として扱う。

### サマリー値の算出

```
合計勤務時間 = Σ (calcTotalWorkTime(a.startTime, a.endTime) - Σ calcTotalRestTime(r.startTime, r.endTime))
  where a.workDate < today && a.startTime != null && a.endTime != null
  where r.startTime != null && r.endTime != null

勤務日数 = filteredAttendances.length
打刻エラー件数 = attendanceErrorCount props（TimeRecorder から受け取る）
```

ローディング中またはエラー時: 合計勤務時間・勤務日数を `--` 表示。

```
isLoading = closeDatesLoading || attendanceLoading || attendanceFetching || attendanceUninitialized
hasError = Boolean(closeDatesError || attendancesError)
```

`attendanceErrorCount > 0` のときはエラー件数ラベルを強調色で表示する。

---

## 勤務状況チャート

### データ構造

```
標準勤務時間 = max(getStandardWorkHours(), 0)

各日の正味勤務時間 =
  workDate < today
  ? max(calcTotalWorkTime(startTime, endTime) - Σ calcTotalRestTime(rest.startTime, rest.endTime), 0)
  : 0

チャート系列（固定 2 系列）:
  - 勤務時間: data = workHours
  - 残業時間: data = -overtimeHours  ← 負値で描画（上下分割表示のため）
```

- 日付軸は `effectiveDateRange.start` から `effectiveDateRange.end` まで 1 日刻みで生成（欠番なし）
- ツールチップは絶対値で表示（負値をそのまま見せない）
- `startTime` または `endTime` が欠けた attendance はチャートから除外

---

## データフロー

```
Register.tsx
  AppConfigContext → configId, announcement → RegisterContent

RegisterContent.tsx
  TimeRecorder → attendanceErrorCount, elapsedWorkInfo → RegisterDashboard

TimeRecorder.tsx（派生値の責務）
  attendanceErrorCount = count(AttendanceState(...).get() === AttendanceStatus.Error)
  isTimeElapsedError  = exists(attendance where today > workDate+1week && Error)
  elapsedWorkInfo.visible = attendance.startTime != null && workStatus in {WORKING, RESTING}

RegisterDashboard.tsx
  右カラム全体の並び順と存在条件を管理
  各カードは疎結合
```

**禁止パターン**: ダッシュボード側のカードで独立したタイマーや勤怠状態判定を持たない。TimeRecorder が公開する派生値を使う。

---

## 変更時のチェックリスト

- カード追加時: desktop only aside に閉じ込めてよいか確認する
- 勤怠時間・件数の変更: 表示名だけでなく算出根拠が変わっていないか確認する
- 管理者向け情報追加: ロール制御は RegisterContent ではなくカード内部に持たせる
- 集計カード変更時: ローディング中・0件・エラー・管理者以外・勤務中・休憩中 の表示差分を確認する
