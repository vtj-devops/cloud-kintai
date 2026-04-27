import type { ReactNode } from "react";

type FormErrorMessageProps = {
  message?: ReactNode;
  className?: string;
};

/**
 * フォームのサブミットレベルエラー（フィールド外エラー）を表示するコンポーネント。
 *
 * フィールドごとのエラーには RHFTextField の helperText/error を使用し、
 * API エラーなどフォーム全体のエラーにはこのコンポーネントを使用する。
 *
 * 使用例:
 * ```tsx
 * const [submitError, setSubmitError] = useState<string | null>(null);
 *
 * const onSubmit = async (data: FormData) => {
 *   try {
 *     await someApiCall(data);
 *   } catch {
 *     setSubmitError("送信に失敗しました。もう一度お試しください。");
 *   }
 * };
 *
 * return (
 *   <form onSubmit={handleSubmit(onSubmit)}>
 *     <FormErrorMessage message={submitError} />
 *     ...
 *   </form>
 * );
 * ```
 */
export function FormErrorMessage({
  message,
  className,
}: FormErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className={[
        "m-0 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {message}
    </p>
  );
}
