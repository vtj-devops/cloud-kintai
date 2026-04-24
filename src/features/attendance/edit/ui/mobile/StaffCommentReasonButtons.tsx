import { ReasonItem } from "@features/attendance/edit/ui/mobile/staffCommentInputUtils";

type ReasonButtonsProps = {
  reasons: ReasonItem[];
  disabled: boolean;
  onSelectReason: (reason: string) => void;
};

export function StaffCommentReasonButtons({
  reasons,
  disabled,
  onSelectReason,
}: ReasonButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {reasons.map((reason, index) => (
        <button
          key={`${reason.reason}-${index}`}
          type="button"
          data-testid={`staff-comment-reason-chip-${index}`}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-500/35 bg-white px-3 py-1.5 text-[13px] font-semibold leading-snug text-emerald-800 transition-[border-color,background-color,color,opacity] duration-150 ease-in-out hover:border-emerald-500/50 hover:bg-emerald-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(16_185_129/0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={() => onSelectReason(reason.reason)}
        >
          <span className="text-sm font-bold leading-none" aria-hidden>
            +
          </span>
          <span>{reason.reason}</span>
        </button>
      ))}
    </div>
  );
}
