type AlertTone = "error" | "warning";

type AlertWithMessageListProps = {
  messages: string[];
  title?: string;
  tone?: AlertTone;
  role?: string;
  className?: string;
};

const containerClass: Record<AlertTone, string> = {
  error: "rounded-[8px] border border-rose-500/15 bg-rose-50/90 px-4 py-3",
  warning: "rounded-[8px] border border-amber-500/15 bg-amber-50/90 px-4 py-3",
};

const titleClass: Record<AlertTone, string> = {
  error: "text-sm font-semibold text-rose-900",
  warning: "text-sm font-semibold text-amber-900",
};

const itemClass: Record<AlertTone, string> = {
  error: "text-sm text-rose-900",
  warning: "text-sm text-amber-900",
};

export function AlertWithMessageList({
  messages,
  title,
  tone = "error",
  role = "alert",
  className,
}: AlertWithMessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={[containerClass[tone], className].filter(Boolean).join(" ")}
      role={role}
    >
      {title && <div className={titleClass[tone]}>{title}</div>}
      <div className="mt-2 flex flex-col gap-1">
        {messages.map((message) => (
          <div key={message} className={itemClass[tone]}>
            {message}
          </div>
        ))}
      </div>
    </div>
  );
}
