import { formatDateTimeReadable } from "@shared/lib/time";

import type { AdminComment } from "../data";

interface Props {
  comments: AdminComment[];
  commentInput: string;
  isSubmitDisabled: boolean;
  isResolving: boolean;
  hasEntries: boolean;
  onInputChange: (value: string) => void;
  onClearError: () => void;
  onSubmit: () => void;
}

export function DailyReportCommentSection({
  comments,
  commentInput,
  isSubmitDisabled,
  isResolving,
  hasEntries,
  onInputChange,
  onClearError,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        コメント
      </p>
      <div className="space-y-2">
        <textarea
          value={commentInput}
          onChange={(e) => {
            onClearError();
            onInputChange(e.target.value);
          }}
          placeholder="コメントを入力"
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className="inline-flex h-8 items-center rounded-lg border-0 bg-emerald-600 px-4 text-xs font-semibold text-white shadow-none transition hover:bg-emerald-700 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            コメントを追加
          </button>
        </div>
        {(!hasEntries || isResolving) && (
          <p className="text-xs text-slate-400">
            スタッフ情報およびコメント履歴の取得完了後に登録できます。
          </p>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="text-xs text-slate-400">まだコメントはありません。</p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  {comment.author}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTimeReadable(comment.createdAt) ||
                    comment.createdAt}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
