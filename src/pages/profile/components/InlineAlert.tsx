import React from "react";

interface InlineAlertProps {
  variant: "success" | "error";
  children: string;
  onClose?: () => void;
}

export const InlineAlert = React.memo(function InlineAlert({
  variant,
  children,
  onClose,
}: InlineAlertProps) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div
      className={[
        "flex min-w-0 items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
        styles,
      ].join(" ")}
    >
      <p className="m-0 min-w-0 break-words leading-6">{children}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-semibold opacity-70 transition hover:opacity-100"
        >
          閉じる
        </button>
      ) : null}
    </div>
  );
});
