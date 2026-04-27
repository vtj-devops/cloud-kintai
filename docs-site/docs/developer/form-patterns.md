---
title: フォーム実装パターン
sidebar_label: フォーム実装パターン
---

# フォーム実装パターン

このプロジェクトでは **React Hook Form (RHF) + Zod** を標準のフォーム実装スタックとして使用します。

## 基本構成

```
フォームロジック (useForm / zodResolver) → カスタムフック (use*Form)
フォーム UI コンポーネント → shared/ui/form/ のコンポーネントを使用
バリデーション定義 → entities/**/validation/ 以下の Zod スキーマ
```

---

## 1. Zod スキーマの定義

バリデーションスキーマは `entities` レイヤーの `validation/` ディレクトリに配置します。

```ts
// src/entities/attendance/validation/attendanceEditSchema.ts
import { z } from "zod";
import { validationMessages } from "@shared/config/validationMessages";

export const attendanceEditSchema = z.object({
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: validationMessages.attendance.workTime.range,
      path: ["endTime"],
    });
  }
});
```

エラーメッセージは `src/shared/config/validationMessages.ts` に集約し、スキーマ内でハードコードしません。

---

## 2. useForm の設定

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mySchema } from "@entities/.../validation/mySchema";

type FormInputs = z.infer<typeof mySchema>;

const {
  register,
  control,
  handleSubmit,
  formState: { isDirty, isValid, isSubmitting, errors },
} = useForm<FormInputs>({
  mode: "onChange",       // リアルタイムバリデーション
  defaultValues: { ... },
  resolver: zodResolver(mySchema),
});
```

### mode の選択指針

| mode | 用途 |
|------|------|
| `"onChange"` | リアルタイムにフィールドを検証したい場合（勤怠編集など） |
| `"onSubmit"` | サブミット時のみ検証すれば十分な場合 |
| `"onBlur"` | フォーカスを外したタイミングで検証したい場合 |

---

## 3. 共通フォームコンポーネント

### RHFTextField

RHF の `Controller` をラップしたテキスト入力コンポーネントです。

```tsx
import { RHFTextField } from "@shared/ui/form";

<RHFTextField
  name="remarks"
  control={control}
  label="備考"
  placeholder="例：在宅勤務"
  fullWidth
  multiline
  minRows={3}
/>
```

**Props の概要:**

| Prop | 型 | 説明 |
|------|----|------|
| `name` | `Path<TFieldValues>` | フォームフィールド名 |
| `control` | `Control<TFieldValues>` | useForm の control |
| `label` | `ReactNode` | ラベルテキスト |
| `required` | `boolean` | 必須マーク (`*`) 表示 |
| `helperText` | `ReactNode` | ヘルパーテキスト（エラーがない場合に表示） |
| `error` | `boolean` | 外部からエラー状態を上書きする場合 |
| `fullWidth` | `boolean` | 幅 100% |
| `multiline` | `boolean` | テキストエリアとして表示 |
| `size` | `"small" \| "medium"` | 入力サイズ（デフォルト: `"medium"`） |

エラーメッセージは `fieldState.error.message` から自動表示されます。

### DateField

スタンドアロンの日付入力コンポーネントです（RHF 非依存）。RHF と組み合わせる場合は `Controller` でラップします。

```tsx
import DateField from "@shared/ui/form/DateField";
import { Controller } from "react-hook-form";

<Controller
  name="targetDate"
  control={control}
  render={({ field, fieldState }) => (
    <DateField
      label="対象日"
      value={field.value ? dayjs(field.value) : null}
      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") ?? null)}
      errorText={fieldState.error?.message}
      required
    />
  )}
/>
```

### TimeInput

時刻入力コンポーネントです（`@shared/ui/TimeInput` から import）。

```tsx
import { TimeInput } from "@shared/ui/TimeInput";
```

### FormErrorMessage

フィールド外のサブミットレベルエラー（API エラーなど）を表示するコンポーネントです。

```tsx
import { FormErrorMessage } from "@shared/ui/form";

const [submitError, setSubmitError] = useState<string | null>(null);

<FormErrorMessage message={submitError} />
```

---

## 4. サブミット処理のパターン

### 基本パターン

```tsx
const onSubmit = async (data: FormInputs) => {
  try {
    await someApiCall(data);
    dispatch(pushNotification({ tone: "success", message: "保存しました" }));
    onClose();
  } catch {
    dispatch(pushNotification({ tone: "error", message: "保存に失敗しました" }));
  }
};

// フォームの送信ボタン
<AppButton
  loading={isSubmitting}
  disabled={!isDirty || !isValid || isSubmitting}
  onClick={handleSubmit(onSubmit)}
>
  保存
</AppButton>
```

### ローディング状態

RHF の `formState.isSubmitting` を使います。`onSubmit` 関数が `async` であれば、Promise の解決/拒否まで自動で `true` になります。

```ts
// ✅ isSubmitting は onSubmit の Promise が完了するまで true
const { formState: { isSubmitting } } = useForm();
```

独自の `useState` による isLoading 管理は不要です。

### インライン submit エラー表示が必要な場合

スナックバー通知ではなくフォーム内にエラーを表示したい場合:

```tsx
const [submitError, setSubmitError] = useState<string | null>(null);

const onSubmit = async (data: FormInputs) => {
  setSubmitError(null);
  try {
    await someApiCall(data);
  } catch (error) {
    setSubmitError("保存に失敗しました。もう一度お試しください。");
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <FormErrorMessage message={submitError} />
    ...
  </form>
);
```

---

## 5. フォームロジックをカスタムフックに分離する

フォームが複雑になる場合、ロジックをカスタムフックに切り出します（`use*Form` 命名規約）。

```ts
// src/pages/.../useMyFeatureForm.ts
export function useMyFeatureForm(initialData: MyData) {
  const { register, control, handleSubmit, formState } = useForm<FormInputs>({
    mode: "onChange",
    defaultValues: buildDefaultValues(initialData),
    resolver: zodResolver(mySchema),
  });

  return {
    register,
    control,
    handleSubmit,
    isDirty: formState.isDirty,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
  };
}
```

**メリット:**
- コンポーネントとフォームロジックの関心分離
- テストしやすい（フックのみテストできる）
- 同じフォームを複数 UI（デスクトップ/モバイル）で共有できる

---

## 6. バリデーションのパターン

### 単純な必須チェック

```ts
const schema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
});
```

### 複数フィールドにまたがるバリデーション（superRefine）

```ts
const schema = z.object({
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
}).superRefine((data, ctx) => {
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "終了時刻は開始時刻より後にしてください",
      path: ["endTime"],
    });
  }
});
```

### カスタムバリデーター

複雑なバリデーションロジックは `validators.ts` に純粋関数として切り出します。

```ts
// src/entities/.../validation/validators.ts
export function createTimeRangeValidator(schema: z.ZodObject<...>, messages: ...) {
  return schema.superRefine((data, ctx) => { ... });
}
```

---

## 7. 既存コードへの注意

- `AddHolidayCalendar` など古いコンポーネントは `zodResolver` を使わず、`Controller` の `rules` プロパティで直接バリデーションを定義しています。新規コードでは Zod スキーマを使用してください。
- MUI の `TextField` を直接使っている既存コンポーネントがありますが、新規実装では `RHFTextField` を使用してください。

---

## 関連ファイル

| ファイル | 用途 |
|---------|------|
| `src/shared/ui/form/RHFTextField.tsx` | RHF 統合テキスト入力 |
| `src/shared/ui/form/DateField.tsx` | 日付入力 |
| `src/shared/ui/form/FormErrorMessage.tsx` | サブミットレベルエラー表示 |
| `src/shared/ui/TimeInput/` | 時刻入力 |
| `src/shared/config/validationMessages.ts` | バリデーションエラーメッセージ定数 |
| `src/entities/attendance/validation/attendanceEditSchema.ts` | 勤怠編集スキーマの実装例 |
| `src/pages/attendance/edit/useAttendanceForm.ts` | カスタムフックの実装例 |
