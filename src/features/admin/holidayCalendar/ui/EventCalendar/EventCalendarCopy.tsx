import { TextField } from "@mui/material";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  CreateEventCalendarInput,
  EventCalendar,
} from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { CopyCalendarItem } from "@features/admin/holidayCalendar/ui/components/CopyCalendarItem";

export default function EventCalendarCopy({
  eventCalendar,
  createEventCalendar,
}: {
  eventCalendar: EventCalendar;
  createEventCalendar: (
    input: CreateEventCalendarInput,
  ) => Promise<void | EventCalendar>;
}) {
  return (
    <CopyCalendarItem
      item={eventCalendar}
      dialogTitle="イベントをコピー"
      dialogDescription="コピー元のイベント情報が入力されています。必要に応じて変更してください。"
      nameLabel="イベント名"
      submitLabel="コピーして作成"
      messageFactory={EventCalendarMessage()}
      getDate={(item) => item.eventDate ?? ""}
      getName={(item) => item.name ?? ""}
      getDescription={(item) => item.description ?? ""}
      serializeDate={(date) => date.format(AttendanceDate.DataFormat)}
      showDatePickerError
      buildCreateInput={({ date, name, description }) => ({
        eventDate: date,
        name,
        description: description || undefined,
      })}
      createItem={createEventCalendar}
      renderExtraFields={(register) => (
        <TextField
          label="詳細 (任意)"
          multiline
          rows={3}
          {...register("description")}
        />
      )}
    />
  );
}

