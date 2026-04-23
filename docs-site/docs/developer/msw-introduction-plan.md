---
title: MSW（Mock Service Worker）導入計画
sidebar_label: MSW 導入計画
---

# MSW（Mock Service Worker）導入計画

## 概要

現在、garaku-frontend のテストでは GraphQL API 呼び出しを `jest.mock()` で個別にモックしています。
[MSW（Mock Service Worker）](https://mswjs.io/) を導入することで、API レベルのモックを一元管理し、
テストの保守性と信頼性を向上させることができます。

## 現状の課題

- 各テストファイルで `jest.mock("@entities/xxx/api/xxxApi", ...)` を繰り返し記述している
- RTK Query フックのモックが煩雑で、テストごとに微妙に異なる実装になりやすい
- コンポーネントテストで実際の HTTP/GraphQL レイヤーをテストできない
- ストーリーブック（Storybook）やブラウザ上の動作確認でも同じハンドラーを再利用できない

## MSW とは

MSW は Service Worker（またはNode.js環境）を使い、実際のネットワークリクエストをインターセプトして
モックレスポンスを返すライブラリです。

- **jest環境**: `msw/node` の `setupServer` を使ってネットワークをインターセプト
- **ブラウザ環境**: Service Worker 経由でインターセプト（Storybook や `npm start` でも使用可能）

## インストール手順

```bash
npm install --save-dev msw
```

`package.json` の `devDependencies` に追加されます。

## セットアップ手順

### 1. ハンドラー定義ファイルの作成

```
src/shared/test-utils/
├── msw/
│   ├── handlers/
│   │   ├── attendanceHandlers.ts   # 勤怠 API ハンドラー
│   │   ├── shiftHandlers.ts        # シフト API ハンドラー
│   │   ├── workflowHandlers.ts     # ワークフロー API ハンドラー
│   │   └── index.ts                # 全ハンドラーのまとめ
│   └── server.ts                   # Jest 用サーバーセットアップ
```

```typescript
// src/shared/test-utils/msw/handlers/attendanceHandlers.ts
import { graphql, HttpResponse } from "msw";

export const attendanceHandlers = [
  graphql.query("GetAttendance", () => {
    return HttpResponse.json({
      data: {
        getAttendance: {
          __typename: "Attendance",
          id: "mock-attendance-id",
          // ...
        },
      },
    });
  }),

  graphql.mutation("CreateAttendance", () => {
    return HttpResponse.json({
      data: {
        createAttendance: {
          __typename: "Attendance",
          id: "new-attendance-id",
          // ...
        },
      },
    });
  }),
];
```

### 2. Jest サーバーセットアップ

```typescript
// src/shared/test-utils/msw/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### 3. setupTests.ts への追加

```typescript
// src/setupTests.ts に追加
import { server } from "@shared/test-utils/msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4. テストでの使い方

```typescript
// テストファイル
import { server } from "@shared/test-utils/msw/server";
import { graphql, HttpResponse } from "msw";

it("エラー時にエラーメッセージを表示する", async () => {
  // このテストだけ特定のハンドラーを上書き
  server.use(
    graphql.query("GetAttendance", () => {
      return HttpResponse.json({
        errors: [{ message: "Network error" }],
      });
    }),
  );

  renderWithProviders(<AttendanceList />);
  await screen.findByText("エラーが発生しました");
});
```

## AppSync（GraphQL over HTTPS）との統合

AppSync は通常の GraphQL over HTTPS で通信します。MSW の `graphql` ハンドラーはエンドポイント URL に関係なく
GraphQL リクエストをインターセプトできます。

AppSync の Subscription（WebSocket）は MSW では現在完全にはサポートされていないため、
Subscription のテストは引き続き `jest.mock()` を使用するか、
`createSubscriptionMock()` ヘルパー（`@shared/test-utils` に既に実装済み）を活用してください。

## 移行戦略

段階的に既存テストを MSW ベースへ移行することを推奨します：

1. **Phase 1**: MSW のインストールとセットアップ（`server.ts`, `setupTests.ts` 更新）
2. **Phase 2**: よく使われる API（勤怠 CRUD, スタッフ取得）のハンドラーを作成
3. **Phase 3**: 新規テストから MSW ハンドラーを使用するよう方針化
4. **Phase 4**: 既存テストの `jest.mock()` を段階的にハンドラーへ移行

## 参考リンク

- [MSW 公式ドキュメント](https://mswjs.io/docs/)
- [MSW + Jest セットアップガイド](https://mswjs.io/docs/integrations/node)
- [GraphQL ハンドラー](https://mswjs.io/docs/network-behavior/graphql)
