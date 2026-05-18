---
applyTo: "src/**/*.test.{ts,tsx},playwright/**/*.spec.ts"
---

# テストガイドライン

## 1. テストピラミッドと責務分担

```
         /‾‾‾‾‾‾‾‾‾‾‾\
        /   E2E (少)   \        Playwright
       /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
      / Integration (中)  \     Jest + RTL
     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
    /    Unit (多)          \   Jest
   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

| 層 | ツール | 何をテストするか |
|----|--------|-----------------|
| **Unit** | Jest | 純粋関数・バリデーション・lib/model・hooks（ロジック部分） |
| **Integration** | Jest + RTL | コンポーネントのレンダリング・ユーザー操作・複数コンポーネントの連携 |
| **E2E** | Playwright | 主要な業務フロー全体（ログイン→操作→確認）のエンドツーエンド検証 |

### 各層でテストしないこと

- **Unit**: DOM・ルーティング・外部 API の実際の通信
- **Integration**: データベース・実際のネットワーク通信
- **E2E**: 細かい条件分岐（Unit/Integration でカバーする）

---

## 2. ファイル配置・命名規約

### ユニットテスト / 統合テスト（Jest）

対象ファイルと同階層に `__tests__/` ディレクトリを作成して配置する。

```
src/features/attendance/edit/model/
├── useAttendanceEditor.ts
└── __tests__/
    └── useAttendanceEditor.test.ts

src/entities/attendance/lib/
├── AttendanceTime.ts
└── __tests__/
    └── AttendanceTime.test.ts
```

シンプルな shared UI コンポーネントは同ディレクトリに並べてもよい。

```
src/shared/ui/button/
├── AppButton.tsx
└── AppButton.test.tsx
```

### E2E テスト（Playwright）

```
playwright/tests/
├── smoke-test.spec.ts          # 全ページのエラー検出
├── attendance/
│   └── flow.spec.ts            # 勤怠フロー
└── shift/
    └── flow.spec.ts            # シフトフロー
```

新機能の E2E テストは `playwright/tests/<機能名>/flow.spec.ts` に作成する。

### describe / it の書き方

```typescript
// describe: テスト対象のクラス名・関数名・コンポーネント名
describe("AttendanceTime", () => {
  // it / test: 「〇〇の場合、〇〇すること」形式（日本語）
  it("開始時刻が終了時刻より後の場合、エラーを返すこと", () => { ... });
  it("正常な時刻を渡した場合、HH:mm 形式で表示されること", () => { ... });
});

describe("useAttendanceEditor", () => {
  it("初期値が AppConfig から正しく読み込まれること", async () => { ... });
  it("保存に失敗した場合、エラーメッセージが表示されること", async () => { ... });
});
```

---

## 3. 共有テストユーティリティ

`src/shared/test-utils/` に共通ユーティリティが用意されている。  
React Router・Redux・AppConfigContext・AuthContext を含むプロバイダー一式を自動でラップする。

### `renderWithProviders`

コンポーネントテストの基本。素の `render` の代わりに使う。

```typescript
import { renderWithProviders } from "@shared/test-utils";

it("勤怠一覧が表示されること", () => {
  renderWithProviders(<AttendanceList />);
  expect(screen.getByRole("table")).toBeInTheDocument();
});

// Redux の初期状態を上書きしたい場合
renderWithProviders(<AttendanceList />, {
  preloadedState: {
    notification: { message: "テスト通知", type: "success" },
  },
});

// React Router の初期パスを指定したい場合
renderWithProviders(<AttendanceList />, {
  initialEntries: ["/attendance/list?date=2024-12-01"],
});
```

### `createMockAppConfig`

AppConfig のモックデータを生成する。一部フィールドだけ上書き可能。

```typescript
import { createMockAppConfig } from "@shared/test-utils";

const config = createMockAppConfig({
  workStartTime: "09:00",
  workEndTime: "18:00",
  breakAutoInsert: true,
});
```

### `createMockUser` / `createMockAttendance`

エンティティのモックデータを生成するファクトリ関数。

```typescript
import { createMockUser, createMockAttendance } from "@shared/test-utils";

const user = createMockUser({ staffId: "staff-001", name: "山田太郎" });
const attendance = createMockAttendance({
  date: "2024-12-01",
  clockIn: "09:00",
  clockOut: "18:00",
});
```

### 重複防止ポリシー（anti-regression）

- 同じ Arrange（モック生成・初期 state・provider 設定）を **3回以上** 書いたら、`setupXxx()` helper か factory へ抽出する
- ドメインデータは手書きオブジェクトを増やさず、まず `createMockUser` / `createMockAttendance` / `createMockAppConfig` を使う
- 入力と期待値の組み合わせだけが違うテストは `test.each` で表形式に寄せる（1ケース1 `it` のコピペを避ける）
- 同じ挙動を Unit と Integration に二重で書かない。ロジック詳細は Unit、画面連携は Integration に責務分離する

---

## 4. `jest.mock` の標準パターン

### ファイルトップで宣言する（ホイスティング対応）

`jest.mock()` は自動的にファイルの先頭に巻き上げられる。  
モック関数への参照が必要な場合はファクトリ外で変数を宣言する。

```typescript
// ✅ 正しいパターン
const fetchAttendanceMock = jest.fn();

jest.mock("@/entities/attendance/api/fetchAttendance", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchAttendanceMock(...args),
}));

describe("...", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAttendanceMock.mockResolvedValue({ items: [] });
  });
});
```

### モジュール全体モック vs 部分モック

```typescript
// モジュール全体をモック（外部 API・副作用のある処理）
jest.mock("@/entities/attendance/api/fetchAttendance");

// 部分モック（一部の関数だけモックしたい場合）
jest.mock("@/shared/lib/date", () => ({
  ...jest.requireActual("@/shared/lib/date"),
  getCurrentDate: () => "2024-12-01",
}));
```

### `jest.spyOn` を使うケース

実装を置き換えたくない（実際の処理を実行しながら呼び出しだけ検証したい）場合に使う。

```typescript
it("エラー時に console.error が呼ばれること", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  // ...テスト処理...
  expect(spy).toHaveBeenCalledWith(expect.stringContaining("エラー"));
  spy.mockRestore(); // afterEach でまとめて復元してもよい
});
```

### 避けるべきパターン

```typescript
// ❌ 実装詳細のテスト（内部の状態変数名・関数名に依存）
expect(component.state.internalFlag).toBe(true);

// ❌ 過度なモック（ほぼすべてをモックして何もテストしていない状態）
jest.mock("../MyComponent");
jest.mock("../utils/validate");
jest.mock("../hooks/useData");
// → ロジックが全部モックされると「呼ばれたか」しか確認できない

// ✅ ユーザー視点でテストする
expect(screen.getByText("保存しました")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
```

---

## 5. React Hooks のテスト

### `renderHook` + `act` の基本

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "../useCounter";

it("increment を呼ぶとカウントが増えること", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### プロバイダーが必要な hooks

```typescript
import { renderHook } from "@testing-library/react";
import { createWrapper } from "@shared/test-utils"; // renderWithProviders のラッパー版

it("AppConfig の workStartTime が取得できること", () => {
  const { result } = renderHook(() => useAppConfig(), {
    wrapper: createWrapper({ appConfig: createMockAppConfig() }),
  });

  expect(result.current.workStartTime).toBe("09:00");
});
```

### 非同期フックのテスト

```typescript
import { renderHook, waitFor } from "@testing-library/react";

it("データ取得後に items がセットされること", async () => {
  fetchAttendanceMock.mockResolvedValue({ items: [createMockAttendance()] });

  const { result } = renderHook(() => useAttendanceList());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.items).toHaveLength(1);
});
```

---

## 6. Playwright E2E テスト規約

### 認証状態の使い方

`playwright/.auth/` に保存された認証済みストレージを利用する。  
`playwright.config.ts` のプロジェクト設定で自動適用されるため、テスト内でログイン操作は不要。

| プロジェクト | ストレージ | 用途 |
|---|---|---|
| `chromium-staff` | `playwright/.auth/user.json` | スタッフ権限での操作 |
| `chromium-admin` | `playwright/.auth/admin.json` | 管理者権限での操作 |

```typescript
// playwright.config.ts で設定済みのため、テストファイルへの追記は不要
// 初回またはセッション期限切れ時は再生成する
// npm run test:e2e:setup
```

### `test.step()` で操作をグルーピング

```typescript
import { test, expect } from "@playwright/test";

test("勤怠を編集して保存できること", async ({ page }) => {
  await test.step("勤怠編集ページに遷移する", async () => {
    await page.goto("/attendance/edit/2024-12-01");
    await page.waitForLoadState("networkidle");
  });

  await test.step("出勤時刻を変更する", async () => {
    await page.getByTestId("clock-in-input").fill("09:30");
  });

  await test.step("保存して完了メッセージを確認する", async () => {
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("保存しました")).toBeVisible();
  });
});
```

### `data-testid` を活用したロケーター

動的なテキストやスタイルに依存しないよう、重要な操作対象には `data-testid` 属性を付与する。

```tsx
// コンポーネント側
<button data-testid="attendance-save-button" onClick={handleSave}>
  保存
</button>

// テスト側
await page.getByTestId("attendance-save-button").click();
```

ロケーターの優先順位:

1. `getByRole`（アクセシビリティ的に最も望ましい）
2. `getByLabel` / `getByPlaceholder`
3. `getByTestId`（上記で特定できない場合）
4. `locator("css selector")`（最終手段）

### ネットワーク応答待ち

```typescript
// ページ遷移後の API 完了待ち
await page.goto("/attendance/list");
await page.waitForLoadState("networkidle");

// 特定の API レスポンスを待つ
const responsePromise = page.waitForResponse("**/graphql");
await page.getByRole("button", { name: "検索" }).click();
await responsePromise;

// 要素の表示を待つ（推奨）
await expect(page.getByRole("table")).toBeVisible();
```

---

## 7. カバレッジ目標

### 現在の閾値（`jest.config.cjs`）

| 指標 | 閾値 |
|------|------|
| statements | 60% |
| branches | 50% |
| functions | 60% |
| lines | 60% |

### 運用ルール

- **新規コードは原則としてユニットテストを追加する**
- ビジネスロジック・バリデーション関数は **80% 以上** を目標とする
- UI コンポーネントは主要な表示パターン（正常・エラー・ローディング）をカバーする
- カバレッジ閾値を下回る PR はマージしない

```bash
# カバレッジレポートを生成して確認
npm run test:coverage
```

---

## 8. よくある間違いと対処法

### `describe.skip` / `test.skip` には必ず理由を書く

```typescript
// ❌ 理由なしの skip
test.skip("複雑な操作ができること", () => { ... });

// ✅ 理由とチケット番号を記載
test.skip("複雑な操作ができること", () => {
  // TODO: #123 AppConfig モックの整備が完了したら有効化する
  ...
});
```

### テスト内に `console.log` を残さない

```typescript
// ❌
it("値が変換されること", () => {
  const result = transform(input);
  console.log(result); // レビュー時に削除漏れが発生しやすい
  expect(result).toBe("expected");
});

// ✅ デバッグが必要な場合は screen.debug() を使う（RTL）
screen.debug(); // DOM ツリーを標準出力に表示（コミット前に削除）
```

### `afterEach` でクリーンアップし、テスト間の副作用を防ぐ

```typescript
describe("MyComponent", () => {
  afterEach(() => {
    jest.clearAllMocks();       // モック呼び出し履歴のリセット
    jest.restoreAllMocks();     // spyOn で置き換えた実装の復元
    cleanup();                  // RTL: @testing-library/react は自動 cleanup だが明示してもよい
  });
});
```

### 非同期処理は `waitFor` / `findBy*` で待つ

```typescript
// ❌ 即時評価（非同期更新を見逃す）
fireEvent.click(button);
expect(screen.getByText("完了")).toBeInTheDocument();

// ✅ 非同期完了を待ってから評価
await userEvent.click(button);
expect(await screen.findByText("完了")).toBeInTheDocument();

// または
await waitFor(() => {
  expect(screen.getByText("完了")).toBeInTheDocument();
});
```

### `userEvent` を `fireEvent` より優先する

```typescript
// ❌ fireEvent: 実際のブラウザ動作と乖離することがある
fireEvent.change(input, { target: { value: "09:00" } });

// ✅ userEvent: キーボード入力・フォーカス・ブラーなどを含む実際の操作を再現
await userEvent.type(input, "09:00");
await userEvent.click(button);
```
