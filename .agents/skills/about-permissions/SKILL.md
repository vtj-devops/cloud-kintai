---
name: about-permissions
description: >
  garaku-frontend（クラウド勤怠）の権限・ロール・認可システムに関するスキル。
  「権限」「ロール」「管理者」「認可」「ガード」「isAdmin」「AdminGuard」「StaffRole」「アクセス制御」
  「スタッフ管理者」「オペレーター」「ルート保護」「Cognito グループ」などのキーワードが含まれる場合は
  必ずこのスキルを参照すること。権限チェックの実装・追加・修正、管理者専用 UI の実装、
  ロールに基づく表示切り替えなどの作業でも積極的に使用すること。
---

# garaku-frontend 権限・ロール・認可システム

このドキュメントは、garaku-frontend の権限・ロール体系と認可の実装パターンをまとめたものです。

---

## 1. ロール体系（StaffRole）

**定義場所**: `src/entities/staff/model/useStaffs/useStaffs.ts`

```typescript
export enum StaffRole {
  OWNER      = "Owner",      // オーナー（最上位）
  ADMIN      = "Admin",      // 管理者
  STAFF_ADMIN = "StaffAdmin",// スタッフ管理者
  STAFF      = "Staff",      // 一般スタッフ
  GUEST      = "Guest",      // ゲスト（グループ未割当）
  OPERATOR   = "Operator",   // オペレーター（QR打刻専用）
  NONE       = "None",       // 未設定
}

export const roleLabelMap = new Map<StaffRole, string>([
  [StaffRole.OWNER,       "オーナー"],
  [StaffRole.ADMIN,       "管理者"],
  [StaffRole.STAFF_ADMIN, "スタッフ管理者"],
  [StaffRole.STAFF,       "スタッフ"],
  [StaffRole.GUEST,       "ゲスト"],
  [StaffRole.OPERATOR,    "オペレーター"],
  [StaffRole.NONE,        "未設定"],
]);
```

---

## 2. ロール別の権限一覧

| 操作 | OWNER | ADMIN | STAFF_ADMIN | STAFF | OPERATOR | GUEST |
|------|:-----:|:-----:|:-----------:|:-----:|:--------:|:-----:|
| 管理画面アクセス | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| スタッフ管理 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ワークフロー承認 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| シフト確定（ロック） | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 勤怠打刻・一覧 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| シフト申請 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| QR表示（/office/qr） | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### OPERATOR の特殊仕様
- QR表示（`/office/qr`）専用ロール
- オフィスモード（`AppConfig.officeMode`）が有効の場合のみメニューに表示
- 打刻・勤怠一覧などの通常メニューは一切表示されない
- `/register` アクセス時は `/office/qr` へリダイレクト

---

## 3. Cognito グループとのマッピング

**定義場所**: `src/hooks/useCognitoUser.ts`

ID トークンの `cognito:groups` からロールを抽出する。

| Cognito グループ名 | StaffRole |
|-------------------|-----------|
| `Admin` | `StaffRole.ADMIN` |
| `StaffAdmin` | `StaffRole.STAFF_ADMIN` |
| `Staff` | `StaffRole.STAFF` |
| `Operator` | `StaffRole.OPERATOR` |
| (グループなし / その他) | `StaffRole.GUEST` |

また `custom:owner` カスタム属性（`"1"` or `1` or `true`）で Owner フラグを管理している。

```typescript
export interface CognitoUser {
  id: string;
  givenName: string;
  familyName: string;
  mailAddress: string;
  owner: boolean;
  roles: StaffRole[];
  emailVerified: boolean;   // メール認証済みフラグ（未認証は自動ログアウト）
}
```

---

## 4. 権限チェック関数・フック

### 基本的な使い方（推奨）

```typescript
import { useSession } from "@app/providers/session/useSession";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";

function MyComponent() {
  const { hasRole } = useSession();

  const isAdmin = hasRole(StaffRole.ADMIN);
  const isStaffAdmin = hasRole(StaffRole.STAFF_ADMIN);
}
```

### 関数一覧

| 関数 / フック | 場所 | シグネチャ | 用途 |
|--------------|------|-----------|------|
| `useSession()` | `src/app/providers/session/useSession.ts` | `() => { hasRole, ... }` | セッション情報 + 権限チェック取得 |
| `hasRole` | SessionProvider 経由 | `(role: StaffRole) => boolean` | **最推奨**。コンポーネント内での権限チェック |
| `isCognitoUserRole` | `src/hooks/useCognitoUser.ts` | `(role: StaffRole) => boolean` | `hasRole` の内部実装 |
| `useAuthSessionSummary()` | `src/hooks/useAuthSessionSummary.ts` | `() => { isCognitoUserRole, ... }` | セッション概要取得（軽量） |
| `isAdminRole()` | `src/features/workflow/notifications/` | `(role?: string \| null) => boolean` | ワークフロー通知の文字列ロール判定用 |

---

## 5. 管理者判定パターン（isAdmin の定義）

文脈によって使い分ける。**シフト・ワークフロー・管理画面共通**では OWNER も含める。

### パターン A：ADMIN のみ（ルートガード用）

```typescript
// AdminGuard では ADMIN のみ
const isAdmin = hasRole(StaffRole.ADMIN);
```

### パターン B：ADMIN + STAFF_ADMIN（ナビゲーション用）

```typescript
const isAdminUser =
  isCognitoUserRole(StaffRole.ADMIN) ||
  isCognitoUserRole(StaffRole.STAFF_ADMIN);
```

### パターン C：ADMIN + STAFF_ADMIN + OWNER（シフト管理用・推奨）

```typescript
const isAdmin =
  isCognitoUserRole(StaffRole.ADMIN) ||
  isCognitoUserRole(StaffRole.STAFF_ADMIN) ||
  isCognitoUserRole(StaffRole.OWNER);
```

> **注意**: シフトの確定（ロック/アンロック）など管理者操作を追加する場合は **パターン C** を使うこと。
> UI バイパスを防ぐため、ロジック層でも isAdmin チェックをダブルガードとして維持する。

---

## 6. ルートガード

### AdminGuard（`/admin` 配下の保護）

**ファイル**: `src/pages/admin/AdminGuard.tsx`

```typescript
export default function AdminGuard() {
  const { isCognitoUserRole } = useContext(AuthContext);

  if (!isCognitoUserRole(StaffRole.ADMIN)) {
    return <NotFound />;
  }

  return <Outlet />;
}
```

- `/admin` 以下はすべてこのガードを通す
- ADMIN ロールのみ許可（STAFF_ADMIN / OWNER も除外される点に注意）
- 権限なし → `<NotFound />` 表示（リダイレクトではなく）

### ルーティング定義（`src/router.tsx`）

```typescript
{
  path: "/admin",
  lazy: AdminGuardRoute,         // ← AdminGuard を適用
  loader: loadAdminDashboardLoader,
  children: [
    {
      path: "",
      lazy: AdminLayoutRoute,
      children: adminChildRoutes,
    },
  ],
}
```

---

## 7. 未認証ユーザーのリダイレクト

**ファイル**: `src/Layout.tsx`

```typescript
if (authStatus === "unauthenticated") {
  navigate("/login", {
    replace: true,
    state: {
      from: `${location.pathname}${location.search}${location.hash}`,
    },
  });
}
```

- リダイレクト先: `/login`
- 元のページは `state.from` に保存（ログイン後の遷移に使用可能）
- メール未認証の場合は自動サインアウト + alert 表示

---

## 8. 管理者専用 UI の実装パターン

### 条件付き表示

```typescript
const { hasRole } = useSession();
const isAdmin = hasRole(StaffRole.ADMIN) || hasRole(StaffRole.STAFF_ADMIN);

return (
  <>
    {isAdmin && <AdminOnlyButton />}
  </>
);
```

### Props での権限渡し（シフト共同編集の例）

```typescript
<VirtualizedShiftTable
  isAdmin={isAdmin}
  canUnlock={isAdmin}
  showLock={hasUnlocked && isAdmin}
  onLockStaffRow={handleLockStaffRow}
  onUnlockStaffRow={handleUnlockStaffRow}
/>
```

### ナビゲーションメニューのロール分岐（`src/widgets/layout/header/NavigationMenu.tsx`）

```typescript
if (isAdminUser) {
  return [...filteredMenuList, ...operatorMenuList];
}
if (isCognitoUserRole(StaffRole.STAFF)) {
  return filteredMenuList;
}
if (isCognitoUserRole(StaffRole.OPERATOR)) {
  return operatorMenuList;  // QR表示のみ
}
return [];  // GUEST / NONE は空
```

---

## 9. プロバイダ階層

```
<Provider store={store}>
  <Authenticator.Provider>
    <SessionProvider>           ← 権限情報はここで管理
      <AppConfigProvider>
        <AppRuntimeProvider>
          <SplitViewProvider>
            {children}
          </SplitViewProvider>
        </AppRuntimeProvider>
      </AppConfigProvider>
    </SessionProvider>
  </Authenticator.Provider>
</Provider>
```

`SessionProvider` で `hasRole` / `isCognitoUserRole` を提供し、`AuthContext` 経由でアプリ全体に配布する。

---

## 10. よくある実装例

### 管理者チェック付きボタン

```typescript
import { useSession } from "@app/providers/session/useSession";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";

function LockButton({ onLock }: { onLock: () => void }) {
  const { hasRole } = useSession();
  const isAdmin =
    hasRole(StaffRole.ADMIN) ||
    hasRole(StaffRole.STAFF_ADMIN) ||
    hasRole(StaffRole.OWNER);

  if (!isAdmin) return null;

  return <AppButton onClick={onLock}>確定</AppButton>;
}
```

### ルート内での権限ガード

```typescript
// 管理者専用ページコンポーネント
export default function AdminOnlyPage() {
  const { hasRole } = useSession();

  if (!hasRole(StaffRole.ADMIN)) {
    return <NotFound />;
  }

  return <PageContent />;
}
```
