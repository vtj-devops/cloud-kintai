import { AlertWithMessageList } from "@shared/ui/feedback/AlertWithMessageList";

type AttendanceEditErrorAlertProps = {
  messages: string[];
};

export function AttendanceEditErrorAlert({
  messages,
}: AttendanceEditErrorAlertProps) {
  return (
    <AlertWithMessageList
      messages={messages}
      title="入力内容に誤りがあります。"
      className="mb-2"
    />
  );
}
