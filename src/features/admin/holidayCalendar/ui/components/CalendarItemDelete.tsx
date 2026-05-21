import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { useDeleteWithConfirm } from "@shared/lib/hooks/useDeleteWithConfirm";
import type { MessageGenerator } from "@shared/lib/message/Message";
import { MessageStatus } from "@shared/lib/message/Message";
import { AppDeleteIconButton } from "@shared/ui/button/AppActionIconButton";
import dayjs from "dayjs";

type Props<TInput> = {
  date: string;
  name: string;
  deleteInput: TInput;
  messageFactory: MessageGenerator;
  onDelete: (input: TInput) => Promise<void>;
};

export function CalendarItemDelete<TInput extends { id: string }>({
  date,
  name,
  deleteInput,
  messageFactory,
  onDelete,
}: Props<TInput>) {
  const confirmMessage = `「${dayjs(date).format(AttendanceDate.DisplayFormat)}(${name})」を削除しますか？\nこの操作は取り消せません。`;
  const handleDelete = useDeleteWithConfirm<TInput>(
    confirmMessage,
    onDelete,
    messageFactory.delete(MessageStatus.SUCCESS),
    messageFactory.delete(MessageStatus.ERROR),
  );
  return <AppDeleteIconButton onClick={() => handleDelete(deleteInput)} />;
}
