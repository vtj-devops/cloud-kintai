import { TextField } from "@mui/material";
import { EventCalendar } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { EditCalendarItem } from "@features/admin/holidayCalendar/ui/components/EditCalendarItem";

export default function EventCalendarEdit({
  eventCalendar,
  updateEventCalendar,
}: {
  eventCalendar: EventCalendar;
  updateEventCalendar: (input: EventCalendar) => Promise<EventCalendar>;
}) {
  return (
    <EditCalendarItem
      item={eventCalendar}
      dialogTitle="イベントを編集"
      dialogDescription="イベント日と名前、詳細（任意）を入力してください。"
      nameLabel="イベント名"
      messageFactory={EventCalendarMessage()}
      getDate={(item) => item.eventDate}
      getName={(item) => item.name}
      getDescription={(item) => item.description ?? ""}
      buildUpdatePayload={(item, { date, name, description }) => ({
        ...item,
        eventDate: date!.toISOString(),
        name,
        description: description || undefined,
      })}
      updateItem={updateEventCalendar}
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

