type ProgressBarProps = {
  className?: string;
  "data-testid"?: string;
};

export function ProgressBar(props: ProgressBarProps) {
  return (
    <div
      {...props}
      role="progressbar"
      className={[
        "h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80",
        "MuiLinearProgress-root",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function FullPageLoading({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <ProgressBar data-testid="layout-linear-progress" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Spinner />
        <p
          className="text-sm font-medium text-slate-500"
          data-testid="layout-loading-message"
        >
          {message}
        </p>
      </div>
    </div>
  );
}
