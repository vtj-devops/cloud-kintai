---
name: about-kintai-app
description: >
  garaku-frontend（クラウド勤怠）の仕様・ドメイン知識・データ構造に関するスキル。
  勤怠管理・打刻・ワークフロー・シフト・AppConfig などに関わる実装・修正・質問が来たときは必ずこのスキルを参照すること。
  「勤怠」「打刻」「シフト」「ワークフロー」「出退勤」「休憩」「直行」「直帰」「申請」「承認」「勤務ステータス」
  などのキーワードが少しでも含まれる場合は積極的にこのスキルを使用すること。
---

# 勤怠アプリ（garaku-frontend）基本スキル

このドキュメントは、garaku-frontend（クラウド勤怠）の主要ドメイン知識・機能仕様・データ構造をエージェント向けにまとめたものです。

---

## 1. アプリ概要

社内向け勤怠管理・シフト管理 Web アプリケーション。

- **技術スタック**: React 19 / TypeScript / Vite / MUI v6 / Tailwind CSS
- **バックエンド**: AWS Amplify（AppSync GraphQL + DynamoDB + Cognito）
- **状態管理**: Redux Toolkit（通知系）+ Context API（認証・設定系）
- **フォーム**: React Hook Form + Zod

---

## 2. 主要機能一覧

| 機能 | パス | 担当ページ |
|------|------|-----------|
| 打刻（出退勤） | `/` `/register` | `src/pages/Register.tsx` |
| 勤怠一覧（スタッフ） | `/attendance/list` | `src/pages/attendance/list/AttendanceListPage.tsx` |
| 勤怠編集（スタッフ） | `/attendance/:date/edit` | `src/pages/attendance/edit/AttendanceEdit.tsx` |
| 日報 | `/attendance/report` | `src/pages/attendance/daily-report/DailyReport.tsx` |
| 勤怠統計 | `/attendance/stats` | `src/pages/attendance/stats/AttendanceStatisticsPage.tsx` |
| 申請一覧 | `/workflow` | `src/pages/workflow/list/Workflow.tsx` |
| 申請詳細 | `/workflow/:id` | `src/pages/workflow/detail/WorkflowDetail.tsx` |
| 管理者 勤怠管理 | `/admin/attendance` | `src/pages/admin/AdminAttendance/` |
| 管理者 勤怠編集 | `/admin/attendance/...` | `src/pages/admin/AdminAttendanceEditor.tsx` |
| 管理者 ワークフロー | `/admin/workflow` | `src/pages/admin/AdminWorkflow/` |
| シフト申請（通常） | `/shift` | `src/pages/shift/request/` |
| シフト共同編集 | `/shift/collaborative` | `src/pages/shift/collaborative/ShiftCollaborative.tsx` |
| オフィス QR 打刻 | `/office/qr` | `src/pages/office/qr/OfficeQrPage.tsx` |

---

## 3. ロール（権限）

```typescript
enum StaffRole {
  OWNER      = "Owner",       // システムオーナー（最上位権限）
  ADMIN      = "Admin",       // 管理者
  STAFF_ADMIN = "StaffAdmin", // スタッフ管理者
  STAFF      = "Staff",       // 一般スタッフ
  GUEST      = "Guest",       // ゲスト
  OPERATOR   = "Operator",    // 事業所オペレーター（QR打刻専用）
  NONE       = "None",        // 権限なし
}
```

- `ADMIN` / `STAFF_ADMIN` / `OWNER` のみシフトの確定（ロック）・ワークフロー承認が可能
- `OPERATOR` は `/register` を使わず `/office/qr` へリダイレクトされる

---

## 4. 勤務形態（workType）

| 値 | 意味 |
|----|------|
| `"weekday"` | 平日勤務：土日・祝日・会社休日は判定対象外 |
| `"shift"` | シフト勤務：曜日に関係なく判定対象、みなし休日フラグで調整 |

---

## 5. 現在の勤務ステータス

打刻画面のリアルタイム状態。`src/entities/attendance/` で定義。

```typescript
enum WorkStatusCodes {
  BEFORE_WORK = "BEFORE_WORK", // 出勤前
  WORKING     = "WORKING",     // 勤務中
  RESTING     = "RESTING",     // 休憩中
  LEFT_WORK   = "LEFT_WORK",   // 勤務終了
  PROCESSING  = "PROCESSING",  // 処理中
  ERROR       = "ERROR",       // エラー
}
```

判定ロジック（優先順）：
1. `startTime && endTime` → `LEFT_WORK`
2. `startTime && 最新 rest.startTime && !最新 rest.endTime` → `RESTING`
3. `startTime && !endTime` → `WORKING`
4. それ以外 → `BEFORE_WORK`

---

## 6. 勤怠判定ステータス

勤怠一覧・管理画面で表示されるステータス。`src/lib/AttendanceState.ts` で判定。

| ステータス | 内部値 | 意味 |
|-----------|--------|------|
| OK | `AttendanceStatus.Ok` | 記録が揃っており対応不要 |
| 要確認 | `AttendanceStatus.Error` | 記録不足・不整合あり |
| 申請中 | `AttendanceStatus.Requesting` | 修正申請が提出中 |
| 表示なし | `AttendanceStatus.None` | 当日・休日・利用開始前など判定対象外 |

判定優先順位：
1. 勤怠管理未対象 → `None`
2. 当日かつ修正申請なし → `None`
3. 利用開始日前 → `None`
4. 有給休暇 or 振替休日 → `Ok`
5. みなし休日（シフト勤務） or 祝日・会社休日（平日勤務） → `None`
6. 修正申請が未承認 → `Requesting`
7. 平日で `startTime` or `endTime` が欠損 → `Error`
8. 週末で記録なし → `None`
9. それ以外 → `Ok`

---

## 7. 勤怠データ型（Attendance）

```typescript
type Attendance = {
  id: string;
  staffId: string;
  workDate: string;                   // 勤務日（YYYY-MM-DD）
  startTime?: string | null;          // 出勤時刻（HH:mm）
  endTime?: string | null;            // 退勤時刻（HH:mm）
  goDirectlyFlag?: boolean | null;    // 直行フラグ
  returnDirectlyFlag?: boolean | null;// 直帰フラグ
  absentFlag?: boolean | null;        // 欠勤フラグ
  rests?: Rest[] | null;              // 休憩時間配列
  hourlyPaidHolidayTimes?: HourlyPaidHolidayTime[] | null;
  remarks?: string | null;            // 備考
  paidHolidayFlag?: boolean | null;   // 有給休暇フラグ
  specialHolidayFlag?: boolean | null;// 特別休暇フラグ
  isDeemedHoliday?: boolean | null;   // みなし休日（シフト勤務用）
  substituteHolidayDate?: string | null; // 振替休日の日付
  hourlyPaidHolidayHours?: number | null;
  changeRequests?: AttendanceChangeRequest[] | null;
  revision?: number | null;           // 楽観的ロック用
  createdAt: string;
  updatedAt: string;
};

type Rest = {
  startTime?: string | null;
  endTime?: string | null;
};

type HourlyPaidHolidayTime = {
  startTime: string;
  endTime: string;
};
```

---

## 8. 修正申請（AttendanceChangeRequest）

スタッフが勤怠の訂正を申請するためのデータ。`changeRequests` 配列に格納される。

```typescript
type AttendanceChangeRequest = {
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  rests?: Rest[] | null;
  hourlyPaidHolidayTimes?: HourlyPaidHolidayTime[] | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayFlag?: boolean | null;
  substituteHolidayDate?: string | null;
  completed?: boolean | null;          // 承認完了フラグ
  comment?: string | null;             // 管理者コメント
  staffComment?: string | null;        // スタッフコメント
};
```

未承認（`completed` が `null` / `false`）の申請が存在する場合 → ステータス「申請中」

---

## 9. 打刻アクション

```typescript
type AttendanceUpsertAction =
  | "clock_in"        // 出勤打刻
  | "clock_out"       // 退勤打刻
  | "go_directly"     // 直行（AppConfig.workStartTime で記録）
  | "return_directly" // 直帰（AppConfig.workEndTime で記録）
  | "rest_start"      // 休憩開始
  | "rest_end"        // 休憩終了
  | "manual";         // 手動編集
```

### 直行・直帰
- **直行**: 拠点を経由せず直接現場へ → `goDirectlyFlag = true`、出勤時刻は AppConfig の `workStartTime` を使用
- **直帰**: 現場から直接帰宅 → `returnDirectlyFlag = true`、退勤時刻は AppConfig の `workEndTime` を使用

---

## 10. ワークフロー（申請・承認）

### ワークフローカテゴリー

```typescript
enum WorkflowCategory {
  PAID_LEAVE        = "PAID_LEAVE",        // 有給休暇申請
  ABSENCE           = "ABSENCE",           // 欠勤申請
  OVERTIME          = "OVERTIME",          // 残業申請
  CLOCK_CORRECTION  = "CLOCK_CORRECTION",  // 打刻訂正申請
  COMPENSATORY_LEAVE= "COMPENSATORY_LEAVE",// 代休申請
  CUSTOM            = "CUSTOM",            // カスタム申請
}
```

### ワークフローステータス

```typescript
enum WorkflowStatus {
  DRAFT     = "DRAFT",     // 下書き
  SUBMITTED = "SUBMITTED", // 提出済み
  PENDING   = "PENDING",   // 承認待ち
  APPROVED  = "APPROVED",  // 承認完了
  REJECTED  = "REJECTED",  // 却下
  CANCELLED = "CANCELLED", // キャンセル
}
```

### 承認フロー概要

```
スタッフ: 申請提出（SUBMITTED / PENDING）
  ↓
管理者: 承認（APPROVED）or 却下（REJECTED）or 差し戻し
  ↓
承認: changeRequest.completed = true → 勤怠ステータス「OK」
却下: スタッフへ通知 → 再申請可能
```

### Workflow 主要フィールド

```typescript
type Workflow = {
  id: string;
  staffId: string;
  status: WorkflowStatus;
  category?: WorkflowCategory | null;
  customWorkflowTitle?: string | null;
  customWorkflowContent?: string | null;
  overTimeDetails?: OverTimeWorkflow | null;
  approvalSteps?: ApprovalStep[] | null;
  nextApprovalStepIndex?: number | null;
  assignedApproverStaffIds?: string[] | null;
  approvedStaffIds?: string[] | null;
  rejectedStaffIds?: string[] | null;
  finalDecisionTimestamp?: string | null;
  comments?: WorkflowComment[] | null;
  version?: number | null;
  createdAt: string;
  updatedAt: string;
};

type ApprovalStep = {
  id: string;
  approverStaffId: string;
  decisionStatus: ApprovalStatus;
  approverComment?: string | null;
  decisionTimestamp?: string | null;
};
```

---

## 11. AppConfig（アプリケーション設定）

`useAppConfig` フック経由で取得する。変更は管理者画面から行い、RTK Query で更新。

### 勤怠関連の主要設定

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `workStartTime` | `string` | 標準勤務開始時刻（HH:mm）。直行打刻時に使用 |
| `workEndTime` | `string` | 標準勤務終了時刻（HH:mm）。直帰打刻時に使用 |
| `lunchRestStartTime` | `string` | 昼休開始時刻 |
| `lunchRestEndTime` | `string` | 昼休終了時刻 |
| `hourlyPaidHolidayEnabled` | `boolean` | 時間単位有給機能の有効化 |
| `amPmHolidayEnabled` | `boolean` | 半休機能（午前・午後）の有効化 |
| `amHolidayStartTime` / `amHolidayEndTime` | `string` | 午前半休の時間帯 |
| `pmHolidayStartTime` / `pmHolidayEndTime` | `string` | 午後半休の時間帯 |
| `specialHolidayEnabled` | `boolean` | 特別休暇機能の有効化 |
| `absentEnabled` | `boolean` | 欠勤機能の有効化 |
| `overTimeCheckEnabled` | `boolean` | 残業チェックの有効化 |
| `attendanceStatisticsEnabled` | `boolean` | 勤怠統計機能の有効化 |
| `quickInputStartTimes` | `QuickInputTime[]` | 出勤クイック入力時刻リスト |
| `quickInputEndTimes` | `QuickInputTime[]` | 退勤クイック入力時刻リスト |
| `reasons` | `Reason[]` | 修正理由テンプレート |

### ワークフロー・通知関連

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `workflowNotificationEnabled` | `boolean` | ワークフロー通知の有効化 |
| `workflowCategoryOrder` | `WorkflowCategory[]` | ワークフローカテゴリーの表示順 |
| `timeRecorderAnnouncementEnabled` | `boolean` | 打刻画面のお知らせ表示 |
| `timeRecorderAnnouncementMessage` | `string` | お知らせメッセージ本文 |

### シフト関連

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `shiftCollaborativeEnabled` | `boolean` | シフト共同編集のスタッフ向け有効化 |
| `shiftDefaultMode` | `"normal" \| "collaborative"` | シフト画面のデフォルトモード |

---

## 12. バリデーションルール（勤怠編集）

以下は**システム要件**として変更禁止。

- 退勤時刻は出勤時刻より後であること
- 複数の休憩時間が時間帯として重複しないこと
- 6 時間以上勤務時は最低 30 分の休憩確認を促す
- 8 時間以上勤務時は最低 1 時間の休憩確認を促す
- 振替休日と有給・特別休暇は同時設定不可
- 「修正理由」入力はスタッフ側のみ（管理者画面には表示しない）

---

## 13. アーキテクチャ（FSD）

依存方向: `pages` → `processes` → `features` → `entities` → `shared`

| レイヤー | パス | 役割 |
|---------|------|------|
| `pages` | `src/pages/` | ルート単位のページコンポーネント |
| `processes` | `src/processes/` | 複数ページをまたぐ業務フロー |
| `features` | `src/features/` | 機能単位（`ui/`, `model/`, `lib/`） |
| `entities` | `src/entities/` | ドメイン型・API・ビジネスロジック |
| `shared` | `src/shared/` | 横断利用 UI・hooks・lib |
| `widgets` | `src/widgets/` | ヘッダー等の大きな UI ブロック |

### パスエイリアス

```
@/*          → src/*
@shared/*    → src/shared/*
@entities/*  → src/entities/*
@features/*  → src/features/*
@pages/*     → src/pages/*
@processes/* → src/processes/*
```

---

## 14. 自動生成ファイル（編集禁止）

- `src/shared/api/graphql/**` ← `amplify codegen` で再生成
- `src/ui-components/**` ← `amplify pull` で再生成
- `src/aws-exports.js`

これらのファイルは手動編集せず、スキーマや Amplify Studio 側を変更してから再生成すること。

---

## 15. 主要な実装クラス・フック

| 名前 | 場所 | 用途 |
|-----|------|------|
| `AttendanceState` | `src/lib/AttendanceState.ts` | 勤怠判定ステータス計算 |
| `getWorkStatus()` | `src/entities/attendance/` | 現在の勤務ステータス取得 |
| `useAppConfig` | `src/context/AppConfigContext.tsx` | AppConfig 取得・キャッシュ |
| `AttendanceEditProvider` | `src/features/attendance/edit/` | 勤怠編集フォーム共有状態 |
| `TimeRecorder` | `src/features/attendance/time-recorder/` | 打刻 UI コンポーネント |
| `useCollaborativeShiftData` | `src/features/shift/collaborative/` | シフト CRUD + 楽観的更新 |
| `useShiftSync` | `src/features/shift/collaborative/` | Subscription + 自動同期 |
