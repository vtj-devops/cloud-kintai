import { REACTION_META, type ReactionType, type ReportReaction } from "../data";

interface Props {
  reactions: ReportReaction[];
  selectedReactions: ReactionType[];
  isDisabled: boolean;
  isResolving: boolean;
  hasEntries: boolean;
  onToggle: (type: ReactionType) => void;
}

export function DailyReportReactionSection({
  reactions,
  selectedReactions,
  isDisabled,
  isResolving,
  hasEntries,
  onToggle,
}: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        リアクション
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(REACTION_META) as ReactionType[]).map((type) => {
          const meta = REACTION_META[type];
          const count = reactions.find((r) => r.type === type)?.count ?? 0;
          const isSelected = selectedReactions.includes(type);
          return (
            <button
              key={type}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onToggle(type);
              }}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition",
                isSelected
                  ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                isDisabled ? "cursor-not-allowed opacity-50" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {meta.emoji} {meta.label}
              {count > 0 && (
                <span className="ml-1 text-slate-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>
      {(!hasEntries || isResolving) && (
        <p className="text-xs text-slate-400">
          スタッフ情報およびリアクション履歴の取得完了後に操作できます。
        </p>
      )}
      {reactions.length === 0 && (
        <p className="text-xs text-slate-400">まだリアクションはありません。</p>
      )}
    </div>
  );
}
