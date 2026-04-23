import type { ReactNode } from "react";

export type InlineAlertProps = {
  children: ReactNode;
  tone: "info" | "warning" | "error" | "success";
  icon?: ReactNode;
  className?: string;
  onClose?: () => void;
  title?: string;
};

const toneClassName: Record<InlineAlertProps["tone"], string> = {
  info: "border-sky-500/15 bg-sky-50/90 text-sky-950",
  warning: "border-amber-500/20 bg-amber-50/90 text-amber-950",
  error: "border-rose-500/20 bg-rose-50/90 text-rose-950",
  success: "border-emerald-500/20 bg-emerald-50/90 text-emerald-950",
};

export const InlineAlert = ({
  children,
  tone,
  icon,
  className,
  onClose,
  title,
}: InlineAlertProps) => (
  <div
    className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 ${toneClassName[tone]} ${className ?? ""}`}
  >
    {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
    <div className="min-w-0 flex-1 text-sm leading-6">
      {title ? <div className="font-semibold">{title}</div> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-current/70 transition hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20"
      >
        閉じる
      </button>
    ) : null}
  </div>
);
