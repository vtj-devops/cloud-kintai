---
sidebar_position: 20
title: データフェッチパターン
description: RTK Query を中心とした、entities/features 層のデータ取得・状態管理パターンをまとめたガイド。
---

# データフェッチパターン

本ドキュメントは、garaku-frontend におけるデータ取得パターンのベストプラクティスをまとめたものです。実装の一貫性を保ち、新規機能追加時の設計判断を助けることを目的としています。

---

## 全体方針

| 状態の種類 | 使用ツール | 具体例 |
|------------|-----------|--------|
| **サーバー状態**（API データ） | RTK Query | 勤怠一覧、シフトデータ |
| **グローバル UI 状態** | Redux Slice（`notificationSlice`） | トースト通知 |
| **ローカルコンポーネント状態** | `useState` | フォーム入力値、モーダル開閉 |
| **副作用の安定参照** | `useRef` | コールバック安定化、レースコンディション防止 |

> **サーバーから取得したデータを Redux の通常 slice に入れない。** RTK Query のキャッシュが唯一の真実源となる。

---

## entities 層での API 定義

### 基本パターン

`src/entities/{domain}/api/{domain}Api.ts` に `createApi` で API を定義する。

```typescript
// src/entities/attendance/api/attendanceApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["Attendance"],
  endpoints: (builder) => ({
    getAttendanceByStaffAndDate: builder.query<Attendance, { staffId: string; workDate: string }>({
      async queryFn({ staffId, workDate }, _queryApi, _extraOptions, baseQuery) {
        // queryFn で複雑なロジックを実装できる
        const result = await baseQuery({
          document: getAttendanceDocument,
          variables: { staffId, workDate },
        });
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
      providesTags: (result, _error, arg) => [
        { type: "Attendance", id: `${arg.staffId}#${arg.workDate}` },
      ],
    }),
  }),
});

// フックをエクスポート（命名規則: use + エンドポイント名 + Query/Mutation）
export const {
  useGetAttendanceByStaffAndDateQuery,
  useLazyGetAttendanceByStaffAndDateQuery,
} = attendanceApi;
```

### `queryFn` vs `query` の使い分け

| 方式 | 用途 |
|------|------|
| `query` | シンプルな GraphQL 呼び出し（変数をそのまま渡す） |
| `queryFn` | ページネーション処理・複数クエリ結合・カスタムエラーハンドリングが必要な場合 |

### キャッシュタグ設計

```typescript
// 細かいタグ: IDベースの無効化
providesTags: (result, _error, arg) => [
  { type: "Attendance", id: `${arg.staffId}#${arg.workDate}` },
]

// Mutation 後に関連キャッシュを無効化
invalidatesTags: (result, _error, arg) => [
  { type: "Attendance", id: `${arg.staffId}#${arg.workDate}` },
]
```

---

## GraphQL/AppSync の呼び出し方法

### graphqlBaseQuery

すべての RTK Query API は `src/shared/api/graphql/graphqlBaseQuery.ts` が提供する `graphqlBaseQuery()` を `baseQuery` として使用する。

```typescript
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";

export const myApi = createApi({
  reducerPath: "myApi",
  baseQuery: graphqlBaseQuery(),
  // ...
});
```

`graphqlBaseQuery` は内部で AWS Amplify の GraphQL クライアントを呼び出し、エラーを RTK Query 互換の形式に変換する。

### Lite クエリ（フィールド削減）

大量データ取得時はカスタム GraphQL ドキュメントでフィールドを限定する（`shiftApi.ts` パターン）：

```typescript
// 必要なフィールドのみを取得するカスタムクエリ文字列
const listShiftRequestsLite = /* GraphQL */ `
  query ListShiftRequestsLite($filter: ModelShiftRequestFilterInput) {
    listShiftRequests(filter: $filter) {
      items {
        id
        staffId
        targetMonth
        entries { date status isLocked }
      }
    }
  }
`;
```

> **注意**: `src/shared/api/graphql/` の自動生成ファイルは手動編集禁止。フィールド削減が必要な場合は上記のようにカスタム文字列を定義する。

---

## features 層でのデータフェッチフック

### パターン 1: 宣言的クエリ（推奨）

RTK Query フックを直接コンポーネントまたはフックで使用する最もシンプルなパターン。

```typescript
// src/features/attendance/edit/model/useAttendanceForm.ts
import {
  useGetAttendanceByStaffAndDateQuery,
} from "@entities/attendance/api/attendanceApi";

export function useAttendanceForm(staffId: string, workDate: string) {
  const {
    data: attendance,
    isLoading,
    error,
    refetch,
  } = useGetAttendanceByStaffAndDateQuery(
    { staffId, workDate },
    { skip: !staffId || !workDate }, // 条件付きスキップ
  );

  return { attendance, isLoading, error, refetch };
}
```

### パターン 2: 遅延クエリ（命令的フェッチ）

ユーザー操作やイベントをトリガーとしてフェッチする場合は `useLazy*Query` を使用する。

```typescript
// src/features/attendance/edit/model/useAttendanceRecord.ts
import {
  useLazyGetAttendanceByStaffAndDateQuery,
} from "@entities/attendance/api/attendanceApi";

export function useAttendanceRecord() {
  const [triggerGetAttendance] = useLazyGetAttendanceByStaffAndDateQuery();

  const handleLoadAttendance = async (staffId: string, workDate: string) => {
    try {
      const result = await triggerGetAttendance({ staffId, workDate }).unwrap();
      // result を使った処理
    } catch (err) {
      // エラーハンドリング
    }
  };

  return { handleLoadAttendance };
}
```

### パターン 3: 複数スタッフの並列フェッチ（マップ状態管理）

スタッフごとに独立したローディング/エラー状態が必要な場合のパターン（`useAttendanceDailyFetch.ts` より）。

```typescript
// ローディング・エラー状態をスタッフ ID でマッピング
const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance[]>>({});
const [attendanceLoadingMap, setAttendanceLoadingMap] = useState<Record<string, boolean>>({});
const [attendanceErrorMap, setAttendanceErrorMap] = useState<Record<string, Error | null>>({});

const [triggerListAttendances] = useLazyListAttendancesByDateRangeQuery();

useEffect(() => {
  let isMounted = true;

  staffIds.forEach((staffId) => {
    setAttendanceLoadingMap((prev) => ({ ...prev, [staffId]: true }));

    triggerListAttendances({ staffId, startDate, endDate })
      .unwrap()
      .then((data) => {
        if (!isMounted) return;
        setAttendanceMap((prev) => ({ ...prev, [staffId]: data }));
        setAttendanceLoadingMap((prev) => ({ ...prev, [staffId]: false }));
      })
      .catch((err) => {
        if (!isMounted) return;
        setAttendanceErrorMap((prev) => ({ ...prev, [staffId]: err }));
        setAttendanceLoadingMap((prev) => ({ ...prev, [staffId]: false }));
      });
  });

  return () => { isMounted = false; };
}, [staffIds, startDate, endDate]);
```

**ポイント**: `isMounted` フラグでアンマウント後の state 更新を防ぐ。

---

## ローディング・エラー状態の推奨パターン

### RTK Query の組み込み状態を活用する

```typescript
const { data, isLoading, isFetching, isError, error } = useGetSomethingQuery(args);

// isLoading: 初回ロード中（データなし）
// isFetching: 再フェッチ中（既存データあり）
// isError: エラー発生
// error: GraphQLBaseQueryError | undefined
```

### リフェッチ時に古いデータを表示し続ける場合

`useCollaborativeShiftData.ts` のパターン：

```typescript
const { data, isLoading: isLoadingQuery } = useGetShiftRequestsQuery(args, {
  selectFromResult: (result) => ({
    ...result,
    // 再フェッチ時は既存データがあれば isLoading=false にする
    isLoading: result.isLoading && !result.data,
  }),
});
```

### エラーメッセージの正規化

`useCollaborativeShiftData.ts` のエラービルダーパターン：

```typescript
const buildErrorMessage = useCallback((err: unknown): string => {
  const base = err instanceof Error ? err.message : "予期しないエラーが発生しました";

  if (base.toLowerCase().includes("conditionalcheckfailed")) {
    return "他のユーザーが変更を加えたため保存に失敗しました。ページを再読み込みしてください。";
  }
  if (base.toLowerCase().includes("unauthorized")) {
    return "操作する権限がありません。";
  }
  if (base.toLowerCase().includes("network")) {
    return "ネットワークエラーが発生しました。接続を確認してください。";
  }
  return base;
}, []);
```

---

## Mutation パターン

```typescript
// src/features/shift/collaborative/hooks/useCollaborativeShiftData.ts
const [updateShiftCell] = useUpdateShiftCellMutation();

const handleCellUpdate = async (input: UpdateShiftCellInput) => {
  try {
    await updateShiftCell({ input }).unwrap();
    // 成功時の処理
  } catch (err) {
    const message = buildErrorMessage(err);
    dispatch(pushNotification({ tone: "error", message }));
  }
};
```

### 楽観的更新

```typescript
// キャッシュを即時更新し、失敗時にロールバック
updateShiftCell: builder.mutation<...>({
  invalidatesTags: (result, _error, arg) => [
    { type: "ShiftRequest", id: buildTagId(result) },
  ],
  // optimisticUpdate が必要な場合は onQueryStarted を使用
  async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      shiftApi.util.updateQueryData("getShiftRequests", arg.month, (draft) => {
        // draft を直接変更（Immer）
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patch.undo(); // 失敗時ロールバック
    }
  },
}),
```

---

## 通知（エラー・成功メッセージ）

グローバル通知は Redux の `notificationSlice` 経由で表示する。`window.dispatchEvent` でのカスタムイベントは避ける（既存の `attendanceApi.ts` の重複検知警告は例外的なパターン）。

```typescript
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useAppDispatch } from "@shared/lib/store";

const dispatch = useAppDispatch();

// 成功
dispatch(pushNotification({ tone: "success", message: "保存しました" }));

// エラー
dispatch(pushNotification({ tone: "error", message: "保存に失敗しました" }));

// 警告（dedupeKey で重複を防ぐ）
dispatch(pushNotification({
  tone: "warning",
  message: "重複データが検出されました",
  dedupeKey: "attendance-duplicate",
}));
```

---

## レースコンディション対策

### パターン 1: `isMounted` フラグ

useEffect のクリーンアップ関数でフラグを折ることで、アンマウント後の state 更新を防ぐ。

```typescript
useEffect(() => {
  let isMounted = true;

  fetchData().then((data) => {
    if (!isMounted) return;
    setData(data);
  });

  return () => { isMounted = false; };
}, [deps]);
```

### パターン 2: リクエスト ID（連続リクエストの最新のみ反映）

```typescript
// useAttendanceRecord.ts パターン
const requestIdRef = useRef(0);

const load = async () => {
  const requestId = ++requestIdRef.current;

  const data = await fetchData();

  if (requestId !== requestIdRef.current) return; // 古いレスポンスを破棄
  setData(data);
};
```

### パターン 3: `skip` オプション（RTK Query）

引数が揃うまでクエリを実行しない。

```typescript
const { data } = useGetAttendanceQuery(
  { staffId, workDate },
  { skip: !staffId || !workDate }
);
```

---

## アンチパターン

| ❌ 避けるべき | ✅ 推奨 |
|--------------|--------|
| `axios` や `fetch` を直接呼び出す | `graphqlBaseQuery` 経由の RTK Query |
| 取得したデータを Redux slice に格納する | RTK Query のキャッシュをそのまま使う |
| useEffect 内で無限ループを引き起こす依存配列 | `skip` オプションや `useRef` での安定化 |
| エラーを握りつぶす（catch で何もしない） | `pushNotification` で通知する |
| ポーリングで実装するリアルタイム更新 | GraphQL Subscription を使う |

---

## 関連ドキュメント

- [アーキテクチャ概要](./architecture/) — FSD レイヤー構造の詳細
- [Amplify 概要](./amplify/overview) — AppSync / GraphQL の接続設定
- [テスト運用](./testing-operations) — RTK Query を含むフックのテスト方法
