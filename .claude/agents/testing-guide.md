---
name: testing-guide
description: Use this agent when writing, reviewing, or debugging tests. Knows the project's test stack (Jest + Playwright), file placement conventions, mock patterns, testing-library usage, and coverage requirements. Invoke when asked to add tests, fix failing tests, or determine what/how to test.
---

# Testing Guide — garaku-frontend

英語で考えて、日本語で説明してください。

このプロジェクトは **Jest**（ユニット/統合）と **Playwright**（E2E）の 2 層テスト戦略を採用しています。

---

## テストコマンド

```bash
npm run test:unit          # Jest 実行（--passWithNoTests）
npm run test:watch         # Jest ウォッチモード
npm run test:coverage      # カバレッジレポート生成

npx jest src/path/to/file.test.tsx   # 特定ファイルのみ実行

# E2E（初回はブラウザインストールが必要）
npx playwright install --with-deps
npm run test:e2e:setup                          # 認証状態を playwright/.auth/ に生成
npm run test:e2e -- smoke-test --project=chromium-staff
npm run test:e2e -- smoke-test --project=chromium-admin
```

**pre-push フック**（`.githooks`）: push 前に `npm run typecheck && npm run test:unit` が自動実行される。

---

## テストスタック

| 用途             | ツール                                         |
| ---------------- | ---------------------------------------------- |
| ユニット/統合    | Jest 30 + ts-jest + jsdom                      |
| コンポーネント   | @testing-library/react + @testing-library/jest-dom |
| ユーザー操作     | @testing-library/user-event                    |
| E2E              | Playwright 1.56                                |
| カバレッジ       | Jest coverage（閾値: statements/functions/lines 50%, branches 40%） |

---

## テストファイルの配置規則

### パターン A（推奨）: `__tests__/` ディレクトリ

ロジック・hooks・API・複雑なコンポーネントはソースファイルと同階層に `__tests__/` を作る。

```
src/entities/attendance/lib/
├── AttendanceTime.ts
└── __tests__/
    └── AttendanceTime.test.ts

src/features/attendance/edit/ui/
├── AttendanceEditor.tsx
└── __tests__/
    └── AttendanceEditor.buttons.test.tsx
```

### パターン B: 同一ディレクトリ

シンプルな shared UI コンポーネントは同ディレクトリに並べる。

```
src/shared/ui/button/
├── AppButton.tsx
└── AppButton.test.tsx
```

### レイヤー別テスト分布の目安

| レイヤー    | テスト対象                                |
| ----------- | ----------------------------------------- |
| `entities/` | API utilities, hooks, lib/model（純粋関数中心） |
| `features/` | UI コンポーネント, hooks, lib/model       |
| `pages/`    | ページコンポーネント統合テスト            |
| `shared/`   | 汎用 UI コンポーネント, lib utilities     |

---

## Jest テストの書き方

### ユニットテスト（純粋関数）

```typescript
import { AttendanceTime } from "../AttendanceTime";

describe("AttendanceTime", () => {
  it("HH:mm と日付から初期化し、表示形式と ISO を返す", () => {
    const instance = new AttendanceTime("09:00", "2024-12-25");
    expect(instance.toDisplay()).toBe("09:00");
    expect(instance.toISO()).toContain("2024-12-25T");
  });

  it("不正な HH:mm 入力で例外をスローする", () => {
    expect(() => new AttendanceTime("9:00", "2024-12-25")).toThrow(/Invalid time format/);
  });
});
```

### コンポーネントテスト（React Testing Library）

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppButton } from "../AppButton";

describe("AppButton", () => {
  it("loading 時は無効化しスピナーを表示する", () => {
    render(<AppButton loading>保存</AppButton>);
    const button = screen.getByRole("button", { name: "保存" });
    expect(button).toBeDisabled();
    expect(button.querySelector(".app-button__spinner")).toBeInTheDocument();
  });

  it("クリックイベントを発火する", async () => {
    const handleClick = jest.fn();
    render(<AppButton onClick={handleClick}>実行</AppButton>);
    await userEvent.click(screen.getByRole("button", { name: "実行" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### モックパターン

**モジュールモック:**
```typescript
const fetchOperationLogsMock = jest.fn();

jest.mock("@/entities/operation-log/model/fetchOperationLogs", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchOperationLogsMock(...args),
}));

// 子コンポーネントのスタブ化
jest.mock("@/entities/operation-log/ui/OperationLogJsonDetails", () => ({
  OperationLogJsonDetails: () => <div>json details</div>,
}));

describe("...", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchOperationLogsMock.mockResolvedValue({ items: [] });
  });
});
```

**React Router のモック:**
```typescript
import { MemoryRouter } from "react-router-dom";

render(
  <MemoryRouter>
    <MyComponent />
  </MemoryRouter>
);
```

---

## グローバルセットアップ（`src/setupTests.ts`）

以下は全テストで自動的にモック済み。個別テストで再モックは不要:

- `@testing-library/jest-dom` の matcher（`toBeInTheDocument` 等）
- `TextEncoder` / `TextDecoder` ポリフィル
- `fetch` の `Headers`, `Request` モック
- `import.meta.env`（Vite 環境変数）
- **AWS Amplify** の `graphqlClient`, `adminQueriesClient`, `generateClient`

---

## Jest 設定（`jest.config.cjs`）

- 環境: `jsdom`
- プリセット: `ts-jest`
- パスエイリアス: `@/*`, `@features/*`, `@entities/*`, `@shared/*` 等すべて対応済み
- CSS/画像: `identity-obj-proxy` / `fileMock.js` でスタブ化
- カバレッジ閾値:
  - statements: 50%
  - functions: 50%
  - lines: 50%
  - branches: 40%

---

## Playwright E2E テスト

### ディレクトリ構成

```
playwright/
├── tests/
│   ├── smoke-test.spec.ts              # 全ページエラー検出
│   ├── seed.spec.ts                    # セットアップ/認証
│   ├── attendance/flow.spec.ts         # 勤怠フロー
│   ├── office/flow.spec.ts             # オフィス機能
│   ├── shift-collaborative-offline.spec.ts
│   ├── permission.spec.ts              # ロールベースアクセス制御
│   ├── attendanceValidation.spec.ts
│   ├── visual-regression.spec.ts
│   └── visual-regression-advanced.spec.ts
└── .auth/
    ├── user.json                       # スタッフユーザー認証状態
    └── admin.json                      # 管理者ユーザー認証状態
```

### プロジェクト（ロール別）

| プロジェクト名    | 認証ロール | 用途               |
| ----------------- | ---------- | ------------------ |
| `chromium-staff`  | スタッフ   | スタッフ操作の E2E |
| `chromium-admin`  | 管理者     | 管理者操作の E2E   |
| `setup`           | —          | 認証状態の生成     |

### E2E テストの書き方例

```typescript
import { test, expect } from "@playwright/test";

test("勤怠一覧ページが正常に表示される", async ({ page }) => {
  await page.goto("/attendance/list");
  await expect(page.getByRole("heading", { name: "勤怠一覧" })).toBeVisible();
  // コンソールエラーがないことを確認
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  expect(errors).toHaveLength(0);
});
```

---

## テスト種別の使い分け

| テスト種別         | 対象                                         | ツール      |
| ------------------ | -------------------------------------------- | ----------- |
| ユニットテスト     | 純粋関数・クラス・バリデーションロジック     | Jest        |
| コンポーネントテスト | UI コンポーネント・hooks・フォームの動作     | Jest + RTL  |
| 統合テスト         | ページコンポーネント・複数コンポーネント連携 | Jest + RTL  |
| E2E テスト         | ユーザーフロー・ロール権限・ビジュアル確認   | Playwright  |

---

## よくある注意点

- **`__mocks__/fileMock.js`**: CSS modules / 画像は自動スタブ化済み。個別 mock 不要
- **Amplify GraphQL**: `setupTests.ts` でグローバルモック済み。API 呼び出し部分のみ `jest.fn()` で差し替える
- **非同期処理**: `waitFor`, `findBy*` クエリを使う（`act` の直接使用は避ける）
- **`userEvent` vs `fireEvent`**: 実際のユーザー操作に近い `userEvent` を優先する
- **テスト分割**: ファイルが大きくなる場合は `ComponentName.buttons.test.tsx` のようにサフィックスで分割可能
