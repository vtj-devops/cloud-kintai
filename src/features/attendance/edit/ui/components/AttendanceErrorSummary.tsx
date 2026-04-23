import { AlertWithMessageList } from "@shared/ui/feedback/AlertWithMessageList";

type AttendanceErrorSummaryProps = {
  messages: string[];
  title?: string;
  variant?: "desktop" | "mobile";
};

const classNameByVariant = {
  desktop: "rounded-[8px]",
  mobile: "rounded-[6px]",
} as const;

export function AttendanceErrorSummary({
  messages,
  title = "入力内容に誤りがあります。",
  variant = "desktop",
}: AttendanceErrorSummaryProps) {
  return (
    <AlertWithMessageList
      messages={messages}
      title={title}
      className={classNameByVariant[variant]}
    />
  );
}
