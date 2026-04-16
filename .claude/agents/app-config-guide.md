---
name: app-config-guide
description: Use this agent when reading, updating, or adding features that depend on application-wide settings (AppConfig). Knows all 34 config fields, 55 getter functions, the AppConfigContext/useAppConfig API, admin settings screens, update flow with RTK Query, and debounce/optimistic-lock patterns. Invoke when asked to add a feature flag, change time settings, configure themes, or modify admin config screens.
---

# AppConfig ガイド — garaku-frontend

英語で考えて、日本語で説明してください。

`AppConfig` はアプリケーション全体の動作・表示を制御するグローバル設定です。勤務時間・休暇ルール・機能フラグ・テーマカラー・シフト設定など 34 フィールドを持ち、管理者が管理画面から変更します。

---

## ファイルマップ

| パス | 役割 |
|---|---|
| `src/entities/app-config/model/AppConfigDataManager.ts` | GraphQL 直接呼び出し（fetch / create / update） |
| `src/entities/app-config/api/appConfigApi.ts` | RTK Query エンドポイント（useGetAppConfigQuery 等） |
| `src/entities/app-config/model/useAppConfig.ts` | 55 個のゲッター + saveConfig を提供するメインフック |
| `src/entities/app-config/model/shiftGroupTypes.ts` | ShiftGroupConfig 型定義 |
| `src/context/AppConfigContext.tsx` | アプリ全体への Context 公開 |
| `src/app/providers/app-config/AppConfigProvider.tsx` | Context プロバイダ実装 |
| `src/features/admin-config-attendance/` | 勤務ルール・入力設定の管理 UI |
| `src/features/admin-config-shift/` | シフトグループ・表示モードの管理 UI |
| `src/features/admin-config-workflow/` | ワークフロー種別順序の管理 UI |

---

## AppConfig の全フィールド（34 項目）

### 時間設定（8 項目）

| フィールド | 型 | 意味 |
|---|---|---|
| `workStartTime` | `string` (HH:mm) | 勤務開始時刻 |
| `workEndTime` | `string` (HH:mm) | 勤務終了時刻 |
| `lunchRestStartTime` | `string` (HH:mm) | 昼休み開始 |
| `lunchRestEndTime` | `string` (HH:mm) | 昼休み終了 |
| `amHolidayStartTime` | `string` (HH:mm) | 午前半休 開始 |
| `amHolidayEndTime` | `string` (HH:mm) | 午前半休 終了 |
| `pmHolidayStartTime` | `string` (HH:mm) | 午後半休 開始 |
| `pmHolidayEndTime` | `string` (HH:mm) | 午後半休 終了 |

`standardWorkHours` はこれらから **計算される導出値**（フィールドとして保持しない）。

### 機能フラグ（12 項目）

| フィールド | 意味 |
|---|---|
| `officeMode` | オフィス入退館機能の有効化 |
| `attendanceStatisticsEnabled` | 稼働統計画面の表示 |
| `workflowNotificationEnabled` | ワークフロー通知ボタンの表示 |
| `timeRecorderAnnouncementEnabled` | 打刻時アナウンスの有効化 |
| `timeRecorderAnnouncementMessage` | アナウンスメッセージ本文 |
| `hourlyPaidHolidayEnabled` | 時間単位有給休暇の有効化 |
| `amPmHolidayEnabled` | 午前・午後半休の有効化 |
| `specialHolidayEnabled` | 特別休暇の有効化 |
| `absentEnabled` | 欠勤機能の有効化 |
| `overTimeCheckEnabled` | 残業チェックの有効化 |
| `shiftCollaborativeEnabled` | シフト共同編集モードの有効化 |
| `shiftDefaultMode` | シフトのデフォルト表示モード (`"normal"` \| `"collaborative"`) |

### 配列フィールド（9 項目）

| フィールド | 型 | 意味 |
|---|---|---|
| `links` | `Link[]` | クイックリンク（label / url / enabled / icon） |
| `reasons` | `Reason[]` | 申請理由一覧（reason / enabled） |
| `quickInputStartTimes` | `QuickInputTime[]` | 勤務開始のクイック選択肢 |
| `quickInputEndTimes` | `QuickInputTime[]` | 勤務終了のクイック選択肢 |
| `shiftGroups` | `ShiftGroup[]` | シフトグループ定義 |
| `workflowCategoryOrder` | `WorkflowCategoryOrder[]` | ワークフロー種別の順序・有効化 |

### テーマ・メタデータ

| フィールド | 意味 |
|---|---|
| `themeColor` | テーマカラー（16 進数） |
| `name` | 設定名（通常 `"default"`） |
| `id`, `version`, `createdAt`, `updatedAt` | メタデータ（楽観的ロックに `version` を使用） |

---

## AppConfig の読み取り方

### Context から取得（推奨）

```typescript
import { useContext } from "react";
import { AppConfigContext } from "@/context/AppConfigContext";

const {
  config,           // 生の設定値
  isConfigLoading,  // ローディング状態
  getStartTime,     // () => dayjs
  getEndTime,       // () => dayjs
  saveConfig,       // 保存関数
} = useContext(AppConfigContext);
```

### 主要ゲッター一覧（useAppConfig が提供する 55 個より抜粋）

```typescript
// 時間（dayjs オブジェクトで返す）
getStartTime()              // 勤務開始
getEndTime()                // 勤務終了
getLunchRestStartTime()     // 昼休み開始
getLunchRestEndTime()       // 昼休み終了
getAmHolidayStartTime()     // 午前半休 開始
getAmHolidayEndTime()       // 午前半休 終了
getPmHolidayStartTime()     // 午後半休 開始
getPmHolidayEndTime()       // 午後半休 終了
getStandardWorkHours()      // 標準勤務時間（数値・計算値）

// 機能フラグ（boolean で返す）
getOfficeMode()
getAttendanceStatisticsEnabled()
getWorkflowNotificationEnabled()
getTimeRecorderAnnouncementEnabled()
getHourlyPaidHolidayEnabled()
getAmPmHolidayEnabled()
getSpecialHolidayEnabled()
getAbsentEnabled()
getOverTimeCheckEnabled()
getShiftCollaborativeEnabled()

// シフト
getShiftDefaultMode()        // "normal" | "collaborative"
getShiftGroups()             // ShiftGroupConfig[]

// 入力補助
getQuickInputStartTimes()    // QuickInputTime[]（enabled なものだけ絞りたい場合は呼び出し元でフィルタ）
getQuickInputEndTimes()      // QuickInputTime[]

// テーマ
getThemeColor()              // "#RRGGBB"
getThemeTokens(override?)    // デザイントークンオブジェクト

// ワークフロー
getWorkflowCategoryOrder()   // WorkflowCategoryOrder[]

// メタデータ
getConfigId()                // string（mutation に必要）
```

---

## AppConfig の更新方法

### saveConfig（Context 経由・推奨）

```typescript
const { getConfigId, saveConfig } = useContext(AppConfigContext);

// id を渡すと update、渡さないと create になる
await saveConfig({
  id: getConfigId(),          // 既存設定の更新は必須
  themeColor: "#FF5733",
} as UpdateAppConfigInput);
```

**内部フロー**:
```
saveConfig()
  → id あり: updateAppConfigMutation
  → id なし: createAppConfigMutation
  → logOperationEvent() で操作ログ記録
  → invalidatesTags(["AppConfig"]) でキャッシュ無効化
  → useGetAppConfigQuery が自動再取得
  → AppConfigProvider が memoize 再計算
  → Context 経由の全コンポーネントが再レンダ
```

### 楽観的ロック（version による競合検出）

```typescript
// useAppConfig.ts 内部で自動適用される
const condition = buildVersionOrUpdatedAtCondition(config?.version, config?.updatedAt);
await updateAppConfig({
  input: { ...newConfig, version: getNextVersion(config?.version) },
  condition,
}).unwrap();
```

### デバウンスによる自動保存（例: ワークフロー設定）

```typescript
// useAdminWorkflowSettings.ts のパターン
useEffect(() => {
  if (!hasChanges) return;
  const timeout = setTimeout(() => {
    saveConfig({ id: getConfigId(), workflowCategoryOrder: updatedOrder });
  }, 600); // 600ms デバウンス
  return () => clearTimeout(timeout);
}, [hasChanges, updatedOrder]);
```

---

## 管理画面と対応フィールド

| 管理画面 | フィーチャー | 変更可能なフィールド |
|---|---|---|
| テーマ設定 | `src/pages/admin/AdminTheme/` | `themeColor` |
| シフト設定 | `src/features/admin-config-shift/` | `shiftGroups`, `shiftCollaborativeEnabled`, `shiftDefaultMode` |
| 勤怠設定 | `src/features/admin-config-attendance/` | `workStartTime`, `workEndTime`, `lunchRestStartTime/EndTime`, `amHolidayStartTime/EndTime`, `pmHolidayStartTime/EndTime`, `officeMode`, `quickInputStartTimes/EndTimes`, `amPmHolidayEnabled`, `hourlyPaidHolidayEnabled`, `specialHolidayEnabled`, `absentEnabled`, `overTimeCheckEnabled`, `timeRecorderAnnouncementEnabled/Message` |
| ワークフロー設定 | `src/features/admin-config-workflow/` | `workflowCategoryOrder` |

---

## 利用パターン集

### 機能フラグによる表示制御

```typescript
const { getAttendanceStatisticsEnabled } = useContext(AppConfigContext);

if (!getAttendanceStatisticsEnabled()) {
  return <Navigate to="/attendance/list" />;
}
```

### 複数フラグの組み合わせ

```typescript
const { getShiftCollaborativeEnabled, getShiftDefaultMode } = useContext(AppConfigContext);

const mode = resolveShiftRequestMode(
  getShiftDefaultMode(),         // "normal" | "collaborative"
  getShiftCollaborativeEnabled() // boolean
);
```

### クイック入力の選択肢取得

```typescript
const { getQuickInputStartTimes } = useContext(AppConfigContext);

// enabled なものだけ使う
const options = getQuickInputStartTimes().filter((t) => t.enabled);
```

### テストでの AppConfigContext モック

```typescript
const mockContextValue: React.ContextType<typeof AppConfigContext> = {
  fetchConfig: jest.fn(),
  saveConfig: jest.fn(),
  isConfigLoading: false,
  getStartTime: () => dayjs().hour(9).minute(0),
  getEndTime: () => dayjs().hour(18).minute(0),
  getStandardWorkHours: () => 8,
  getAmPmHolidayEnabled: () => true,
  getQuickInputStartTimes: () => [{ time: "09:00", enabled: true }],
  // ... 必要なゲッターのみ上書きする
};

render(
  <AppConfigContext.Provider value={mockContextValue}>
    <MyComponent />
  </AppConfigContext.Provider>
);
```

---

## プロバイダ階層

```
Redux Provider
  └─ Authenticator.Provider
       └─ SessionProvider
            └─ AppConfigProvider   ← AppConfigContext を提供
                 └─ AppRuntimeProvider
                      └─ SplitViewProvider
                           └─ <App />
```

AppConfigProvider は認証後に `useGetAppConfigQuery` で設定を取得し、全コンポーネントへ公開する。認証前には設定は取得されない。

---

## 新しい設定フィールドを追加するときの手順

1. **スキーマ変更** → AppSync / Amplify 側のスキーマを更新し `amplify codegen` を実行（自動生成ファイルが更新される）
2. **ゲッター追加** → `src/entities/app-config/model/useAppConfig.ts` にゲッター関数を追加
3. **Context 型更新** → `src/context/AppConfigContext.tsx` の型定義にゲッターを追加
4. **管理 UI 追加** → 対応する `src/features/admin-config-*/` にフォーム項目を追加
5. **saveConfig 呼び出し** → 管理画面から `saveConfig({ id: getConfigId(), newField: value })` で保存
